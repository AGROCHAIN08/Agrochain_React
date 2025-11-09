import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Import the home.css styles directly into this component
import '../assets/css/home.css'; 

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // This logic comes from your home.js for the mobile menu
  useEffect(() => {
    const navCenter = document.querySelector('.nav-center');
    if (!navCenter) return;

    if (isMobileMenuOpen) {
      navCenter.classList.add('active');
    } else {
      navCenter.classList.remove('active');
    }
  }, [isMobileMenuOpen]);

  // Close menu when a link is clicked
  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" alt="AgroChain Logo" className="logo" />
        <span className="brand-name">Agro<span className="chain-text">Chain</span></span>
      </div>
      
      <button 
        className="mobile-menu-toggle" 
        aria-label="Toggle navigation menu"
        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
      >
        <i className={isMobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
      </button>
      
      <div className="nav-center">
        <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
        <Link to="/about" className="nav-link" onClick={closeMenu}>About</Link>
        {/* Use <a> for hash links to scroll on the same page */}
        <a href="/#features" className="nav-link" onClick={closeMenu}>Features</a>
        <a href="/#roles" className="nav-link" onClick={closeMenu}>User Roles</a>
      </div>
      
      <div className="nav-right">
        <Link to="/login"><button className="btn">Log In</button></Link>
        <Link to="/signup"><button className="btn btn-signup">Sign Up</button></Link>
      </div>
    </nav>
  );
};

export default Navbar;