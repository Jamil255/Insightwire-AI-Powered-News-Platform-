'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaGoogle, FaTimes } from 'react-icons/fa';
import './Login.css';

const Login = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  // Focus email input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          authType: "local"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Login failed");
      }

      // Save token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Login successful!");
      onClose(); // close the modal on success
      
      // Optionally trigger a page reload or state update so navbar shows logged-in state
      window.location.reload();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
    // Add Google authentication logic here
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="login-overlay" onClick={onClose}>
      <div className="login-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>
        
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Stay informed with the latest news</p>
        </div>
        
        <form onSubmit={handleEmailLogin}>
          <div className="form-group">
            <div className="input-container">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="form-input"
              />
            </div>
          </div>
          
          <div className="form-group">
            <div className="input-container">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="form-input"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="sign-in-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="separator">
          <span>or continue with</span>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          className="google-login-button"
          disabled={isLoading}
        >
          <FaGoogle className="google-icon" />
          Sign in with Google
        </button>
        
        <div className="signup-link">
          Don't have an account? <a href="#sign-up">Sign up now</a>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Login;