"use client"

import { useEffect, useRef, useState } from "react"
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
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (userInput.trim()) {
      const currentInput = userInput.trim();
      // Add user message to chat immediately
      const newMessages = [...messages, { text: currentInput, sender: "user" }];
      setMessages(newMessages);
      setUserInput("");
      setIsTyping(true);
      
      try {
        const GEMINI_API_KEY = "AIzaSyAXlynygSmzTgvFllJuVRx98XuGmeGm640";
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
        
        // Format history for Gemini API
        const formattedHistory = newMessages.map(msg => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        }));

        // Send request to Gemini API
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ 
                text: "You are the InsightWire Chatbot, an expert AI assistant for a news platform. Your primary focus is on political news, media bias, and global current events. Provide balanced, objective, and neutral political analysis. Help users understand different political perspectives (Left, Center, Right). Keep your responses concise, professional, and directly relevant to the news." 
              }]
            },
            contents: formattedHistory
          })
        });

        if (!response.ok) {
          throw new Error("Gemini API request failed with status: " + response.status);
        }

        const data = await response.json();
        
        // Extract bot response
        const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
        
        // Add bot response to chat
        setMessages((prev) => [...prev, { text: botText, sender: "bot" }]);
      } catch (error) {
        console.error("Error fetching from Gemini API:", error);
        
        setMessages((prev) => [...prev, { 
          text: "Sorry, I am having trouble connecting to the AI service right now. Please try again later.",
          sender: "bot" 
        }]);
      } finally {
        setIsTyping(false);
      }
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  // Custom Markdown Parser for Chatbot Messages
  const formatInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="md-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const formatMessage = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      if (line.startsWith('### ')) {
        return <h4 key={index} className="md-heading md-h4">{formatInline(line.replace('### ', ''))}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={index} className="md-heading md-h3">{formatInline(line.replace('## ', ''))}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={index} className="md-heading md-h2">{formatInline(line.replace('# ', ''))}</h2>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <div key={index} className="md-bullet">
            <span className="bullet-point">•</span>
            <span>{formatInline(line.substring(2))}</span>
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={index} className="md-spacer"></div>;
      }
      return <div key={index} className="md-paragraph">{formatInline(line)}</div>;
    });
  };

  return (
    <div className="chatbot-container">
      {/* Chatbot Icon */}
      <div className={`chatbot-icon ${isOpen ? 'active' : ''}`} onClick={toggleChatbot}>
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chat-icon close-icon">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chat-icon open-icon">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        )}
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="header-info">
              <div className="bot-avatar">
                <div className="online-indicator"></div>
              </div>
              <div>
                <h4>InsightWire AI</h4>
                <span className="bot-status">Online</span>
              </div>
            </div>
            <button className="close-btn" onClick={toggleChatbot}>×</button>
          </div>
          
          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="welcome-icon">👋</div>
                <p>Hello! I'm InsightWire's AI Assistant. Ask me anything about political news, media bias, or global current events.</p>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <div key={index} className={`chatbot-message ${msg.sender}`}>
                <div className="message-content">
                  {msg.sender === 'user' ? msg.text : formatMessage(msg.text)}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="chatbot-message bot typing">
                <div className="typing-indicator-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chatbot-input">
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask about today's news..."
              disabled={isTyping}
            />
            <button className={`send-btn ${userInput.trim() ? 'active' : ''}`} onClick={handleSend} disabled={isTyping || !userInput.trim()}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chatbot