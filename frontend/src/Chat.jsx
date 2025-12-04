import React, { useState, useEffect } from "react";
import axios from "axios";

const Chat = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Toggle States
  const [showContext, setShowContext] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [fullHistory, setFullHistory] = useState([]);

  const SESSION_ID = "default";

  // LOAD HISTORY ON START
  useEffect(() => {
    loadFullHistory(false); 
  }, []);

  // FETCH HISTORY FUNCTION
  const loadFullHistory = async (openPanel = true) => {
    try {
      const res = await axios.get("http://localhost:8001/api/history", {
        params: { session_id: SESSION_ID },
      });
      const hist = res.data.history || [];
      
      setFullHistory(hist);
      
      // Update main chat window if empty
      if (messages.length === 0 && hist.length > 0) {
        setMessages(hist.map(h => ({
            sender: h.role === "user" ? "user" : "bot",
            text: h.content
        })));
      }

      if (openPanel) setShowHistoryPanel(true);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  // SEND MESSAGE
  const handleSend = async () => {
    if (!query.trim()) return;

    const newMessages = [...messages, { sender: "user", text: query }];
    setMessages(newMessages);
    setLoading(true);
    const currentQuery = query;
    setQuery("");

    try {
      const res = await axios.post("http://localhost:8001/api/chat", {
        message: currentQuery,
        history: history,
        session_id: SESSION_ID,
      });

      const botMessage = {
        sender: "bot",
        text: res.data.response,
      };

      setMessages([...newMessages, botMessage]);

      // Update local history tracking
      setHistory([
        ...history,
        { role: "user", content: currentQuery },
        { role: "assistant", content: res.data.response },
      ]);
      
      // Refresh sidebar history in background
      loadFullHistory(false);

    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { sender: "bot", text: "Error connecting to backend." }]);
    } finally {
      setLoading(false);
    }
  };

  // CLEAR HISTORY
  const clearHistory = async () => {
    try {
      await axios.delete(`http://localhost:8001/api/history?session_id=${SESSION_ID}`);
      setMessages([]);
      setHistory([]);
      setFullHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* MAIN UI */}
      <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", minHeight: "400px", display: "flex", flexDirection: "column" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <h3>2. Agentic RAG Chat</h3>
          <div>
            <button onClick={() => loadFullHistory(true)} style={{ marginRight: "10px", padding: "5px 10px", cursor: "pointer" }}>
              Show History
            </button>
            <button onClick={clearHistory} style={{ padding: "5px 10px", color: "red", cursor: "pointer" }}>
              Clear
            </button>
          </div>
        </div>

        {/* CHAT MESSAGES */}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: "10px", padding: "10px", background: "#f9f9f9", borderRadius: "6px", maxHeight: "500px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ textAlign: msg.sender === "user" ? "right" : "left", marginBottom: "15px" }}>
              
              {/* Message Bubble */}
              <div style={{ 
                display: "inline-block", 
                background: msg.sender === "user" ? "#007bff" : "#e0e0e0", 
                color: msg.sender === "user" ? "white" : "black", 
                padding: "10px", 
                borderRadius: "12px",
                maxWidth: "80%",
                textAlign: "left"
              }}>
                <strong>{msg.sender === "user" ? "You" : "Agent"}</strong>
                <br />
                {msg.text}
              </div>

              {/* CONTEXT DISPLAY (Only shows if toggle is ON and context exists) */}
              {showContext && msg.sender === "bot" && msg.context && (
                <div style={{
                  marginTop: "5px",
                  padding: "8px",
                  background: "#fff",
                  borderLeft: "4px solid #f0ad4e",
                  fontSize: "0.85em",
                  color: "#333",
                  textAlign: "left",
                  maxWidth: "80%",
                  display: "inline-block" // Align with bubble
                }}>
                  <strong>📄 Retrieved Context:</strong>
                  <pre style={{ whiteSpace: "pre-wrap", margin: "5px 0 0 0", fontFamily: "monospace" }}>
                    {msg.context.substring(0, 300)}... {/* Truncate to keep UI clean */}
                  </pre>
                </div>
              )}

            </div>
          ))}
          {loading && <p style={{ color: "#777" }}>🤖 Agent is thinking...</p>}
        </div>

        {/* INPUT */}
        <div style={{ display: "flex", gap: "10px" }}>
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            onKeyPress={(e) => e.key === "Enter" && handleSend()} 
            placeholder="Ask a question..." 
            style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} 
          />
          <button onClick={handleSend} style={{ padding: "10px 20px", background: "#007bff", color: "white", borderRadius: "6px" }}>
            Send
          </button>
        </div>
      </div>

      {/* HISTORY SIDEBAR */}
      {showHistoryPanel && (
        <div style={{
          position: "fixed", right: 0, top: 0, height: "100%", width: "350px",
          background: "#222", color: "white", padding: "20px", overflowY: "auto",
          boxShadow: "-4px 0 10px rgba(0,0,0,0.3)", zIndex: 1000
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3>Chat History</h3>
            <button onClick={() => setShowHistoryPanel(false)} style={{ padding: "5px 10px", background: "red", color: "white", borderRadius: "4px", border: "none", cursor: "pointer" }}>
              Close
            </button>
          </div>

          {fullHistory.length === 0 && <p>No saved history.</p>}

          {fullHistory.map((msg, i) => (
            <div key={i} style={{ padding: "10px", marginBottom: "10px", background: msg.role === "user" ? "#444" : "#555", borderRadius: "6px" }}>
              <strong style={{ color: "#aaa", fontSize: "0.8em", textTransform: "uppercase" }}>{msg.role}</strong>
              <div style={{ marginTop: "4px" }}>{msg.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chat;
