import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer-wrapper">
            <div className="footer-container">

                {/* Brand Column */}
                <div className="footer-brand">
                    <div>
                        <div className="footer-logo-text">
                            Insight<span>Wire</span>
                        </div>
                        <p className="footer-tagline">
                            AI-powered news platform delivering balanced, unbiased perspectives across the political spectrum.
                        </p>
                        <div className="footer-social">
                            <a href="#" aria-label="Twitter">𝕏</a>
                            <a href="#" aria-label="LinkedIn">in</a>
                            <a href="#" aria-label="RSS">⌘</a>
                        </div>
                    </div>
                </div>

                {/* News Column */}
                <div className="footer-section">
                    <h3>News</h3>
                    <ul>
                        <li><Link to="/">Latest News</Link></li>
                        <li><Link to="/">Top Headlines</Link></li>
                        <li><Link to="/news-analytics">Politics</Link></li>
                        <li><Link to="/news-analytics">Business</Link></li>
                        <li><Link to="/news-analytics">Sports</Link></li>
                    </ul>
                </div>

                {/* International Column */}
                <div className="footer-section">
                    <h3>International</h3>
                    <ul>
                        <li><Link to="/">World News</Link></li>
                        <li><Link to="/news-analytics">Global Economy</Link></li>
                        <li><Link to="/news-analytics">Foreign Affairs</Link></li>
                        <li><Link to="/">United Nations</Link></li>
                        <li><Link to="/news-analytics">Diplomacy</Link></li>
                    </ul>
                </div>

                {/* Features Column */}
                <div className="footer-section">
                    <h3>Features</h3>
                    <ul>
                        <li><Link to="/media-bias">Media Bias</Link></li>
                        <li><Link to="/story-comparison">Story Comparison</Link></li>
                        <li><Link to="/personalized-feed">My Feed</Link></li>
                        <li><Link to="/news-analytics">Analytics</Link></li>
                        <li><Link to="/search">Search</Link></li>
                    </ul>
                </div>

                {/* Trending Column */}
                <div className="footer-section">
                    <h3>Trending</h3>
                    <ul>
                        <li><Link to="/">Top Stories</Link></li>
                        <li><Link to="/news-analytics">Technology</Link></li>
                        <li><Link to="/news-analytics">Entertainment</Link></li>
                        <li><Link to="/news-analytics">Science</Link></li>
                        <li><Link to="/news-analytics">Health</Link></li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom">
                <div className="footer-bottom-inner">
                    <p className="footer-copyright">
                        © {currentYear} <strong>InsightWire</strong>. All rights reserved.
                    </p>
                    <div className="footer-bottom-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Use</a>
                        <a href="#">Cookie Policy</a>
                    </div>
                    <div className="footer-badge">AI Powered</div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
