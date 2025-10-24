import "../assets/css/home.css";

export default function Footer() {
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
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
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
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 AgroChain Website. All rights reserved.</p>
      </div>
    </footer>
  );
}
