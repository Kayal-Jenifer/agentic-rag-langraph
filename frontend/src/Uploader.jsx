import React, { useState } from 'react';
import axios from 'axios';

const Uploader = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage("Ingesting document... please wait.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post('http://localhost:8001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage("Success! Document added to knowledge base.");
      onUploadComplete();
    } catch (error) {
      console.error(error);
      setMessage(" Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ 
      border: '1px solid #ccc', 
      padding: '20px', 
      marginBottom: '20px', 
      borderRadius: '8px' 
    }}>
      <h3>1. Upload Knowledge Document</h3>
      <input 
        type="file" 
        accept=".pdf,.txt" 
        onChange={(e) => setFile(e.target.files[0])} 
      />
      <button 
        onClick={handleUpload} 
        disabled={uploading || !file} 
        style={{ marginLeft: '10px' }}
      >
        {uploading ? "Ingesting..." : "Upload & Process"}
      </button>
      {message && (
        <p style={{ 
          color: message.includes("Error") || message.includes("❌") ? 'red' : 'green', 
          marginTop: '10px' 
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Uploader;