import { useState } from "react";
import { Link } from "react-router-dom";
import "../assets/css/home.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-left">
        <img
          src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh"
          alt="AgroChain Logo"
          className="logo"
        />
        <span className="brand-name">
          Agro<span className="chain-text">Chain</span>
        </span>
      </div>

      <button className="mobile-menu-toggle" onClick={toggleMenu}>
        <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"}`}></i>
      </button>

      <div className={`nav-center ${menuOpen ? "active" : ""}`}>
        <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
        <Link to="/about" className="nav-link" onClick={closeMenu}>About</Link>
        <a href="#features" className="nav-link" onClick={closeMenu}>Features</a>
        <a href="#roles" className="nav-link" onClick={closeMenu}>User Roles</a>
      </div>

      <div className="nav-right">
        <Link to="/login"><button className="btn">Log In</button></Link>
        <Link to="/signup"><button className="btn btn-signup">Sign Up</button></Link>
      </div>
    </nav>
  );
}
