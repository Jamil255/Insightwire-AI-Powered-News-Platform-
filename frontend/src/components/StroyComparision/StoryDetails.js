import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./StoryDetails.css";

const StoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rewrittenContent, setRewrittenContent] = useState(null);
  const [apiStatus, setApiStatus] = useState("");

  // Update to the correct ngrok URL
  const REWRITE_API_URL = "https://26ef-149-40-228-114.ngrok-free.app/rewrite";

  // Helper function to map bias label to string
  const mapBiasToString = (bias) => {
    switch(bias) {
      case "LABEL_0": return "left";
      case "LABEL_1": return "center";
      case "LABEL_2": return "right";
      default: return "center";
    }
  };

  // Helper function to get the opposite bias
  const getOppositeBias = (bias) => {
    switch(bias) {
      case "left": return "right";
      case "right": return "left";
      case "center": return "center";
      default: return "center";
    }
  };

  useEffect(() => {
    // First, try to get the story from sessionStorage (set by StoryComparison)
    const storedArticle = sessionStorage.getItem('selectedArticle');
    
    if (storedArticle) {
      try {
        const parsedArticle = JSON.parse(storedArticle);
        
        // Verify this is the correct article by checking ID
        if (parsedArticle.id === id || parsedArticle._id === id) {
          setStory(parsedArticle);
          fetchRewrittenContent(parsedArticle);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error parsing stored article:", err);
      }
    }
    
    // If we don't have the story in storage or it's not the one we're looking for,
    // fetch it from the API
    const fetchStory = async () => {
      try {
        setLoading(true);
        
        // Fetch the specific article by ID
        const response = await fetch(`http://localhost:5000/api/articles/${id}`);
        
        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }
        
        const articleData = await response.json();
        console.log("Article data fetched:", articleData);
        
        // Set the story
        const processedArticle = {
          ...articleData,
          id: articleData._id || id,
          category: articleData.category || "News",
          publicationDate: formatDate(articleData.date)
        };
        
        setStory(processedArticle);
        fetchRewrittenContent(processedArticle);
        
      } catch (err) {
        console.error("Error fetching story:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id]);
  
  // Fetch rewritten content from the rewrite API
  const fetchRewrittenContent = async (article) => {
    try {
      // Make sure we have the ID
      const articleId = article._id || id;
      if (!articleId) {
        throw new Error("Article ID is missing");
      }
      
      const biasnessString = mapBiasToString(article.biasness);
      console.log("Sending request to rewrite API:", {
        article_id: articleId,
        bias_tag: biasnessString
      });
      
      setApiStatus("Sending request to rewrite API...");
      
      const response = await fetch(REWRITE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          article_id: articleId,
          bias_tag: biasnessString
        }),
      });
      
      console.log("Rewrite API response status:", response.status);
      setApiStatus(`API response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Rewrite API call failed with status: ${response.status}`);
      }
      
      const rewrittenData = await response.json();
      console.log("Rewritten data received:", rewrittenData);
      setApiStatus("Successfully received rewritten content");
      setRewrittenContent(rewrittenData);
      
      // Now generate the perspectives based on the original and rewritten content
      generatePerspectives(article, rewrittenData, biasnessString);
      
    } catch (err) {
      console.error("Error fetching rewritten content:", err);
      setApiStatus(`Error: ${err.message}`);
      
      // If API fails, still generate perspectives with fallback content
      generatePerspectivesWithFallback(article);
    }
  };
  
  // Generate perspectives without rewritten content (fallback)
  const generatePerspectivesWithFallback = (article) => {
    console.log("Generating perspectives with fallback content");
    
    const joinedContent = Array.isArray(article.content) 
      ? article.content.join('\n') 
      : article.content || "Content not available";
    
    const originalBias = mapBiasToString(article.biasness);
    
    // Create mock perspectives
    const perspectives = {
      left: {
        title: article.title,
        content: originalBias === "left" ? joinedContent : "Left-leaning perspective is not available (API error). This would typically emphasize social impacts and focus on affected communities.",
        sources: 67,
        keyPoints: generateKeyPoints("left"),
        publication: originalBias === "left" ? article.publication : "Not available"
      },
      center: {
        title: article.title,
        content: originalBias === "center" ? joinedContent : "Center perspective is not available (API error). This would typically provide balanced reporting of key facts with equal coverage of multiple viewpoints.",
        sources: 98,
        keyPoints: generateKeyPoints("center"),
        publication: originalBias === "center" ? article.publication : "Not available"
      },
      right: {
        title: article.title,
        content: originalBias === "right" ? joinedContent : "Right-leaning perspective is not available (API error). This would typically focus on economic impacts and traditional values perspective.",
        sources: 51,
        keyPoints: generateKeyPoints("right"),
        publication: originalBias === "right" ? article.publication : "Not available"
      }
    };
    
    // Update the story with perspectives
    setStory(prevStory => ({
      ...prevStory,
      perspectives
    }));
  };
  
  // Generate perspectives based on original and rewritten content
  const generatePerspectives = (article, rewrittenData, originalBias) => {
    console.log("Generating perspectives with rewritten content");
    const oppositeBias = getOppositeBias(originalBias);
    
    const joinedContent = Array.isArray(article.content) 
      ? article.content.join('\n') 
      : article.content || "Content not available";
    
    const perspectives = {
      left: {
        title: article.title,
        content: originalBias === "left" ? joinedContent : 
                 (oppositeBias === "left" ? rewrittenData.rewritten_opposite : rewrittenData.rewritten_center),
        sources: 67,
        keyPoints: generateKeyPoints("left"),
        publication: originalBias === "left" ? article.publication : "Generated"
      },
      center: {
        title: article.title,
        content: originalBias === "center" ? joinedContent : rewrittenData.rewritten_center,
        sources: 98,
        keyPoints: generateKeyPoints("center"),
        publication: originalBias === "center" ? article.publication : "Generated"
      },
      right: {
        title: article.title,
        content: originalBias === "right" ? joinedContent : 
                (oppositeBias === "right" ? rewrittenData.rewritten_opposite : rewrittenData.rewritten_center),
        sources: 51,
        keyPoints: generateKeyPoints("right"),
        publication: originalBias === "right" ? article.publication : "Generated"
      }
    };
    
    // Update the story with perspectives
    setStory(prevStory => ({
      ...prevStory,
      perspectives
    }));
  };
  
  // Generate sample key points based on perspective
  const generateKeyPoints = (perspective) => {
    switch(perspective) {
      case "left":
        return [
          "Emphasis on social impacts",
          "Focus on affected communities",
          "Concerns about long-term implications",
          "Historical context of similar situations"
        ];
      case "center":
        return [
          "Balanced reporting of key facts",
          "Equal coverage of multiple viewpoints",
          "Context about broader implications",
          "Focus on verified information"
        ];
      case "right":
        return [
          "Focus on economic impacts",
          "Individual liberty considerations",
          "Traditional values perspective",
          "National security implications"
        ];
      default:
        return ["Key point not available"];
    }
  };
  
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="pulse-loader"></div>
        <p>Loading story details...</p>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <h2>Oops! We couldn't find that story</h2>
        <p>{error || "The requested story could not be found"}</p>
        <button onClick={() => navigate("/")}>Back to All Stories</button>
      </div>
    );
  }

  // Extract perspectives from the story
  const { perspectives } = story || { perspectives: null };

  if (!perspectives) {
    return (
      <div className="loading-container">
        <div className="pulse-loader"></div>
        <p>Generating perspectives...</p>
      </div>
    );
  }

  return (
    <div className="story-details-container">
      <div className="story-details-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back to Stories
        </button>
        <h1>{story.title}</h1>
        <div className="story-meta">
          <span className="story-category">{story.category}</span>
          <span className="story-date">Published: {story.publicationDate}</span>
          {story.publication && <span className="story-publication">Source: {story.publication}</span>}
          {story.biasness && (
            <span className={`story-bias ${mapBiasToString(story.biasness)}-bias`}>
              Original Bias: {mapBiasToString(story.biasness)}
            </span>
          )}
        </div>
        {apiStatus && (
          <div className="api-status">
            <small>API Status: {apiStatus}</small>
          </div>
        )}
      </div>

      <div className="perspective-tabs">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} 
          onClick={() => setActiveTab('all')}
        >
          All Perspectives
        </button>
        <button 
          className={`tab-button ${activeTab === 'left' ? 'active' : ''}`} 
          onClick={() => setActiveTab('left')}
        >
          <div className="tab-indicator left-indicator"></div>
          Left-Leaning
        </button>
        <button 
          className={`tab-button ${activeTab === 'center' ? 'active' : ''}`} 
          onClick={() => setActiveTab('center')}
        >
          <div className="tab-indicator center-indicator"></div>
          Center
        </button>
        <button 
          className={`tab-button ${activeTab === 'right' ? 'active' : ''}`} 
          onClick={() => setActiveTab('right')}
        >
          <div className="tab-indicator right-indicator"></div>
          Right-Leaning
        </button>
      </div>

      {activeTab === 'all' ? (
        <div className="all-perspectives">
          <div className="perspective-grid">
            <div className="perspective-card left-perspective">
              <div className="perspective-header">
                <div className="perspective-indicator left-indicator"></div>
                <h3>Left-Leaning Perspective</h3>
                <span className="source-count">
                  {perspectives.left.sources} sources
                  {perspectives.left.publication && ` • ${perspectives.left.publication}`}
                </span>
              </div>
              <h4>{perspectives.left.title}</h4>
              <p className="perspective-text">{perspectives.left.content}</p>
              <div className="key-points">
                <h5>Key Focus Points:</h5>
                <ul>
                  {perspectives.left.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="perspective-card center-perspective">
              <div className="perspective-header">
                <div className="perspective-indicator center-indicator"></div>
                <h3>Center Perspective</h3>
                <span className="source-count">
                  {perspectives.center.sources} sources
                  {perspectives.center.publication && ` • ${perspectives.center.publication}`}
                </span>
              </div>
              <h4>{perspectives.center.title}</h4>
              <p className="perspective-text">{perspectives.center.content}</p>
              <div className="key-points">
                <h5>Key Focus Points:</h5>
                <ul>
                  {perspectives.center.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="perspective-card right-perspective">
              <div className="perspective-header">
                <div className="perspective-indicator right-indicator"></div>
                <h3>Right-Leaning Perspective</h3>
                <span className="source-count">
                  {perspectives.right.sources} sources
                  {perspectives.right.publication && ` • ${perspectives.right.publication}`}
                </span>
              </div>
              <h4>{perspectives.right.title}</h4>
              <p className="perspective-text">{perspectives.right.content}</p>
              <div className="key-points">
                <h5>Key Focus Points:</h5>
                <ul>
                  {perspectives.right.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="narrative-comparison">
            <h3>Key Narrative Differences</h3>
            <div className="comparison-table-container">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>
                      <div className="th-content">
                        <div className="perspective-indicator left-indicator"></div>
                        Left-Leaning
                      </div>
                    </th>
                    <th>
                      <div className="th-content">
                        <div className="perspective-indicator center-indicator"></div>
                        Center
                      </div>
                    </th>
                    <th>
                      <div className="th-content">
                        <div className="perspective-indicator right-indicator"></div>
                        Right-Leaning
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Primary Focus</td>
                    <td>Social impact and affected communities</td>
                    <td>Balanced reporting of verified facts</td>
                    <td>Economic implications and traditional values</td>
                  </tr>
                  <tr>
                    <td>Framing</td>
                    <td>Systemic and historical context</td>
                    <td>Multiple perspectives presented equally</td>
                    <td>Individual responsibility and security</td>
                  </tr>
                  <tr>
                    <td>Solutions Emphasized</td>
                    <td>Collective action and policy change</td>
                    <td>Evidence-based approaches from various viewpoints</td>
                    <td>Market-based solutions and traditional institutions</td>
                  </tr>
                  <tr>
                    <td>Key Concerns</td>
                    <td>Equality and social justice</td>
                    <td>Accuracy and comprehensive context</td>
                    <td>Freedom, security, and economic impact</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="single-perspective">
          <div className={`perspective-detail ${activeTab}-perspective-detail`}>
            <div className="perspective-header">
              <div className={`perspective-indicator ${activeTab}-indicator`}></div>
              <h3>{activeTab === 'left' ? 'Left-Leaning' : activeTab === 'right' ? 'Right-Leaning' : 'Center'} Perspective</h3>
              <span className="source-count">
                {perspectives[activeTab].sources} sources
                {perspectives[activeTab].publication && ` • ${perspectives[activeTab].publication}`}
              </span>
            </div>
            <h4>{perspectives[activeTab].title}</h4>
            <div className="perspective-content">
              <p className="perspective-text">{perspectives[activeTab].content}</p>
              <div className="key-points">
                <h5>Key Focus Points:</h5>
                <ul>
                  {perspectives[activeTab].keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="representative-sources">
              <h4>Representative Sources</h4>
              <div className="sources-list">
                {activeTab === 'left' ? (
                  <>
                    <span className="source-badge">Washington Post</span>
                    <span className="source-badge">MSNBC</span>
                    <span className="source-badge">CNN</span>
                    <span className="source-badge">New York Times</span>
                    <span className="source-badge">Vox</span>
                  </>
                ) : activeTab === 'right' ? (
                  <>
                    <span className="source-badge">Fox News</span>
                    <span className="source-badge">New York Post</span>
                    <span className="source-badge">The Daily Wire</span>
                    <span className="source-badge">Washington Times</span>
                    <span className="source-badge">National Review</span>
                  </>
                ) : (
                  <>
                    <span className="source-badge">Reuters</span>
                    <span className="source-badge">Associated Press</span>
                    <span className="source-badge">PBS</span>
                    <span className="source-badge">BBC</span>
                    <span className="source-badge">Bloomberg</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryDetails;