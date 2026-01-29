const Feedback = require("../models/Feedback");
const ScrapedArticle = require("../models/ScrapedArticle");
const CategorizedArticle = require("../models/CategorizedArticle");

// Add feedback to a scraped or categorized article
exports.addFeedback = async (req, res) => {
    try {
        const { text, rating, articleId, type } = req.body; // type: "scraped" or "categorized"

        if (!text || !rating || !articleId || !type) {
            return res.status(400).json({ msg: "Missing required fields" });
        }

        const feedback = new Feedback({ text, rating, user: req.user._id });
        await feedback.save();

        if (type === "scraped") {
            await ScrapedArticle.findByIdAndUpdate(articleId, { $push: { feedback: feedback._id } });
        } else if (type === "categorized") {
            await CategorizedArticle.findByIdAndUpdate(articleId, { $push: { feedback: feedback._id } });
        } else {
            return res.status(400).json({ msg: "Invalid article type" });
        }

        res.status(201).json({ msg: "Feedback added successfully", feedback });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get all feedback for a specific article
exports.getFeedbackByArticle = async (req, res) => {
    try {
        const { articleId, type } = req.params; // type: "scraped" or "categorized"

        let feedback;
        if (type === "scraped") {
            feedback = await ScrapedArticle.findById(articleId).populate("feedback");
        } else if (type === "categorized") {
            feedback = await CategorizedArticle.findById(articleId).populate("feedback");
        } else {
            return res.status(400).json({ msg: "Invalid article type" });
        }

        if (!feedback) return res.status(404).json({ msg: "Article not found" });

        res.json(feedback.feedback);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Update feedback
exports.updateFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const { text, rating } = req.body;

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) return res.status(404).json({ msg: "Feedback not found" });

        if (feedback.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Unauthorized to update this feedback" });
        }

        feedback.text = text || feedback.text;
        feedback.rating = rating || feedback.rating;
        await feedback.save();

        res.json({ msg: "Feedback updated successfully", feedback });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Delete feedback
exports.deleteFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) return res.status(404).json({ msg: "Feedback not found" });

        if (feedback.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Unauthorized to delete this feedback" });
        }

        await Feedback.findByIdAndDelete(feedbackId);

        res.json({ msg: "Feedback deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
