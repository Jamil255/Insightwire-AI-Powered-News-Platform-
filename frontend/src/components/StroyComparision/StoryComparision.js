import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./StoryComparision.css";

const StoryComparison = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleItems, setVisibleItems] = useState(12);
  const visibleItemsRef = useRef(12); // ref to read visibleItems inside observer without re-creating it

  // Keep ref in sync with state
  useEffect(() => {
    visibleItemsRef.current = visibleItems;
  }, [visibleItems]);

  // Function to convert database bias labels to display values
  // DB stores: "left", "center"/"central", "right" OR legacy "LABEL_0/1/2"
  const convertBiasLabel = (biasLabel) => {
    switch((biasLabel || '').toLowerCase()) {
      case 'left':    case 'label_0': return 'L';
      case 'center':  case 'central': case 'label_1': return 'C';
      case 'right':   case 'label_2': return 'R';
      default: return 'U';
    }
  };

  // Function to calculate center coverage percentage from bias score
  const calculateCenterCoverage = (biasLabel, score) => {
    if (biasLabel === "LABEL_1") {
      return `${Math.round(score * 100)}%`;
    } else {
      return `${Math.round((1 - score) * 100)}%`;
    }
  };

  // IntersectionObserver — separate from fetch, only re-runs when articles load
  useEffect(() => {
    if (articles.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleItemsRef.current < articles.length) {
          setVisibleItems(prev => Math.min(prev + 6, articles.length));
        }
      },
      { threshold: 0.5 }
    );

    const sentinel = document.getElementById('load-more-sentinel');
    if (sentinel) observer.observe(sentinel);

    return () => { observer.disconnect(); };
  }, [articles.length]);

  useEffect(() => {
    let cancelled = false;

    const fetchArticles = async () => {
      try {
        setLoading(true);

        const response = await fetch("http://localhost:5000/api/articles/scraped");
        if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);

        const articlesData = await response.json();
        if (cancelled) return;

        const shuffledArticles = articlesData
          .sort(() => 0.5 - Math.random())
          .slice(0, 30);

        const initialArticles = shuffledArticles.map(article => {
          const biasType = convertBiasLabel(article.biasness); // don't default to LABEL_1 — let unknown stay unknown
          const centerCoverage = calculateCenterCoverage(article.biasness, article.score || 0.5);

          let leftSources, centerSources, rightSources;
          if (biasType === "L") {
            leftSources = Math.floor(Math.random() * 30 + 40);
            centerSources = Math.floor(Math.random() * 20 + 20);
            rightSources = Math.floor(Math.random() * 15 + 10);
          } else if (biasType === "R") {
            leftSources = Math.floor(Math.random() * 15 + 10);
            centerSources = Math.floor(Math.random() * 20 + 20);
            rightSources = Math.floor(Math.random() * 30 + 40);
          } else {
            leftSources = Math.floor(Math.random() * 20 + 20);
            centerSources = Math.floor(Math.random() * 30 + 40);
            rightSources = Math.floor(Math.random() * 20 + 20);
          }

          const totalSources = leftSources + centerSources + rightSources;

          return {
            ...article,
            id: article._id || `article-${Math.random().toString(36).substr(2, 9)}`,
            imageUrl: null,
            biasType,
            centerCoverage,
            sources: Math.floor(Math.random() * 15 + 5),
            publicationDate: formatDate(article.date),
            perspectives: {
              left: {
                title: article.title,
                content: Array.isArray(article.content) ? article.content.join(" ") : article.content,
                sources: leftSources,
                keyPoints: ["Focus on social impact", "Emphasis on affected communities", "Discussion of systemic factors", "Historical context of the issue"]
              },
              center: {
                title: article.title,
                content: Array.isArray(article.content) ? article.content.join(" ") : article.content,
                sources: centerSources,
                keyPoints: ["Balanced reporting of facts", "Multiple viewpoints presented", "Context about broader implications", "Focus on verified information"]
              },
              right: {
                title: article.title,
                content: Array.isArray(article.content) ? article.content.join(" ") : article.content,
                sources: rightSources,
                keyPoints: ["Focus on individual responsibility", "Economic implications highlighted", "Traditional values perspective", "National security considerations"]
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

        // Render cards immediately with placeholders — 1st and only initial render
        setArticles(initialArticles);
        setLoading(false);

        // Load all images silently into a buffer, then update state ONCE
        const imageBuffer = initialArticles.map(a => ({ ...a }));
        const batchSize = 5;

        for (let i = 0; i < imageBuffer.length; i += batchSize) {
          if (cancelled) break;
          const batch = imageBuffer.slice(i, i + batchSize);

          await Promise.all(batch.map(async (article, batchIndex) => {
            const index = i + batchIndex;
            let imageUrl = generateTitleImage(article.title);

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
                  if (imageData.imageUrl) imageUrl = imageData.imageUrl;
                }
              } catch (err) {
                if (err.name !== 'AbortError') console.error("Image extraction error:", err);
              }
            }

            imageBuffer[index] = { ...imageBuffer[index], imageUrl };
          }));
        }

        // Single state update after ALL images resolved — zero mid-load re-renders
        if (!cancelled) setArticles([...imageBuffer]);

      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching articles:", err);
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchArticles();
    return () => { cancelled = true; };
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
      default:  return "Unclassified";
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
                  article.biasType === "C" ? "perspective-center" :
                  "perspective-unknown"
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