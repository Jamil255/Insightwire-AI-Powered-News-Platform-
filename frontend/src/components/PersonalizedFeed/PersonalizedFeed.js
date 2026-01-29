"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./personalized-feed.css"

const PersonalizedFeed = () => {
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visibleItems, setVisibleItems] = useState(8)
  const [activeBias, setActiveBias] = useState("all")
  const [filterChanging, setFilterChanging] = useState(false)

  // Bias categories
  const biasCategories = [
    { id: "all", label: "All Stories" },
    { id: "LABEL_0", label: "Left-Leaning" },
    { id: "LABEL_1", label: "Central" },
    { id: "LABEL_2", label: "Right-Leaning" },
  ]

  // Function to shuffle array (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  // Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleItems < filteredArticles.length) {
          // When user scrolls to the bottom, show more items
          setVisibleItems((prev) => Math.min(prev + 6, filteredArticles.length))
        }
      },
      { threshold: 0.5 },
    )

    const sentinel = document.getElementById("load-more-sentinel")
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
      }
    }
  }, [visibleItems, filteredArticles.length])

  // Filter articles when bias selection changes
  useEffect(() => {
    if (articles.length === 0) return

    setFilterChanging(true)

    // Animate out current articles
    setTimeout(() => {
      if (activeBias === "all") {
        setFilteredArticles(articles)
      } else {
        const filtered = articles.filter((article) => {
          return article.biasness === activeBias
        })
        setFilteredArticles(filtered)
      }

      // Reset visible items count when filter changes
      setVisibleItems(8)

      // Animate in new articles
      setTimeout(() => {
        setFilterChanging(false)
      }, 300)
    }, 300)
  }, [activeBias, articles])

  // Fetch articles on component mount
  useEffect(() => {
    const fetchPersonalizedArticles = async () => {
      try {
        setLoading(true)

        // Fetch articles from the API
        const response = await fetch("http://localhost:5000/api/articles/scraped")

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()

        // Simulate personalization by filtering and shuffling
        const personalizedArticles = shuffleArray(data).slice(0, 30)

        // Initialize image array with placeholders
        const placeholders = new Array(personalizedArticles.length).fill(null)
        setImageUrls(placeholders)

        // Set articles with a slight delay to allow transition effects
        setTimeout(() => {
          setArticles(personalizedArticles)
          setFilteredArticles(personalizedArticles)
          setInitialLoading(false)

          // Load images in batches
          const loadImages = async () => {
            const batchSize = 5
            const newImageUrls = [...placeholders]

            for (let i = 0; i < personalizedArticles.length; i += batchSize) {
              const batch = personalizedArticles.slice(i, i + batchSize)

              await Promise.all(
                batch.map(async (article, batchIndex) => {
                  const index = i + batchIndex
                  if (article.url) {
                    try {
                      const controller = new AbortController()
                      const timeoutId = setTimeout(() => controller.abort(), 4000)

                      const imageResponse = await fetch(
                        `http://localhost:5000/api/extract-image?url=${encodeURIComponent(article.url)}`,
                        { signal: controller.signal },
                      )

                      clearTimeout(timeoutId)

                      if (imageResponse.ok) {
                        const imageData = await imageResponse.json()
                        newImageUrls[index] =
                          imageData.imageUrl ||
                          `https://source.unsplash.com/random/1200x600/?news,${article.publication?.replace(/\s+/g, "")}${index}`
                      } else {
                        newImageUrls[index] = `https://source.unsplash.com/random/1200x600/?news,${index}`
                      }
                    } catch (err) {
                      console.error("Error extracting image for article:", err)
                      newImageUrls[index] = `https://source.unsplash.com/random/1200x600/?news,${index}`
                    }
                  } else {
                    newImageUrls[index] = `https://source.unsplash.com/random/1200x600/?news,${index}`
                  }

                  setImageUrls([...newImageUrls])
                }),
              )
            }
          }

          loadImages()
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error("Error fetching personalized articles:", err)
        setError(err.message)
        setLoading(false)
        setInitialLoading(false)
      }
    }

    fetchPersonalizedArticles()
  }, [])

  // Function to get bias info (color, text)
  const getBiasInfo = (biasness, score) => {
    const scoreValue = parseFloat(score) || 0.5
    const intensity = scoreValue > 0.8 ? "strong" : scoreValue > 0.6 ? "moderate" : "mild"
    
    switch (biasness) {
      case "LABEL_0":
        return { class: "bias-center", text: `Neutral (${intensity})` }
      case "LABEL_1":
        return { class: "bias-left", text: `Left-Leaning (${intensity})` }
      case "LABEL_2":
        return { class: "bias-right", text: `Right-Leaning (${intensity})` }
      default:
        return { class: "bias-unknown", text: "Bias Unknown" }
    }
  }

  // Function to get excerpt from content array
  const getExcerpt = (contentArray) => {
    if (!contentArray || contentArray.length === 0) return "No content available"
    for (let i = 0; i < contentArray.length; i++) {
      if (contentArray[i] && contentArray[i].length > 20 && contentArray[i].length < 200) {
        return contentArray[i]
      }
    }
    return contentArray[0] || "No content available"
  }

  // Function to get fact-checking reliability score


  // Handle bias filter change
  const handleBiasChange = (biasId) => {
    if (biasId === activeBias) return
    setActiveBias(biasId)
  }

  if (initialLoading)
    return (
      <div className="loading-container fade-in">
        <div className="loading-spinner"></div>
        <p className="loading-text">Personalizing your news feed...</p>
      </div>
    )

  if (error)
    return (
      <div className="error-container fade-in">
        <div className="error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    )

  return (
    <div className="personalized-feed-container">
      <div className="personalized-feed-header fade-in">
        <h1>Your Personalized News Feed</h1>
        <p>News stories with bias indicators</p>
      </div>

      {/* Bias Filter Bar */}
      <div className="bias-filter-container">
        <div className="bias-filter-bar">
          {biasCategories.map((category) => (
            <button
              key={category.id}
              className={`bias-filter-btn ${activeBias === category.id ? "active" : ""}`}
              onClick={() => handleBiasChange(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="filter-loading">
          <div className="loading-spinner small"></div>
          <span>Updating your feed...</span>
        </div>
      )}

      {!loading && filteredArticles.length === 0 && (
        <div className="no-results">
          <p>No articles found for this filter. Try another category.</p>
        </div>
      )}

      <div className={`news-grid ${filterChanging ? "fade-out" : "fade-in"}`}>
        {filteredArticles.slice(0, visibleItems).map((article, index) => {
          const biasInfo = getBiasInfo(article.biasness, article.score)
         

          return (
            <div
              key={article._id || index}
              className="news-card fade-in-up"
              onClick={() => navigate(`/bias-details/${article._id}`)}
              style={{
                cursor: "pointer",
                animationDelay: `${index * 0.05}s`,
              }}
            >
              <div className="news-image-container">
                {imageUrls[articles.indexOf(article)] ? (
                  <img
                    src={imageUrls[articles.indexOf(article)] || "/placeholder.svg"}
                    alt={article.title}
                    className="news-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `https://source.unsplash.com/random/1200x600/?news,${index}`
                    }}
                  />
                ) : (
                  <div className="image-placeholder pulse"></div>
                )}
                <div className="news-category">{article.publication}</div>
              </div>

              <div className="news-content">
                <h2 className="news-title">{article.title}</h2>

                {/* Bias indicator */}
                <div className={`bias-tag ${biasInfo.class}`}>
                  <div className="bias-dot"></div>
                  <span>{biasInfo.text}</span>
                </div>

              

                <p className="news-excerpt">{getExcerpt(article.content)}</p>

                <div className="news-footer">
                  <span className="news-date">{article.date !== "Loading..." ? article.date : "Recent"}</span>
                  <a href={`/bias-details/${article._id}`} className="news-link" onClick={(e) => e.stopPropagation()}>
                    Analyze Bias
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sentinel element for infinite scrolling */}
      {visibleItems < filteredArticles.length && (
        <div id="load-more-sentinel" className="load-more-sentinel">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonalizedFeed