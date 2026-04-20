import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/home.css'; 

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="agro-navbar">
      <div className="agro-nav-header">
        <Link to="/" className="agro-nav-left" onClick={closeMenu}>
          <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" alt="AgroChain Logo" className="agro-logo" />
          <span className="agro-brand-name">Agro<span className="agro-chain-text">Chain</span></span>
        </Link>
        
        <button 
          className="agro-mobile-toggle" 
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        >
          <i className={isMobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </button>
      </div>
      
      <div className={`agro-nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="agro-nav-center">
          <Link to="/" className="agro-nav-link" onClick={closeMenu}>Home</Link>
          <Link to="/about" className="agro-nav-link" onClick={closeMenu}>About</Link>
          <a href="/#features" className="agro-nav-link" onClick={closeMenu}>Features</a>
          <a href="/#roles" className="agro-nav-link" onClick={closeMenu}>User Roles</a>
        </div>
        
        <div className="agro-nav-right">
          <Link to="/login" onClick={closeMenu}><button className="agro-btn">Log In</button></Link>
          <Link to="/signup" onClick={closeMenu}><button className="agro-btn agro-btn-signup">Sign Up</button></Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;