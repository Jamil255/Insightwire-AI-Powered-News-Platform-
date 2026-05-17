const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    // await mongoose.connect("mongodb+srv://hello:12345@cluster0.xpezuyx.mongodb.net/?appName=Cluster0",);
    // await mongoose.connect("mongodb://hello:12345@ac-ohoqssh-shard-00-00.xpezuyx.mongodb.net:27017,ac-ohoqssh-shard-00-01.xpezuyx.mongodb.net:27017,ac-ohoqssh-shard-00-02.xpezuyx.mongodb.net:27017/?ssl=true&replicaSet=atlas-8i5u76-shard-0&authSource=admin&appName=Cluster0",);

    await mongoose.connect(process.env.MONGO_URI); 
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Database connection error:", err);
    // Agar fail ho jaye, toh hotspot wala test lazmi karein
  }
};

module.exports = connectDB;

