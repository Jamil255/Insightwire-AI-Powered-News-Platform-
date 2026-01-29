const express = require("express");
const { 
    addFeedback, 
    getFeedbackByArticle, 
    updateFeedback, 
    deleteFeedback 
} = require("../controllers/feedbackController");

const router = express.Router();

// Add feedback to a scraped or categorized article
router.post("/feedback", addFeedback);

// Get all feedback for a specific article
router.get("/feedback/:articleId/:type", getFeedbackByArticle);

// Update feedback
router.put("/feedback/:feedbackId", updateFeedback);

// Delete feedback
router.delete("/feedback/:feedbackId", deleteFeedback);

module.exports = router;
