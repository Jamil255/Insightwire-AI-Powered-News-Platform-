import React, { useState, useEffect, useRef } from "react";
import "./MediaBais.css";
import { useNavigate } from 'react-router-dom';

const MediaBias = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const imageRefs = useRef([]);
  const [visibleItems, setVisibleItems] = useState(8);

  // Function to shuffle array (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleItems < articles.length) {
          // When user scrolls to the bottom, show more items
          setVisibleItems(prev => Math.min(prev + 6, articles.length));
        }
      },
      { threshold: 0.5 }
    );
    
    const sentinel = document.getElementById('load-more-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }
    
    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [visibleItems, articles.length]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Show loading state immediately
        setLoading(true);
        
        // Fetch articles from the API
        const response = await fetch('http://localhost:5000/api/articles/scraped');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Shuffle and select random 30 articles
        const shuffledArticles = shuffleArray(data);
        const randomArticles = shuffledArticles.slice(0, 30);
        
        // Initialize image array with placeholders
        const placeholders = new Array(randomArticles.length).fill(null);
        setImageUrls(placeholders);
        
        // Set articles with a slight delay to allow transition effects
        setTimeout(() => {
          setArticles(randomArticles);
          
          // Initialize visible items
          setVisibleItems(Math.min(8, randomArticles.length));
          
          // Start loading images
          const loadImages = async () => {
            // Process images in small batches to avoid overwhelming the network
            const batchSize = 5;
            const newImageUrls = [...placeholders];
            
            for (let i = 0; i < randomArticles.length; i += batchSize) {
              const batch = randomArticles.slice(i, i + batchSize);
              
              // Process batch in parallel
              await Promise.all(batch.map(async (article, batchIndex) => {
                const index = i + batchIndex;
                if (article.url) {
                  try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    
                    const imageResponse = await fetch(
                      `http://localhost:5000/api/extract-image?url=${encodeURIComponent(article.url)}`,
                      { signal: controller.signal }
                    );
                    
                    clearTimeout(timeoutId);
                    
                    if (imageResponse.ok) {
                      const imageData = await imageResponse.json();
                      newImageUrls[index] = imageData.imageUrl || 
                        `https://source.unsplash.com/random/1200x600/?news,${article.publication?.replace(/\s+/g, '')}${index}`;
                    } else {
                      newImageUrls[index] = `https://source.unsplash.com/random/1200x600/?news,${index}`;
                    }
                  } catch (err) {
                    if (err.name !== 'AbortError') {
                      console.error("Error extracting image for article:", err);
                    }
                    newImageUrls[index] = `https://source.unsplash.com/random/1200x600/?news,${index}`;
                  }
                } else {
                  newImageUrls[index] = `https://source.unsplash.com/random/1200x600/?news,${index}`;
                }
                
                // Update state after each batch item for smooth loading effect
                setImageUrls([...newImageUrls]);
              }));
            }
          };
          
          loadImages();
        }, 100);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchArticles();
    
    // Cleanup function
    return () => {
      imageRefs.current = [];
    };
  }, []);

  // Convert biasness label to category
  const getBiasFromLabel = (biasLabel) => {
    switch(biasLabel) {
      case 'LABEL_0':
        return 'left';
      case 'LABEL_1':
        return 'center';
      case 'LABEL_2':
        return 'right';
      default:
        return 'unknown';
    }
  };

  // Function to determine bias color and text
  const getBiasInfo = (biasType) => {
    switch(biasType) {
      case 'left':
        return { class: 'bias-left', text: 'Left-Leaning' };
      case 'center':
        return { class: 'bias-center', text: 'Politically Neutral' };
      case 'right':
        return { class: 'bias-right', text: 'Right-Leaning' };
      case 'far-left':
        return { class: 'bias-far-left', text: 'Far Left' };
      case 'far-right':
        return { class: 'bias-far-right', text: 'Far Right' };
      default:
        return { class: 'bias-unknown', text: 'Bias Unknown' };
    }
  };

  // Function to get excerpt from content array
  const getExcerpt = (contentArray) => {
    if (!contentArray || contentArray.length === 0) return "No content available";
    // Get the first paragraph that has reasonable length
    for (let i = 0; i < contentArray.length; i++) {
      if (contentArray[i] && contentArray[i].length > 20 && contentArray[i].length < 200) {
        return contentArray[i];
      }
    }
    // Fallback to first content item
    return contentArray[0] || "No content available";
  };

  // Loading state with smooth fade-in animation
  if (loading) return (
    <div className="loading-container fade-in">
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading latest news articles...</p>
    </div>
  );
  
  // Error state with smooth styling
  if (error) return (
    <div className="error-container fade-in">
      <div className="error-icon">⚠️</div>
      <h3>Something went wrong</h3>
      <p className="error-message">{error}</p>
      <button onClick={() => window.location.reload()} className="retry-button">Try Again</button>
    </div>
  );

  return (
    <div className="media-bias-container">
      <div className="media-bias-header fade-in">
        <h1>Media Bias News Monitor</h1>
        <p>Analyzing media bias across different sources</p>
      </div>
            
      <div className="news-grid">
        {articles.slice(0, visibleItems).map((article, index) => {
          // Get bias from article data or use publication-based fallback
          const biasLabel = article.biasness || 'unknown';
          const bias = getBiasFromLabel(biasLabel);
          const biasInfo = getBiasInfo(bias);
          
          // Get confidence score (if available)
          const confidenceScore = article.score ? 
            parseFloat(article.score).toFixed(2) * 100 : null;
                  
          return (
            <div
              key={article._id}
              className="news-card fade-in-up"
              onClick={() => navigate(`/bias-details/${article._id}`)}
              style={{ 
                cursor: 'pointer',
                animationDelay: `${index * 0.1}s` 
              }}
            >
              <div className="news-image-container">
                {imageUrls[index] ? (
                  <img
                    src={imageUrls[index]}
                    alt={article.title}
                    className="news-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://source.unsplash.com/random/1200x600/?news,${index}`;
                    }}
                  />
                ) : (
                  <div className="image-placeholder pulse"></div>
                )}
                <div className="news-category">{article.publication}</div>
              </div>
                        
              <div className="news-content">
                <h2 className="news-title">{article.title}</h2>
                            
                {/* Bias indicator with confidence score if available */}
                <div className="bias-tag">
                  <div className={`bias-dot ${biasInfo.class}`}></div>
                  <span>{biasInfo.text}</span>
                  
                </div>
                            
                <p className="news-excerpt">{getExcerpt(article.content)}</p>
                            
                <div className="news-footer">
                  <span className="news-date">{article.date !== "Loading..." ? article.date : "Recent"}</span>
                  <a 
                    href={`/bias-details/${article._id}`} 
                    className="news-link" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    Analyze Bias
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Sentinel element for infinite scrolling */}
      {visibleItems < articles.length && (
        <div id="load-more-sentinel" className="load-more-sentinel">
          <div className="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaBias;