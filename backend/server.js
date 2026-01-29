const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./configs/db");
const authRoutes = require("./routes/authRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const articleRoutes = require("./routes/articleRoutes");
const userRoutes = require('./routes/userRoutes');  // Import userRoutes
const path = require("path");
const { exec } = require("child_process");  // Add this line

const cors = require("cors");
const axios = require('axios');
const cheerio = require('cheerio');
dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());



app.get('/api/extract-image', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    // Fetch the HTML content of the URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 8000 // 8 second timeout
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Try to find the OpenGraph image first (highest quality usually)
    let imageUrl = $('meta[property="og:image"]').attr('content');
    
    // If no OpenGraph image, try Twitter image
    if (!imageUrl) {
      imageUrl = $('meta[name="twitter:image"]').attr('content');
    }
    
    // If still no image, look for the first large image in the article
    if (!imageUrl) {
      $('img').each((i, img) => {
        const src = $(img).attr('src');
        const width = $(img).attr('width');
        const height = $(img).attr('height');
        
        // Consider images that are reasonably sized
        if (src && ((width && height && width >= 200 && height >= 200) || 
                   (!width && !height && src.includes('jpg') || src.includes('jpeg') || src.includes('png')))) {
          // Make sure the src is an absolute URL
          if (src.startsWith('http')) {
            imageUrl = src;
            return false; // Break the loop
          } else if (src.startsWith('/')) {
            // Convert relative URL to absolute
            const baseUrl = new URL(url).origin;
            imageUrl = baseUrl + src;
            return false; // Break the loop
          }
        }
      });
    }
    
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error extracting image:', error);
    res.status(500).json({ error: 'Failed to extract image from URL' });
  }
});




const { spawn } = require("child_process");

app.post('/api/analyze-bias', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const pythonScript = path.join(__dirname, "biasDetection.py");
  const pythonProcess = spawn("C:\\Program Files\\Python311\\python.exe", [pythonScript]);

  let output = "";
  let errorOutput = "";

  pythonProcess.stdout.on("data", (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      console.error("Bias detection error:", errorOutput);
      return res.status(500).json({ error: "Bias detection failed" });
    }

    // Ignore TensorFlow warnings if they appear in stderr
    if (errorOutput.includes("tensorflow") || errorOutput.includes("WARNING")) {
      errorOutput = "";
    }

    if (errorOutput.trim()) {
      console.error("Bias detection error:", errorOutput);
      return res.status(500).json({ error: "Bias detection failed" });
    }

    try {
      res.json(JSON.parse(output.trim()));
    } catch (err) {
      console.error("JSON parsing error:", err);
      res.status(500).json({ error: "Invalid response from Python script" });
    }
  });

  pythonProcess.stdin.write(text);
  pythonProcess.stdin.end();
});





// Routes
app.use("/api/auth", authRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/articles", articleRoutes);
app.use('/api/user', userRoutes);  // For user-related data, profile, etc.
// Connect to DB
connectDB();





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
