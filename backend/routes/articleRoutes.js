const express = require("express");
const { 
    getScrapedArticles, 
    getScrapedArticleById,
    createScrapedArticle, 
    getCategorizedArticles, 
    createCategorizedArticle, 
    getCategorizedArticleById,
    searchArticles
} = require("../controllers/articleController");

const router = express.Router();

// Get all scraped articles with feedback populated
router.get("/scraped", getScrapedArticles);
router.get("/scraped/:id", getScrapedArticleById);
// Create a new scraped article
router.post("/scraped", createScrapedArticle);
router.get("/search", searchArticles);
// Get all categorized articles with associated scraped articles
router.get("/categorized", getCategorizedArticles);

// Create a new categorized article
router.post("/categorized", createCategorizedArticle);

// Get a specific categorized article by ID
router.get("/categorized/:id", getCategorizedArticleById);

module.exports = router;
