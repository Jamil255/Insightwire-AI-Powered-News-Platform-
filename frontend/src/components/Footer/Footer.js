import React from 'react';
import './Footer.css'; // Import the CSS file for styling

const Footer = () => {
    return (
        <div className="footer-container">
            <div className="footer-section">
                <h3>News</h3>
                <ul>
                    <li>Latest News</li>
                    <li>Top Headlines</li>
                    <li>Politics</li>
                    <li>Business</li>
                    <li>Sports</li>
                </ul>
            </div>
            <div className="footer-section">
                <h3>International</h3>
                <ul>
                    <li>World News</li>
                    <li>Global Economy</li>
                    <li>Foreign Affairs</li>
                    <li>United Nations</li>
                    <li>Diplomacy</li>
                </ul>
            </div>
            <div className="footer-section">
                <h3>Trendings</h3>
                <ul>
                    <li>Top Stories</li>
                    <li>Technology</li>
                    <li>Entertainment</li>
                    <li>Science</li>
                    <li>Health</li>
                </ul>
            </div>
            <div className="footer-section">
                <h3>Local News</h3>
                <ul>
                    <li>City Updates</li>
                    <li>Regional Politics</li>
                    <li>Weather Reports</li>
                    <li>Local Events</li>
                    <li>Crime Reports</li>
                </ul>
            </div>
        </div>
    );
};

export default Footer;
