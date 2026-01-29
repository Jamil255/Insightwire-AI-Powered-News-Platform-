import { newsData } from "../News/data.js"
import "./RelatedArticles.css"

const RelatedArticles = ({ currentArticleId }) => {
  // Filter out the current article if currentArticleId is provided
  const filteredArticles = currentArticleId ? newsData.filter((article) => article.id !== currentArticleId) : newsData

  // Take only the first 8 articles to display
  const articlesToShow = filteredArticles.slice(0, 8)

  // Format date function (converts YYYY-MM-DD to DD-MMM-YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return ""

    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString // Return original if invalid
      }

      // Format as DD-MMM-YYYY (e.g., 12-FEB-2025)
      const day = date.getDate().toString().padStart(2, "0")
      const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase()
      const year = date.getFullYear()

      return `${day}-${month}-${year}`
    } catch (e) {
      return dateString // Return original on error
    }
  }

  return (
    <section className="related-articles">
      <div className="container">
        <h2 className="section-title">Related Articles</h2>
        <div className="articles-grid">
          {articlesToShow.map((article) => (
            <article key={article.id} className="article-card">
              <a href={`/news/${article.id}`} className="article-link">
                <div className="image-container">
                  <img
                    src={article.imageUrl || "/placeholder.svg?height=250&width=400"}
                    alt={article.title}
                    className="article-image"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x250"
                    }}
                  />
                </div>
                <div className="article-content">
                  <h3 className="article-title">{article.title.toUpperCase()}</h3>
                  <div className="article-meta">
                    <span className="article-date">{formatDate(article.publicationDate)}</span>
                    <span className="article-source">{article.source}</span>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RelatedArticles

