import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Chat.css";

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { sender: "consultant", text: "Hello! How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() !== "") {
      setMessages([...messages, { sender: "patient", text: input }]);
      setInput("");

      // Simulate consultant response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: "consultant", text: "I will check that for you." }
        ]);
      }, 1500);
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <button onClick={() => navigate("/dashboard")} className="back-btn">⬅</button>
        <h2>Consultant Chat</h2>
        <div className="status-indicator">
          <span className="online-dot"></span> Online
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-body">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
            <div className="avatar">{msg.sender === "consultant" ? "👨‍⚕️" : "🧑"}</div>
            <div className="message-bubble">{msg.text}</div>
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      {/* Message Input */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} className="send-btn">📩</button>
      </div>
    </div>
  );
};

export default Chat;
