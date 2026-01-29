const mongoose = require("mongoose");

const CategorizedArticleSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, index: true },
        summary: { type: String, required: true, trim: true },
        articles: [{ type: mongoose.Schema.Types.ObjectId, ref: "ScrapedArticle", default: [] }], // References Scraped Articles
    },
    { timestamps: true, collection: "categorizedarticles"}
);

module.exports = mongoose.model("categorizedarticles", CategorizedArticleSchema);
