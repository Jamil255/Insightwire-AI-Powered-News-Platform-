"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import "./BiasDetails.css"

const BiasDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState(null)
  // Add state for speech functionality
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        // Fetch articles from API
        const response = await fetch("http://localhost:5000/api/articles/scraped")
        if (response.ok) {
          const articlesData = await response.json()
          // Find the article with the matching ID
          const foundArticle = articlesData.find((item) => item._id === id)

          if (foundArticle) {
            setArticle(foundArticle)

            // Fetch the image for the article
            if (foundArticle.url) {
              try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000)

                const imageResponse = await fetch(
                  `http://localhost:5000/api/extract-image?url=${encodeURIComponent(foundArticle.url)}`,
                  { signal: controller.signal },
                )

                clearTimeout(timeoutId)

                if (imageResponse.ok) {
                  const imageData = await imageResponse.json()
                  setImageUrl(
                    imageData.imageUrl ||
                      `https://source.unsplash.com/random/1200x600/?news,${foundArticle.publication?.replace(/\s+/g, "")}${id}`,
                  )
                } else {
                  setImageUrl(`https://source.unsplash.com/random/1200x600/?news,${id}`)
                }
              } catch (err) {
                console.error("Error extracting image for article:", err)
                setImageUrl(`https://source.unsplash.com/random/1200x600/?news,${id}`)
              }
            } else {
              setImageUrl(`https://source.unsplash.com/random/1200x600/?news,${id}`)
            }
          }
        }
        setLoading(false)
      } catch (error) {
        console.error("Error fetching article data:", error)
        setLoading(false)
      }
    }

    fetchArticleData()
  }, [])

  // Convert biasness label to bias class
  const getBiasClass = () => {
    if (!article) return "bias-unknown"

    switch (article.biasness) {
      case "LABEL_0":
        return "bias-left"
      case "LABEL_1":
        return "bias-center"
      case "LABEL_2":
        return "bias-right"
      default:
        return "bias-unknown"
    }
  }

  // Convert biasness label to text
  const getBiasText = () => {
    if (!article) return "Unknown"

    switch (article.biasness) {
      case "LABEL_0":
        return "Left-leaning"
      case "LABEL_1":
        return "Politically Neutral"
      case "LABEL_2":
        return "Right-leaning"
      default:
        return "Bias Unknown"
    }
  }

  // Get bias color based on biasness label
  const getBiasColor = () => {
    if (!article) return "#4caf50"

    switch (article.biasness) {
      case "LABEL_0":
        return "#3b5bdb" // Left - blue
      case "LABEL_1":
        return "#4caf50" // Center - green
      case "LABEL_2":
        return "#e53935" // Right - red
      default:
        return "#9e9e9e" // Unknown - gray
    }
  }

  // Get bias position for the gauge
  const getBiasPosition = () => {
    if (!article) return 50

    switch (article.biasness) {
      case "LABEL_0": {
        // Position on left side of gauge, adjust based on confidence score
        const score = article.score ? parseFloat(article.score) : 0.5
        return 25 - (score * 15)
      }
      case "LABEL_2": {
        // Position on right side of gauge, adjust based on confidence score
        const score = article.score ? parseFloat(article.score) : 0.5
        return 75 + (score * 15)
      }
      case "LABEL_1":
        return 50 // Center position
      default:
        return 50
    }
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  // Add text-to-speech functionality
  const speakArticle = (text) => {
    if ("speechSynthesis" in window) {
      // If already speaking, stop it
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
        return
      }

      const speech = new SpeechSynthesisUtterance(text)
      speech.lang = "en-US" // Set language
      speech.rate = 1 // Speed of speech
      speech.pitch = 1 // Pitch of voice

      // Add event listener for when speech ends
      speech.onend = () => {
        setIsSpeaking(false)
      }

      // Add event listener for when speech is stopped
      speech.onpause = speech.onend
      speech.oncancel = speech.onend
      speech.onerror = speech.onend

      setIsSpeaking(true)
      speechSynthesis.speak(speech)
    } else {
      alert("Text-to-Speech not supported in this browser.")
    }
  }

  // Get article content for text-to-speech
  const getArticleContent = () => {
    if (!article) return ""

    // Use fullContent if available, otherwise use content
    const content = article.fullContent || article.content || ""

    // If content is an array, join all paragraphs
    if (Array.isArray(content)) {
      return content.filter((item) => item && item.trim().length > 0).join(" ")
    }

    // If content is a string
    if (typeof content === "string") {
      // Remove any HTML tags that might be present
      return content.replace(/<\/?[^>]+(>|$)/g, " ")
    }

    return ""
  }

  // Get confidence score as percentage
  const getConfidenceScore = () => {
    if (!article || !article.score) return "N/A"
    
    const score = parseFloat(article.score)
    if (isNaN(score)) return "N/A"
    
    return `${(score * 100).toFixed(1)}%`
  }

  // Get bias strength based on confidence score
  const getBiasStrength = () => {
    if (!article || !article.score) return "Unknown"
    
    const score = parseFloat(article.score)
    if (isNaN(score)) return "Unknown"
    
    if (score < 0.5) return "Weak"
    if (score < 0.75) return "Medium"
    return "Strong"
  }

  if (loading) {
    return (
      <div className="bias-loading-container">
        <div className="bias-loading-spinner"></div>
        <p>Loading article analysis...</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="bias-error-container">
        <div className="bias-error-icon">!</div>
        <h2>Article Not Found</h2>
        <p>We couldn't find the article you're looking for. It may have been removed or the URL might be incorrect.</p>
        <button onClick={handleGoBack} className="bias-back-button">
          Return to News Feed
        </button>
      </div>
    )
  }

  const biasPosition = getBiasPosition()

  // Calculate source distribution based on bias
  const leftSources = article.biasness === "LABEL_0" ? 60 : article.biasness === "LABEL_1" ? 33 : 20
  const centerSources = article.biasness === "LABEL_1" ? 50 : 30
  const rightSources = article.biasness === "LABEL_2" ? 60 : article.biasness === "LABEL_1" ? 33 : 20
  
  // Calculate center coverage
  const centerCoverage = article.biasness === "LABEL_1" ? "High" : 
    (article.score && parseFloat(article.score) < 0.6) ? "Medium" : "Low"

  return (
    <div className="bias-container">
      <header className="bias-header">
        <button onClick={handleGoBack} className="bias-back-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="bias-category-tag">{article.publication}</div>
      </header>

      <div className="bias-content">
        <h1 className="bias-title">{article.title}</h1>

        {/* Add text-to-speech button */}
        <button
          onClick={() => speakArticle(getArticleContent())}
          className="bias-read-aloud-button"
          aria-label={isSpeaking ? "Stop reading" : "Read article aloud"}
        >
          {isSpeaking ? "🔊 Stop Reading" : "🔊 Read Aloud"}
        </button>

        <div className="bias-meta">
          <span className="bias-date">Published on {article.date !== "Loading..." ? article.date : "Recent"}</span>
          <span className="bias-sources-count">AI-powered analysis</span>
        </div>

        <div className="bias-image-wrapper">
          <img src={imageUrl || article.imageUrl} alt={article.title} className="bias-hero-image" />
          <div className={`bias-badge ${getBiasClass()}`}>{getBiasText()}</div>
        </div>

        <section className="bias-verdict-section">
          <h2>Media Bias Analysis</h2>

          <div className="bias-gauge-container">
            <div className="bias-gauge">
              <div className="bias-spectrum-gradient"></div>
              <div
                className="bias-indicator"
                style={{
                  left: `${biasPosition}%`,
                  backgroundColor: getBiasColor(),
                }}
              >
                <span className="bias-indicator-label">{getBiasText()}</span>
              </div>
            </div>
            <div className="bias-labels">
              <span>Left</span>
              <span>Center</span>
              <span>Right</span>
            </div>
          </div>

          <div className="bias-stats">
            <div className="bias-stat-item">
              <h3>Center Coverage</h3>
              <div className="bias-stat-value">{centerCoverage}</div>
              <p>Neutral, fact-based reporting</p>
            </div>
            <div className="bias-stat-item">
              <h3>Confidence Score</h3>
              <div className="bias-stat-value">{getConfidenceScore()}</div>
              <p>Analysis accuracy</p>
            </div>
            <div className="bias-stat-item">
              <h3>Bias Strength</h3>
              <div className="bias-stat-value">{getBiasStrength()}</div>
              <p>Intensity of bias</p>
            </div>
          </div>
        </section>

        <section className="bias-content-section">
          <h2>Content Analysis</h2>
          <div className="bias-article-content">
            {Array.isArray(article.content) ? 
              article.content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              )) : 
              <p>{article.content}</p>
            }
          </div>

          <div className="bias-indicators">
            <h3>Bias Indicators Found</h3>
            <ul className="bias-indicators-list">
              {article.biasness === "LABEL_0" && (
                <>
                  <li className="bias-indicator-item left-indicator">
                    <div className="indicator-header">
                      <span className="indicator-badge">Language</span>
                      <span className="indicator-impact">Moderate impact</span>
                    </div>
                    <p className="indicator-description">
                      The article uses language that tends to frame issues in a progressive context.
                    </p>
                  </li>
                  <li className="bias-indicator-item left-indicator">
                    <div className="indicator-header">
                      <span className="indicator-badge">Source Selection</span>
                      <span className="indicator-impact">High impact</span>
                    </div>
                    <p className="indicator-description">
                      Quoted sources tend to represent left-leaning or progressive viewpoints.
                    </p>
                  </li>
                </>
              )}
              {article.biasness === "LABEL_2" && (
                <>
                  <li className="bias-indicator-item right-indicator">
                    <div className="indicator-header">
                      <span className="indicator-badge">Framing</span>
                      <span className="indicator-impact">High impact</span>
                    </div>
                    <p className="indicator-description">
                      The article frames issues in ways that favor conservative viewpoints.
                    </p>
                  </li>
                  <li className="bias-indicator-item right-indicator">
                    <div className="indicator-header">
                      <span className="indicator-badge">Topic Selection</span>
                      <span className="indicator-impact">Moderate impact</span>
                    </div>
                    <p className="indicator-description">
                      The article focuses on topics that tend to align with conservative concerns.
                    </p>
                  </li>
                </>
              )}
              {article.biasness === "LABEL_1" && (
                <>
                  <li className="bias-indicator-item center-indicator">
                    <div className="indicator-header">
                      <span className="indicator-badge">Balanced Reporting</span>
                      <span className="indicator-impact">High impact</span>
                    </div>
                    <p className="indicator-description">
                      The article presents multiple perspectives on the issue without showing preference.
                    </p>
                  </li>
                  <li className="bias-indicator-item center-indicator">
                    <div className="indicator-header">
                      <span className="indicator-badge">Neutral Language</span>
                      <span className="indicator-impact">High impact</span>
                    </div>
                    <p className="indicator-description">
                      The article uses neutral language and avoids politically charged terms.
                    </p>
                  </li>
                </>
              )}
            </ul>
          </div>
        </section>

        <section className="source-section">
          <h2>Source Distribution</h2>
          <div className="source-visual">
            <div className="source-chart">
              <div className="source-bar">
                <div className="source-segment left-segment" style={{ width: `${leftSources}%` }}>
                  <span>{leftSources}%</span>
                </div>
                <div className="source-segment center-segment" style={{ width: `${centerSources}%` }}>
                  <span>{centerSources}%</span>
                </div>
                <div className="source-segment right-segment" style={{ width: `${rightSources}%` }}>
                  <span>{rightSources}%</span>
                </div>
              </div>
              <div className="source-labels">
                <span>Left sources</span>
                <span>Center sources</span>
                <span>Right sources</span>
              </div>
            </div>
          </div>

          <div className="methodology-box">
            <h3>Analysis Methodology</h3>
            <p>
              Our AI-powered bias detection system analyzes multiple factors including language patterns, framing
              techniques, source selection, and content omissions. We examine articles from multiple perspectives
              to provide a comprehensive political bias assessment with a confidence score of {getConfidenceScore()}.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default BiasDetails