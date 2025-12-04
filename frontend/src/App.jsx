import React from 'react';
import Uploader from './Uploader';
import Chat from './Chat';

function App() {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif' 
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '5px' }}>
        Agentic RAG Assistant
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        COMP258 Lab 4 - FAISS + LangGraph Implementation
      </p>
      
      <Uploader onUploadComplete={() => console.log("File ready")} />
      <Chat />
      
    </div>
  );
}

export default App;