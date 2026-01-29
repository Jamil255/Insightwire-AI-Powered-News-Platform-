import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StoryComparision.css";

const StoryComparison = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleItems, setVisibleItems] = useState(12); // Initial number of visible items

  // Function to convert database bias labels to display values
  const convertBiasLabel = (biasLabel) => {
    switch(biasLabel) {
      case "LABEL_0": return "L"; // Left
      case "LABEL_1": return "C"; // Center
      case "LABEL_2": return "R"; // Right
      default: return "C"; // Default to Center if unknown
    }
  };

  // Function to calculate center coverage percentage from bias score
  const calculateCenterCoverage = (biasLabel, score) => {
    // For center articles, higher score means more balanced
    if (biasLabel === "LABEL_1") {
      return `${Math.round(score * 100)}%`;
    }
    // For left/right articles, higher score means less balanced
    else {
      return `${Math.round((1 - score) * 100)}%`;
    }
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Show loading state immediately
        setLoading(true);
        
        // Fetch articles from the API
        const response = await fetch("http://localhost:5000/api/articles/scraped");
        
        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }
        
        const articlesData = await response.json();
        
        // Process and shuffle the articles first
        const shuffledArticles = articlesData
          .sort(() => 0.5 - Math.random())
          .slice(0, 30); // Take only 30 articles
        
        // Process articles with initial placeholders
        const initialArticles = shuffledArticles.map(article => {
          // Get bias type from database instead of generating random
          const biasType = convertBiasLabel(article.biasness || "LABEL_1");
          
          // Calculate balanced coverage using the score from database
          const centerCoverage = calculateCenterCoverage(article.biasness, article.score || 0.5);
          
          // Create sample perspective data for each article
          // We'll generate this data based on the bias type
          let leftSources, centerSources, rightSources;
          
          if (biasType === "L") {
            leftSources = Math.floor(Math.random() * 30 + 40); // Higher for left bias
            centerSources = Math.floor(Math.random() * 20 + 20);
            rightSources = Math.floor(Math.random() * 15 + 10);
          } else if (biasType === "R") {
            leftSources = Math.floor(Math.random() * 15 + 10);
            centerSources = Math.floor(Math.random() * 20 + 20);
            rightSources = Math.floor(Math.random() * 30 + 40); // Higher for right bias
          } else { // Center
            leftSources = Math.floor(Math.random() * 20 + 20);
            centerSources = Math.floor(Math.random() * 30 + 40); // Higher for center
            rightSources = Math.floor(Math.random() * 20 + 20);
          }
          
          const totalSources = leftSources + centerSources + rightSources;
          
          return {
            ...article,
            id: article._id || `article-${Math.random().toString(36).substr(2, 9)}`,
            imageUrl: null, // Initial placeholder, will be loaded asynchronously
            biasType: biasType, // Use database value
            centerCoverage: centerCoverage, // Use calculated value from database score
            sources: Math.floor(Math.random() * 15 + 5), // Random number between 5-20
            publicationDate: formatDate(article.date),
            perspectives: {
              left: {
                title: article.title,
                content: Array.isArray(article.content) ? article.content.join(" ") : article.content,
                sources: leftSources,
                keyPoints: [
                  "Focus on social impact",
                  "Emphasis on affected communities",
                  "Discussion of systemic factors",
                  "Historical context of the issue"
                ]
              },
              center: {
                title: article.title,
                content: Array.isArray(article.content) ? article.content.join(" ") : article.content,
                sources: centerSources,
                keyPoints: [
                  "Balanced reporting of facts",
                  "Multiple viewpoints presented",
                  "Context about broader implications",
                  "Focus on verified information"
                ]
              },
              right: {
                title: article.title,
                content: Array.isArray(article.content) ? article.content.join(" ") : article.content,
                sources: rightSources,
                keyPoints: [
                  "Focus on individual responsibility",
                  "Economic implications highlighted",
                  "Traditional values perspective",
                  "National security considerations"
                ]
              }
            },
            coverageData: {
              total: totalSources,
              left: leftSources,
              right: rightSources,
              center: centerSources,
              lastUpdated: "1 hour ago",
              biasDistribution: `${Math.round((centerSources / totalSources) * 100)}% Center`
            }
          };
        });
        
        // Set articles immediately so the UI can render
        setArticles(initialArticles);
        setLoading(false);
        
        // Load images in parallel in the background
        const loadImages = async () => {
          // Process in smaller batches to prevent network overload
          const batchSize = 5;
          const updatedArticles = [...initialArticles];
          
          // Process images in batches
          for (let i = 0; i < updatedArticles.length; i += batchSize) {
            const batch = updatedArticles.slice(i, i + batchSize);
            
            // Process batch concurrently
            await Promise.all(batch.map(async (article, batchIndex) => {
              const index = i + batchIndex;
              let imageUrl = generateTitleImage(article.title);
              
              // Try to extract image from the article URL
              if (article.url) {
                try {
                  // Use AbortController to prevent hanging requests
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                  
                  const imageResponse = await fetch(
                    `http://localhost:5000/api/extract-image?url=${encodeURIComponent(article.url)}`,
                    { signal: controller.signal }
                  );
                  
                  clearTimeout(timeoutId);
                  
                  if (imageResponse.ok) {
                    const imageData = await imageResponse.json();
                    if (imageData.imageUrl) {
                      imageUrl = imageData.imageUrl;
                    }
                  }
                } catch (error) {
                  // Just continue with the fallback image
                  if (error.name !== 'AbortError') {
                    console.error("Image extraction error:", error);
                  }
                }
              }
              
              // Update the article with the image URL
              updatedArticles[index] = {
                ...updatedArticles[index],
                imageUrl: imageUrl
              };
              
              // Update the state periodically to show loading progress
              if (batchIndex === batch.length - 1 || (batchIndex > 0 && batchIndex % 2 === 0)) {
                setArticles([...updatedArticles]);
              }
            }));
          }
          
          // Final update to ensure all changes are reflected
          setArticles(updatedArticles);
        };
        
        // Start loading images in the background
        loadImages();
        
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchArticles();
    
    // Setup intersection observer for lazy loading more items
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleItems < 30) {
          setVisibleItems(prev => Math.min(prev + 6, 30));
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
  }, []);
  
  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString || dateString === "Loading...") {
      return "Recently published";
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Recently published";
      }
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (err) {
      return "Recently published";
    }
  };
  
  // Extract excerpt from content
  const getExcerpt = (content, maxLength = 150) => {
    if (!content) return "No content available";
    
    if (Array.isArray(content)) {
      // Join the first few array items
      const joinedContent = content.slice(0, 2).join(" ");
      return joinedContent.length > maxLength 
        ? joinedContent.substring(0, maxLength) + "..." 
        : joinedContent;
    }
    
    if (typeof content === 'string') {
      return content.length > maxLength 
        ? content.substring(0, maxLength) + "..." 
        : content;
    }
    
    return "No content available";
  };

  // Handle navigation to the story details page
  const handleStoryClick = (article) => {
    // Store the selected article in sessionStorage to access it in the StoryDetails component
    sessionStorage.setItem('selectedArticle', JSON.stringify(article));
    
    // Navigate to the story details page with the article ID
    navigate(`/story-details/${article.id}`);
  };

  // Generate a title-based image for articles without valid images
  const generateTitleImage = (title) => {
    // Create a search term from the title
    const searchTerm = encodeURIComponent(title?.split(' ').slice(0, 3).join(' ') || 'news');
    return `https://source.unsplash.com/random/1200x600/?${searchTerm}`;
  };

  // Function to get label and color for bias type
  const getBiasLabel = (biasType) => {
    switch(biasType) {
      case "L": return "Left";
      case "R": return "Right";
      case "C": return "Center";
      default: return "Center";
    }
  };

  if (loading) {
    return (
      <div className="loading-container fade-in">
        <div className="pulse-loader"></div>
        <p>Loading stories from across the web...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container fade-in">
        <div className="error-icon">!</div>
        <h2>Oops! We hit a snag</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="story-comparison-container">
      <div className="story-comparison-header fade-in">
        <h1>Perspective Lens</h1>
        <p>Explore multiple viewpoints on today's trending stories</p>
        <div className="header-divider"></div>
      </div>
      
      <div className="comparison-grid">
        {articles.slice(0, visibleItems).map((article, index) => (
          <div
            key={article.id}
            className="comparison-card fast-render fade-in-up"
            onClick={() => handleStoryClick(article)}
            style={{ 
              cursor: "pointer",
              animationDelay: `${index * 0.1}s` 
            }}
          >
            <div className="comparison-image-container">
              <div className="image-overlay"></div>
              {article.imageUrl ? (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="comparison-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = generateTitleImage(article.title);
                  }}
                />
              ) : (
                <div className="image-placeholder pulse"></div>
              )}
              <div className="comparison-category">
                <span className="publication-dot"></span>
                {article.publication || "News"}
              </div>
            </div>
            
            <div className="comparison-content">
              <h2 className="comparison-title">{article.title}</h2>
              
              <div className="perspective-indicator">
                <div className={`perspective-bar ${
                  article.biasType === "L" ? "perspective-left" : 
                  article.biasType === "R" ? "perspective-right" : 
                  "perspective-center"
                }`}>
                  <span className="perspective-label">
                    {getBiasLabel(article.biasType)}
                  </span>
                </div>
                <div className="perspective-meter">
                  <div className="meter-fill" style={{ 
                    width: article.centerCoverage 
                  }}></div>
                </div>
                <span className="perspective-text">
                  <span className="balanced-text">{article.centerCoverage}</span> balanced from <span className="sources-text">{article.sources}</span> sources
                </span>
              </div>
              
              <p className="comparison-excerpt">
                {getExcerpt(article.content)}
              </p>
              
              <div className="comparison-footer">
                <span className="comparison-date">
                  <span className="date-icon">📅</span>
                  {article.publicationDate}
                </span>
                <button 
                  className="comparison-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStoryClick(article);
                  }}
                >
                  <span className="link-text">Compare Views</span>
                  <span className="link-arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Sentinel for lazy loading more items */}
      {visibleItems < articles.length && (
        <div id="load-more-sentinel" className="load-more-sentinel">
          <div className="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      )}
      
      {articles.length === 0 && !loading && (
        <div className="no-articles">
          <p>No articles found to display. Please check back later.</p>
        </div>
      )}
    </div>
  );
};

export default StoryComparison;