# Agentic RAG System (COMP258 Lab 4)

This project implements an Agentic RAG system using **FastAPI**, **LangGraph**, **Gemini**, and **React 19**.

## 🚀 Features
- **Document Ingestion**: Loads text files, splits them, and creates Gemini embeddings stored in FAISS.
- **Agentic Retrieval**: Uses LangGraph to create an agent that can decide when to retrieve information.
- **Memory**: Maintains conversation history for context-aware responses.
- **Modern UI**: React 19 frontend with a dark-mode chat interface.

## 📂 Structure
- `backend/`: FastAPI application and RAG logic.
- `frontend/`: React 19 application (Vite).
- `data/`: Place your text documents here.

## 🛠️ Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- Google Gemini API Key

### 1. Backend Setup
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
   - Edit `.env` in the root directory and add your key:
     ```
     GOOGLE_API_KEY=your_api_key_here
     ```

### 2. Ingest Documents
Place your `.txt` files in `backend/data`. Then run:
```bash
python backend/ingest.py
```
This will create the FAISS index in `backend/faiss_index`.

### 3. Run Backend
```bash
python backend/main.py
```
Server runs at `http://localhost:8000`.

### 4. Frontend Setup
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

## 🧠 Agentic Logic
The agent is built with **LangGraph**:
1. It receives a user message.
2. It decides whether to use the `search_documents` tool based on the query.
3. If it retrieves documents, it uses the context to answer.
4. It maintains memory of the conversation.

## 📝 API
- `POST /api/chat`:
  - Input: `{ "message": "...", "history": [...] }`
  - Output: `{ "response": "...", "context": [...] }`
