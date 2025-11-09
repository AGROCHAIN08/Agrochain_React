import React from 'react';
import { Link } from 'react-router-dom';

// Import the CSS that styles the footer
// We use home.css since it's the primary stylesheet for public pages
import '../assets/css/home.css'; 

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        <div className="footer-column">
          <h3>About Us</h3>
          <p>
            We empower farmers and consumers by building a transparent agricultural ecosystem. 
            Discover, connect, and trade sustainably with AgroChain.
          </p>
        </div>

        <div className="footer-column">
          <h3>Quick Links</h3>
          <ul>
            {/* Use <Link> for internal React routing */}
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            
            {/* Use <a> for links to page sections (anchor links) */}
            <li><a href="#features">Features</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Contact Us</h3>
          <p><i className="fa-solid fa-location-dot"></i> IIIT Sri City, Chittoor, India</p>
          <p><i className="fa-solid fa-phone"></i> +91 7416995503</p>
          <p><i className="fa-solid fa-envelope"></i> agrochain08@gmail.com</p>
        </div>

        <div className="footer-column">
          <h3>Follow Us</h3>
          <div className="social-icons">
            {/* These are external links, so <a> is correct */}
            <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 AgroChain Website. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;