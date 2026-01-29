"use client"

import React, { useState, useEffect } from "react";
import { Clock, Tag, TrendingUp, Filter, Search, ChevronDown } from 'lucide-react';
import "./NewsAnalytics.css";

const NewsAnalytics = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Categories for filtering
  const categories = [
    { id: "all", label: "All News" },
    { id: "politics", label: "Politics" },
    { id: "business", label: "Business" },
    { id: "technology", label: "Technology" },
    { id: "health", label: "Health" },
    { id: "international", label: "International" }
  ];

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        
        // Fetch articles from the API
        const response = await fetch('http://localhost:5000/api/articles/scraped');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Get articles for display
        const newsArticles = data.slice(0, 30);
        setArticles(newsArticles);
        setFilteredArticles(newsArticles);
        
        // Initialize image array with placeholders
        const placeholders = new Array(newsArticles.length).fill(null);
        setImageUrls(placeholders);
        
        // Load images in batches
        const loadImages = async () => {
          const batchSize = 5;
          const newImageUrls = [...placeholders];

          for (let i = 0; i < newsArticles.length; i += batchSize) {
            const batch = newsArticles.slice(i, i + batchSize);

            await Promise.all(
              batch.map(async (article, batchIndex) => {
                const index = i + batchIndex;
                if (article.url) {
                  try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);

                    const imageResponse = await fetch(
                      `http://localhost:5000/api/extract-image?url=${encodeURIComponent(article.url)}`,
                      { signal: controller.signal },
                    );

                    clearTimeout(timeoutId);

                    if (imageResponse.ok) {
                      const imageData = await imageResponse.json();
                      newImageUrls[index] =
                        imageData.imageUrl ||
                        `https://source.unsplash.com/random/1200x600/?news,${article.publication?.replace(/\s+/g, "")}${index}`;
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

                setImageUrls([...newImageUrls]);
              }),
            );
          }
        };

        loadImages();
        setLoading(false);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Filter articles when category changes
  useEffect(() => {
    if (articles.length === 0) return;

    let filtered = [...articles];
    
    // Apply category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter(article => {
        const category = getArticleCategory(article);
        return category === activeCategory;
      });
    }
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title?.toLowerCase().includes(query) || 
        article.publication?.toLowerCase().includes(query) ||
        (article.content && article.content.some(text => 
          text?.toLowerCase().includes(query)
        ))
      );
    }
    
    setFilteredArticles(filtered);
  }, [activeCategory, searchQuery, articles]);

  // Function to determine article category based on title and content
  const getArticleCategory = (article) => {
    const title = article.title?.toLowerCase() || "";
    const publication = article.publication?.toLowerCase() || "";
    
    if (
      title.includes("president") ||
      title.includes("election") ||
      title.includes("government") ||
      title.includes("congress") ||
      title.includes("senate") ||
      title.includes("vote")
    ) {
      return "politics";
    } else if (
      title.includes("economy") ||
      title.includes("market") ||
      title.includes("stock") ||
      title.includes("business") ||
      title.includes("finance") ||
      title.includes("trade")
    ) {
      return "business";
    } else if (
      title.includes("tech") ||
      title.includes("ai") ||
      title.includes("digital") ||
      title.includes("software") ||
      title.includes("app") ||
      title.includes("internet")
    ) {
      return "technology";
    } else if (
      title.includes("health") ||
      title.includes("medical") ||
      title.includes("doctor") ||
      title.includes("disease") ||
      title.includes("treatment") ||
      title.includes("patient")
    ) {
      return "health";
    } else if (
      title.includes("world") ||
      title.includes("international") ||
      title.includes("foreign") ||
      title.includes("global") ||
      title.includes("country") ||
      title.includes("nation")
    ) {
      return "international";
    } else {
      // Default category based on publication
      if (publication.includes("politics") || publication.includes("policy")) {
        return "politics";
      } else if (publication.includes("business") || publication.includes("economic")) {
        return "business";
      } else if (publication.includes("tech")) {
        return "technology";
      } else if (publication.includes("health") || publication.includes("medical")) {
        return "health";
      } else if (publication.includes("world") || publication.includes("international")) {
        return "international";
      }
      
      return "politics"; // Default fallback
    }
  };

  // Format the time difference
  const getTimeAgo = (dateStr) => {
    if (!dateStr || dateStr === "Loading...") return "Recently";

    const times = ["1 hour ago", "2 hours ago", "30 minutes ago", "Just now", "3 hours ago"];
    return times[Math.floor(Math.random() * times.length)];
  };

  // Get excerpt from content array
  const getExcerpt = (contentArray) => {
    if (!contentArray || contentArray.length === 0) return "No content available";
    
    for (let i = 0; i < contentArray.length; i++) {
      if (contentArray[i] && contentArray[i].length > 20 && contentArray[i].length < 200) {
        return contentArray[i];
      }
    }
    
    return contentArray[0] || "No content available";
  };

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Toggle filters on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (loading) {
    return (
      <div className="news-analytics-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading news articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-analytics-error">
        <div className="error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="news-analytics-container">
      <div className="news-analytics-header">
        <h1 className="news-analytics-title">News Analytics</h1>
        <p className="news-analytics-subtitle">Stay informed with the latest news and trends</p>
      </div>
      
      <div className="news-analytics-controls">
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <button className="filter-toggle" onClick={toggleFilters}>
          <Filter size={18} />
          <span>Filters</span>
          <ChevronDown size={16} className={showFilters ? "rotate-180" : ""} />
        </button>
      </div>
      
      <div className={`category-filters ${showFilters ? 'show' : ''}`}>
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-filter ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>
      
      {filteredArticles.length === 0 ? (
        <div className="no-results">
          <p>No articles found matching your criteria. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="results-count">
            <TrendingUp size={18} />
            <span>Showing {filteredArticles.length} articles</span>
          </div>
          
          <div className="news-grid">
            {filteredArticles.map((article, index) => {
              const category = getArticleCategory(article);
              const timeAgo = getTimeAgo(article.date);
              
              return (
                <div className="news-card" key={article._id || index}>
                  <div className="news-image-container">
                    {imageUrls[articles.indexOf(article)] ? (
                      <img
                        src={imageUrls[articles.indexOf(article)] || "/placeholder.svg"}
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
                    <div className="news-category-badge">{article.publication}</div>
                  </div>
                  
                  <div className="news-content">
                    <div className={`news-topic-tag ${category}`}>
                      {categories.find(cat => cat.id === category)?.label || "News"}
                    </div>
                    
                    <h2 className="news-title">{article.title}</h2>
                    
                    <p className="news-excerpt">{getExcerpt(article.content)}</p>
                    
                    <div className="news-meta">
                      <div className="news-time">
                        <Clock size={14} />
                        <span>{timeAgo}</span>
                      </div>
                      
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="news-read-more">
                        Read Full Article
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default NewsAnalytics;
