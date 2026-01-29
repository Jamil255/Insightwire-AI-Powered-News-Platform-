import { useState, useEffect } from "react";
import { CalendarDays, User } from "lucide-react";
import { Link } from "react-router-dom";
import "./News.css";

const News = ({ newsItem }) => {
  // Destructure the properties from the API response
  const { _id, title, content, date, publication, url } = newsItem;
  const [imageUrl, setImageUrl] = useState("/placeholder.svg");
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the first paragraph of content for the excerpt
  // Add fallback text if content is empty
  const excerpt = content && content.length > 0 
    ? content[0] 
    : "Read the full article for more information.";
    
  useEffect(() => {
    // Function to extract image from URL
    const extractImageFromUrl = async () => {
      if (!url) {
        setIsLoading(false);
        generateTitleImage(); // Always generate a placeholder if no URL
        return;
      }
      
      try {
        // Call our backend proxy to fetch the HTML content
        const response = await fetch(`http://localhost:5000/api/extract-image?url=${encodeURIComponent(url)}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.imageUrl) {
            // Test image loading before setting
            const img = new Image();
            img.onload = () => {
              setImageUrl(data.imageUrl);
              setIsLoading(false);
            };
            img.onerror = () => {
              generateTitleImage();
              setIsLoading(false);
            };
            img.src = data.imageUrl;
          } else {
            generateTitleImage();
            setIsLoading(false);
          }
        } else {
          generateTitleImage();
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error extracting image:", error);
        generateTitleImage();
        setIsLoading(false);
      }
    };
    
    // Function to generate image based on title (as fallback)
    const generateTitleImage = () => {
      if (!title) {
        setImageUrl("/placeholder.svg");
        return;
      }
      
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions
      canvas.width = 400;
      canvas.height = 300;
      
      // Fill background with a gradient (more visually appealing)
      const gradient = ctx.createLinearGradient(0, 0, 400, 300);
      gradient.addColorStop(0, '#e53e3e');
      gradient.addColorStop(1, '#c53030');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text (first letter of title)
      const firstLetter = title.charAt(0).toUpperCase();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(firstLetter, canvas.width / 2, canvas.height / 2);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    };
    
    // Call the extract function
    extractImageFromUrl();
  }, [title, url]);
  
  // Format date if available
  const formattedDate = date !== "Loading..." ? date : "Recent";
  
  return (
    <article className="news-card">
      <div className="news-image-container">
        {isLoading ? (
          <div className="loading-image">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <img 
            src={imageUrl}
            alt={title || "News image"}
            className="news-image"
            onError={() => setImageUrl("/placeholder.svg")}
          />
        )}
      </div>
      
      <div className="news-content">
        <h2 className="news-title">{title || "Breaking News"}</h2>
        
        <p className="news-excerpt">{excerpt}</p>
        
        <div className="news-footer">
          <div className="news-metadata">
            <div className="metadata-item">
              <CalendarDays size={16} />
              <span>{formattedDate}</span>
            </div>
            <div className="metadata-item">
              <User size={16} />
              <span>BY {publication || "Unknown"}</span>
            </div>
          </div>
          
          <div className="read-more">
            <Link to={`/news/${_id}`} className="read-more-link">
              READ MORE
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default News;