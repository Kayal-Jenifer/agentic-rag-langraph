import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage
from langchain_core.tools import StructuredTool

load_dotenv()

if not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = "your_google_api_key_here"

# Global Variables
vector_store = None
DB_PATH = "data/faiss_index"
document_content = []

# Loads the gemini model
def get_llm():
    try:
        return ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0)
    except:
        return ChatGoogleGenerativeAI(model="gemini-pro", temperature=0)
    
# Converts every chunk of document text into a numeric vector
def get_embeddings():
    return GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

# --- Function to load index on startup ---
def load_existing_index():
    """Loads the FAISS index from disk if it exists."""
    global vector_store
    if os.path.exists(DB_PATH):
        try:
            print("--- 📂 Loading existing FAISS index... ---")
            vector_store = FAISS.load_local(
                DB_PATH, get_embeddings(), allow_dangerous_deserialization=True
            )
            print(f"--- ✅ Index Loaded: {vector_store.index.ntotal} vectors available ---")
            return True
        except Exception as e:
            print(f"⚠️ Could not load index: {e}")
    return False



def ingest_document(file_path: str):
    global vector_store, document_content
    print(f"--- Processing File: {file_path} ---")
    try:
        if file_path.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        else:
            loader = TextLoader(file_path)
        
        docs = loader.load()
        print(f"--- Loaded {len(docs)} pages ---")

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        
        document_content = [doc.page_content for doc in splits]
        
        print("--- Creating Embeddings... ---")
        # If vector_store exists, we add to it. If not, we create new.
        if vector_store is None:
            vector_store = FAISS.from_documents(splits, get_embeddings())
        else:
            vector_store.add_documents(splits)

        # SAVE to disk so it persists
        vector_store.save_local(DB_PATH)
        print(f"--- ✅ Success: Document saved to {DB_PATH} ---")
        
        return True
    except Exception as e:
        print(f"Ingestion Error: {e}")
        return False

def simple_text_search(query: str, top_k: int = 3):
    """Fallback search"""
    if not document_content: return ["No live documents (check FAISS)."]
    query_lower = query.lower()
    scored_docs = [(sum(1 for w in query_lower.split() if w in d.lower()), d) for d in document_content]
    scored_docs.sort(reverse=True, key=lambda x: x[0])
    return [doc for _, doc in scored_docs[:top_k]] if scored_docs else []

def search_documents_function(search_query: str) -> str:
    global vector_store
    print(f"🔍 Tool searching for: {search_query}")
    
    # Reload if None (Just in case)
    if vector_store is None:
        load_existing_index()

    # retrieve chunks from FAISS
    try:
        if vector_store:
            retriever = vector_store.as_retriever(search_kwargs={"k": 4})
            docs = retriever.invoke(search_query) 
            return "\n\n".join([doc.page_content for doc in docs])
        else:
            return "No documents found in knowledge base."
    except Exception as e:
        return f"Search error: {e}"



def get_rag_agent(query: str, history: list = []):
    # Ensure index is loaded
    if vector_store is None:
        load_existing_index()

    search_tool = StructuredTool.from_function(
        func=search_documents_function, 
        name="search_documents",
        description="Searches uploaded documents. Input is the user's question."
    )
    
    agent = create_react_agent(get_llm(), [search_tool])
    
    system_text = "You are a helpful assistant. Answer using ONLY the 'search_documents' tool."
    
    messages = [SystemMessage(content=system_text)]
    for msg in history:
        messages.append((msg.get("role"), msg["content"]))
    messages.append(("user", query))

    try:
        response = agent.invoke({"messages": messages})
        answer = response["messages"][-1].content
        
        # Context extraction for UI
        context_text = ""
        if vector_store:
            docs = vector_store.as_retriever(search_kwargs={"k": 2}).invoke(query)
            context_text = "\n...\n".join([d.page_content for d in docs])
            
        return answer, context_text
    except Exception as e:
        print(f"Agent Error: {e}")
        return "An error occurred.", ""