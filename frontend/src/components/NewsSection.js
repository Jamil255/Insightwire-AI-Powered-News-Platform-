import { useState, useEffect } from "react";
import News from "./News/News";
import "./NewsSection.css";

function NewsSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Function to shuffle array (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/articles/scraped");
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter out articles with missing essential data
        const validArticles = data.filter(article => 
          article.title && 
          article._id && 
          (article.content?.length > 0 || article.url)
        );
        
        // Shuffle the data array to get random articles
        const shuffledData = shuffleArray(validArticles);
        
        // Limit to 25 news articles
        const limitedData = shuffledData.slice(0, 25);
        setNews(limitedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching news:", err);
      }
    };
    
    fetchNews();
    
    // Set up interval to refresh with new random articles every 5 minutes
    const intervalId = setInterval(() => {
      fetchNews();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Clean up interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <section className="news-section">
      <div className="container mx-auto px-4">
        {/* Section Heading */}
        <div className="section-header">
          <h2 className="section-heading">NEWS AT A GLANCE</h2>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner-large"></div>
            <p>Loading news...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="error-container">
            <p className="text-center text-red-500">Error: {error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}
        
        {/* News Grid */}
        {!loading && !error && news.length > 0 && (
          <div className="news-grid">
            {news.map((newsItem) => (
              <div className="news-grid-item" key={newsItem._id}>
                <News newsItem={newsItem} />
              </div>
            ))}
          </div>
        )}
        
        {/* No News Found */}
        {!loading && !error && news.length === 0 && (
          <div className="no-news">
            <p>No news articles available at the moment. Please check back later.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default NewsSection;