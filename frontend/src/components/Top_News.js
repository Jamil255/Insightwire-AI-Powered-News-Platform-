"use client"

import { useEffect, useState, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import "./Top_News.css"

const TopNews = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imageUrls, setImageUrls] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sliding, setSliding] = useState(false)
  const [slideDirection, setSlideDirection] = useState("")
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  
  // For preloading images
  const imageRefs = useRef([])
  const autoSlideTimerRef = useRef(null)
  const slideshowRef = useRef(null)

  // Reset the auto-slide timer when user interaction occurs
  const resetAutoSlideTimer = () => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current)
    }
    
    autoSlideTimerRef.current = setInterval(() => {
      if (articles.length > 1) {
        handleNext()
      }
    }, 7000)
  }

  useEffect(() => {
    setIsVisible(true)

    // Fetch the news articles
    const fetchTopNews = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:5000/api/articles/scraped")

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()

        // Parse dates and filter for today and yesterday
        const now = new Date()
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 2) // Using 2 days ago for timezone safety
        yesterday.setHours(0, 0, 0, 0)

        // Filter and sort by date (newest first)
        const recentArticles = (data || [])
          .filter((article) => {
            if (!article.date) return false
            const articleDate = new Date(article.date)
            // Valid date and is from today or yesterday
            return !isNaN(articleDate.getTime()) && articleDate >= yesterday
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date))

        // If no recent articles, fallback to the latest 5 from all data, otherwise use the recent ones
        const articlesToUse = recentArticles.length > 0 ? recentArticles : data

        // Use exactly 5 articles or fewer if not enough available
        if (articlesToUse && articlesToUse.length > 0) {
          // Limit to exactly 5 articles
          const topArticles = articlesToUse.slice(0, Math.min(5, articlesToUse.length))
          setArticles(topArticles)

          // Fetch images for all selected articles
          const imagePromises = topArticles.map(async (article) => {
            if (article.url) {
              try {
                const imageResponse = await fetch(
                  `http://localhost:5000/api/extract-image?url=${encodeURIComponent(article.url)}`,
                )

                if (imageResponse.ok) {
                  const imageData = await imageResponse.json()
                  return imageData.imageUrl || "https://source.unsplash.com/random/1200x600/?news"
                } else {
                  return "https://source.unsplash.com/random/1200x600/?news"
                }
              } catch (err) {
                console.error("Error extracting image for article:", err)
                return "https://source.unsplash.com/random/1200x600/?news"
              }
            }
            return "https://source.unsplash.com/random/1200x600/?news"
          })

          const resolvedImages = await Promise.all(imagePromises)
          setImageUrls(resolvedImages)
          
          // Preload images
          resolvedImages.forEach((url, index) => {
            const img = new Image()
            img.src = url
            imageRefs.current[index] = img
          })
        }

        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
        console.error("Error fetching top news:", err)
      }
    }

    fetchTopNews()

    // Initialize auto-slide
    resetAutoSlideTimer()

    // Cleanup
    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current)
      }
    }
  }, []) // Only run on mount

  // Format the time difference
  const getTimeAgo = (dateStr) => {
    if (!dateStr || dateStr === "Loading...") return "Recently"

    const times = ["1 hour ago", "2 hours ago", "30 minutes ago", "Just now", "3 hours ago"]
    return times[Math.floor(Math.random() * times.length)]
  }

  // Get the category
  const getCategory = (title) => {
    if (!title) return "News"

    if (
      title.includes("Israel") ||
      title.includes("Palestine") ||
      title.includes("Hamas") ||
      title.includes("Gaza") ||
      title.includes("Iran")
    ) {
      return "International"
    } else if (
      title.includes("economy") ||
      title.includes("market") ||
      title.includes("stock") ||
      title.includes("finance")
    ) {
      return "Business"
    } else if (
      title.includes("election") ||
      title.includes("President") ||
      title.includes("vote") ||
      title.includes("government")
    ) {
      return "Politics"
    } else {
      return "Top News"
    }
  }

  const handlePrev = () => {
    if (sliding || articles.length <= 1) return
    setSliding(true)
    setSlideDirection("right-to-left")

    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? articles.length - 1 : prevIndex - 1))
      setSliding(false)
    }, 500)
    
    resetAutoSlideTimer()
  }

  const handleNext = () => {
    if (sliding || articles.length <= 1) return
    setSliding(true)
    setSlideDirection("left-to-right")

    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex === articles.length - 1 ? 0 : prevIndex + 1))
      setSliding(false)
    }, 500)
    
    resetAutoSlideTimer()
  }
  
  // Handle touch events for mobile swipe functionality
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe) {
      handleNext()
    }
    
    if (isRightSwipe) {
      handlePrev()
    }
    
    setTouchStart(null)
    setTouchEnd(null)
  }
  
  // Handle direct navigation to a specific slide
  const handleDotClick = (index) => {
    if (sliding || index === currentIndex) return
    
    setSliding(true)
    setSlideDirection(index > currentIndex ? "left-to-right" : "right-to-left")
    
    setTimeout(() => {
      setCurrentIndex(index)
      setSliding(false)
    }, 500)
    
    resetAutoSlideTimer()
  }

  if (loading) {
    return (
      <div className="top-news-skeleton">
        <div className="skeleton-bg"></div>
        <div className="skeleton-shimmer"></div>
        <div className="skeleton-content">
          <div className="skeleton-title"></div>
          <div className="skeleton-title short"></div>
          <div className="skeleton-meta">
            <div className="skeleton-meta-item"></div>
            <div className="separator" style={{ color: '#333' }}>•</div>
            <div className="skeleton-meta-item"></div>
          </div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="top-news-container error">Error loading top news: {error}</div>
  }

  if (!articles.length) {
    return <div className="top-news-container error">No news articles available</div>
  }

  // Ensure currentIndex is valid
  const safeIndex = Math.min(currentIndex, articles.length - 1)
  const currentArticle = articles[safeIndex]
  const currentImage = imageUrls[safeIndex] || "https://source.unsplash.com/random/1200x600/?news"

  // Safety check to ensure currentArticle exists
  if (!currentArticle) {
    return <div className="top-news-container error">Article data is not available</div>
  }

  return (
    <div 
      className="slideshow-container" 
      ref={slideshowRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`top-news-container ${isVisible ? "visible" : ""} ${sliding ? `sliding ${slideDirection}` : ""}`}
        style={{
          backgroundImage: `url('${currentImage}')`,
        }}
      >
        <div className="content">
          <h1 className="heading">{currentArticle.title || "News Title"}</h1>
          <div className="meta">
            <span>{getCategory(currentArticle.title)}</span>
            <span className="separator">•</span>
            <span>Updated {getTimeAgo(currentArticle.date)}</span>
          </div>
          <a href={currentArticle.url || "#"} target="_blank" rel="noopener noreferrer" className="read-more-btn">
            Read Full Story
          </a>
        </div>
      </div>

      {articles.length > 1 && (
        <>
          <button className="nav-btn prev-btn" onClick={handlePrev} aria-label="Previous slide">
            <ChevronLeft size={24} />
          </button>
          <button className="nav-btn next-btn" onClick={handleNext} aria-label="Next slide">
            <ChevronRight size={24} />
          </button>

          <div className="slide-indicators">
            {articles.map((_, index) => (
              <span
                key={index}
                className={`indicator ${index === safeIndex ? "active" : ""}`}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to slide ${index + 1}`}
                role="button"
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default TopNews