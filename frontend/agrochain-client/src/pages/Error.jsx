// src/pages/Error.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar'; 
import Footer from '../components/Footer'; 
import '../assets/css/error.css';

const Error = () => {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <Navbar />
      
      <div className="error-container">
        <div className="error-content">
          <h1 className="error-code">404</h1>
          <h2 className="error-heading">Page Not Found</h2>
          <p className="error-message">
            Oops! The page you're looking for doesn't exist. 
            It might have been moved or deleted.
          </p>
          <button 
            className="home-btn" 
            onClick={() => navigate('/')}
            aria-label="Return to homepage"
          >
            Go Back to Home
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Error;