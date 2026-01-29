"use client"

import { useState } from "react"
import "./chatbot.css"

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const toggleChatbot = () => {
    setIsOpen(!isOpen)
  }

  const handleInputChange = (e) => {
    setUserInput(e.target.value)
  }

  const handleSend = async () => {
    if (userInput.trim()) {
      // Add user message to chat
      setMessages([...messages, { text: userInput, sender: "user" }])
      setIsTyping(true)
      
      try {
        // Send request to API with CORS handling
        const response = await fetch("https://6ff5-149-40-228-114.ngrok-free.app/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: "user1",
            query: userInput
          }),
          // Add CORS mode
          mode: "cors",
          // Add credentials if needed (remove if not required)
          credentials: "same-origin"
        })

        if (!response.ok) {
          throw new Error("API request failed with status: " + response.status)
        }

        const data = await response.json()
        
        // Add bot response to chat
        setMessages((prev) => [...prev, { text: data.response, sender: "bot" }])
      } catch (error) {
        console.error("Error fetching from API:", error)
        
        // For development: Show a more detailed error message with CORS suggestion
        setMessages((prev) => [...prev, { 
          text: "Sorry, I couldn't process your request due to a CORS issue. You'll need to either: 1) Configure the API server to allow CORS, 2) Use a proxy server, or 3) Create a backend API route to forward the request.",
          sender: "bot" 
        }])
      } finally {
        setIsTyping(false)
        setUserInput("")
      }
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  return (
    <div className="chatbot-container">
      {/* Chatbot Icon */}
      <div className="chatbot-icon" onClick={toggleChatbot}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="chat-icon"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h4>InsightWire Chatbot</h4>
            <button className="close-btn" onClick={toggleChatbot}>
              ×
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                Hello! How can I help you today?
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`chatbot-message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isTyping && <div className="typing-indicator">Chatbot is typing...</div>}
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              disabled={isTyping}
            />
            <button onClick={handleSend} disabled={isTyping || !userInput.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chatbot