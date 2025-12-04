import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
# Import the new loader function
from rag_agent import ingest_document, get_rag_agent, load_existing_index

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PERSISTENT FOLDER CONFIG ---
UPLOAD_DIR = "data/source_docs"  
os.makedirs(UPLOAD_DIR, exist_ok=True)

chat_sessions: Dict[str, List[Dict[str, str]]] = {}

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    session_id: str = "default"

# --- 1. LOAD INDEX ON STARTUP ---
@app.on_event("startup")
async def startup_event():
    print("--- 🚀 Backend Starting... Checking for existing Knowledge Base ---")
    load_existing_index()

@app.get("/")
def read_root():
    return {"status": "Agentic RAG Backend Running"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        # Save file permanently to data/source_docs
        file_location = f"{UPLOAD_DIR}/{file.filename}"
        
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"File saved to: {file_location}")
        
        # Ingest (Process into FAISS)
        success = ingest_document(file_location)
        
        if success:
            return {"message": "File processed and saved successfully."}
        else:
            raise HTTPException(status_code=500, detail="Ingestion failed internally.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history(session_id: str = "default"):
    return {"history": chat_sessions.get(session_id, [])}

@app.delete("/api/history")
def clear_history(session_id: str = "default"):
    if session_id in chat_sessions:
        chat_sessions[session_id] = []
    return {"message": "History cleared"}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        if request.session_id not in chat_sessions:
            chat_sessions[request.session_id] = []

        if not request.message and not request.history:
            chat_sessions[request.session_id] = []
            return {"response": "History cleared.", "retrieved_context": ""}

        response_text, context_text = get_rag_agent(request.message, request.history)
        
        chat_sessions[request.session_id].append({"role": "user", "content": request.message})
        chat_sessions[request.session_id].append({"role": "assistant", "content": response_text})

        return {
            "response": response_text,
            "retrieved_context": context_text, 
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
