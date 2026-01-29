const mongoose = require("mongoose");

const ScrapedArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    content: { type: [String], required: true }, // Array of strings (paragraphs)
    date: { type: String, required: true }, // Can hold "Loading..." if not available
    publication: { type: String, required: true }, // Name of the publication

    // Bias Classification
    biasness: { type: String, default: "Unclassified" }, // Stores bias label (e.g., "LABEL_0")
    score: { type: Number, default: 0.0 }, // Confidence score (0-1)

  },
  { timestamps: true, collection: "Articles" } // Explicit collection name
);

module.exports = mongoose.model("ScrapedArticle", ScrapedArticleSchema);

 // Feedback Reference
 //   feedback: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feedback" }] // References Feedback collection