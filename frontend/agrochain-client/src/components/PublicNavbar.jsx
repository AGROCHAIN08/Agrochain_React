import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/home.css'; // Use home.css for styling

const PublicNavbar = () => {
  // You would add mobile toggle logic here with useState
  
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" alt="AgroChain Logo" className="logo" />
        <span className="brand-name">Agro<span className="chain-text">Chain</span></span>
      </div>
      
      <button className="mobile-menu-toggle" aria-label="Toggle navigation menu">
        <i className="fas fa-bars"></i>
      </button>
      
      <div className="nav-center">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link">About</Link>
        {/* We use <a> for hash links to scroll on the same page */}
        <a href="/#features" className="nav-link">Features</a>
        <a href="/#roles" className="nav-link">User Roles</a>
      </div>
      
      <div className="nav-right">
        <Link to="/login"><button className="btn">Log In</button></Link>
        <Link to="/signup"><button className="btn btn-signup">Sign Up</button></Link>
      </div>
    </nav>
  );
};

export default PublicNavbar;