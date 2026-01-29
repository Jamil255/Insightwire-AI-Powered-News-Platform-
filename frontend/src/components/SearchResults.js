import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import News from "./News/News";
import "./NewsSection.css"; // Reuse the NewsSection styles

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setNews([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/articles/search?query=${encodeURIComponent(query)}`);
        
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
        
        setNews(validArticles);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching search results:", err);
      }
    };
    
    fetchSearchResults();
  }, [query]);

  return (
    <section className="news-section">
      <div className="container mx-auto px-4">
        {/* Section Heading */}
        <div className="section-header">
          <h2 className="section-heading">SEARCH RESULTS: {query}</h2>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner-large"></div>
            <p>Searching for "{query}"...</p>
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
        
        {/* No Results Found */}
        {!loading && !error && news.length === 0 && (
          <div className="no-news">
            <p>No news articles found for "{query}". Try a different search term.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default SearchResults;