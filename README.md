# Agentic RAG System (COMP258 Lab 4)

This project implements an Agentic RAG system using **FastAPI**, **LangGraph**, **Gemini**, **FAISS** and **React 19**.
Users can upload PDF/TXT documents, which are converted into embeddings, stored in a persistent FAISS index, and later used by an intelligent ReAct-based agent to answer questions with grounded, document-backed responses.

---

## 🚀 Features
**Document Upload & Ingestion**
- Users upload PDFs or text files.
- Documents are loaded using LangChain loaders.
- Text is split into chunks using RecursiveCharacterTextSplitter.
- Embeddings generated using GoogleGenerativeAIEmbeddings (text-embedding-004).
- Stored in a persistent FAISS index (data/faiss_index).

**Agentic RAG with LangGraph ReAct Agent**
- Uses Google Gemini (gemini-2.5-flash-lite) as the LLM.
- ReAct agent chooses when to call the retrieval tool.
- Ensures: multi-step reasoning, grounded answers, no hallucinations.
- The agent uses only the search_documents tool to fetch context.
  
**FAISS-Based Knowledge Retrieval**
- Fast vector search.
- Auto-loads index on backend startup.
- Supports incremental updates when new documents are uploaded.

**Chat Interface (React Frontend)**
- Displays agent responses.
- Context retrieval toggle.
- Chat history stored & retrievable.
- Sidebar for viewing complete conversation history.

**Backend API (FastAPI)**
- /upload → Ingest and embed documents
- /api/chat → Query the agent
- /api/history → Access or clear session history
- Automatically loads FAISS index on startup

---

## 📂 Structure
```
backend/
│── app.py               # FastAPI server
│── rag_agent.py         # Agent logic + ingestion + FAISS loading
│── data/
│     ├── faiss_index/   # Persisted FAISS DB
│     └── source_docs/   # Uploaded documents
│── requirements.txt
│
frontend/
│── src/
│     ├── App.jsx
│     ├── Chat.jsx
│     └── Uploader.jsx

```
---

### Backend Setup
1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment:
   Edit `.env` in the root directory and add your key:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```
### Run Backend
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```
Server runs at `http://localhost:8001`.

### Frontend Setup
1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run Development Server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

---

## Workflow
- 1.User uploads a document: Stored permanently → Split → Embedded → Saved into FAISS.
- 2.User asks a question: Sent to backend → ReAct agent evaluates.
- 3.Agent decides to use search tool: Searches FAISS → Retrieves relevant context.
- 4.Agent composes the final answer: Always grounded in retrieved document chunks.
