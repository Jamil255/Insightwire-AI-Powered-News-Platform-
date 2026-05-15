"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { FaGoogle, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa"
import "./Signup.css"

const Signup = ({ isOpen, onClose }) => {
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Focus username input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const userNameInput = document.getElementById('userName');
        if (userNameInput) userNameInput.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSignup = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      alert("Passwords don't match!")
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userName,
          email,
          password,
          authType: "local"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Registration failed");
      }

      alert("Account created successfully! Please login.");
      onClose(); // close the modal on success
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignup = () => {
    console.log("Google signup clicked")
    // Implement Google signup logic here
  }

  if (!isOpen) return null

  return createPortal(
    <div className="signup-overlay" onClick={onClose}>
      <div className="signup-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>
        
        <div className="signup-header">
          <h2>Create an Account</h2>
          <p>Join us to stay informed with the latest news</p>
        </div>
        
        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="userName">Username</label>
            <input
              type="text"
              id="userName"
              placeholder="Choose a username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-group">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="signup-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="separator">
          <span>or sign up with</span>
        </div>
        
        <button 
          onClick={handleGoogleSignup} 
          className="google-signup-button"
          disabled={isLoading}
        >
          <FaGoogle className="google-icon" />
          Sign up with Google
        </button>
        
        <div className="login-link">
          Already have an account? <a href="#login">Log in</a>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default Signup