import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { useState } from "react"
import Navbar from "./components/Navbar"
import Top_News from "./components/Top_News"
import NewsSection from "./components/NewsSection"
import NewsDetails from "./components/Detail/Detail"
import Footer from "./components/Footer/Footer"
import PersonalizedFeed from "./components/PersonalizedFeed/PersonalizedFeed"
import NewsAnalytics from "./components/NewsAnalytics/NewsAnalytics"
import MediaBias from "./components/MediaBais/MediaBais"
import StoryComparison from "./components/StroyComparision/StoryComparision"
import BiasDetails from './components/MediaBais/BiasDetails';
import StoryDetails from './components/StroyComparision/StoryDetails';
import SearchResults from './components/SearchResults';
import Chatbot from "./components/chatbot/chatbot"
import Profile from "./components/Profile/Profile"
import "./App.css"
import "./Ticker.css"

function App() {
  const [activeSection, setActiveSection] = useState("news");

  const handleNavClick = (section) => {
    setActiveSection(section);
  };

  return (
    <Router>
      <div>
        <Navbar onNavClick={handleNavClick} />
        <Routes>
          {/* Home/News Route */}
          <Route
            path="/"
            element={
              <>
                <Top_News />
                <NewsSection />
              </>
            }
          />
          
          {/* Detailed News Route */}
          <Route path="/news/:id" element={<NewsDetails />} />
          <Route path="/bias-details/:id" element={<BiasDetails />} />
          <Route path="/story-details/:id" element={<StoryDetails />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Personalized Feed Route */}
          <Route path="/personalized-feed" element={<PersonalizedFeed />} />
          
          {/* News Analytics Route */}
          <Route path="/news-analytics" element={<NewsAnalytics />} />
          
          {/* Media Bias Route */}
          <Route path="/media-bias" element={<MediaBias />} />
          
          {/* Story Comparison Route */}
          <Route path="/story-comparison" element={<StoryComparison />} />
        </Routes>
        <Footer />
        
        {/* Add the chatbot here, outside of Routes */}
        <div className="chatbot-container">
          <Chatbot />
        </div>
      </div>
    </Router>
  )
}
export default App