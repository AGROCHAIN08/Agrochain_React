import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Home Page component
const Home = () => {
  return (
    <>
      <Navbar /> 
      
      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="container hero-container-content">
            <div className="hero-text-content">
                <p className="hero-subtitle-top">Welcome to AgroChain</p>
                <br/>
                <h1 className="hero-title-main">
                    <span className="green-text">Empowering Every Node in</span>
                    Agricultural Supply Chain
                </h1>
                <div className="hero-buttons">
                    <Link to="/login"><button className="btn-primary">Get Started</button></Link>
                </div>
            </div>
            <div className="hero-image-collage-container">
                <div className="image-box image-center">
                    <img src="https://i.postimg.cc/T345N1Xw/Farmer.jpg" alt="Agricultural Stakeholders Collage" />
                </div>
                <div className="image-box image-top-left">
                    <img src="https://blog.agribazaar.com/wp-content/uploads/2020/10/img_0143.jpg" alt="Digital Platform View" />
                </div>
                <div className="image-box image-bottom-right">
                    <img src="https://imgmediagumlet.lbb.in/media/2024/04/660a45fd89be373da51865fc_1711949309521.jpg" alt="Harvested products" />
                </div>
            </div>
        </div>
        <div className="hero-bg-graphic"></div>
      </section>

      {/* Impact Section */}
      <section className="impact-section">
        <div className="container">
            <div className="section-header">
                <h2>Our Impact</h2>
                <div className="section-underline"></div>
            </div>
            {/* --- Your Impact Cards HTML --- */}
            <div className="impact-grid">
                <div className="impact-card">
                    <div className="impact-icon"><i className="fas fa-chart-line"></i></div>
                    <h3>Reduced Wastage</h3>
                    <p>Minimize product loss through better storage and inventory management.</p>
                </div>
                <div className="impact-card">
                   <div className="impact-icon"><i className="fas fa-hand-holding-usd"></i></div>
                    <h3>Improved Price Realization</h3>
                    <p>Fair pricing for farmers through direct market access and transparency.</p>
                </div>
                <div className="impact-card">
                    <div className="impact-icon"><i className="fas fa-handshake"></i></div>
                    <h3>Trust Building</h3>
                    <p>Foster trust among all stakeholders with transparent operations.</p>
                </div>
                <div className="impact-card">
                    <div className="impact-icon"><i className="fas fa-leaf"></i></div>
                    <h3>Sustainability</h3>
                    <p>Contribute to a sustainable agricultural ecosystem with efficient resource use.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
            <div className="section-header">
                <h2>Platform Features</h2>
                <div className="section-underline"></div>
            </div>
            {/* --- Your Features Cards HTML --- */}
            <div className="features-container">
                 <div className="feature-category">
                    <div className="feature-header">
                        <div className="feature-icon farmer-icon"><i className="fas fa-tractor"></i></div>
                        <h3>Farmer Features</h3>
                    </div>
                    <ul className="feature-list">
                        <li><i className="fas fa-box"></i> Stock inventory management</li>
                        <li><i className="fas fa-file-contract"></i> Contract creation and management</li>
                        <li><i className="fas fa-file-alt"></i> Document digitization</li>
                        <li><i className="fas fa-truck"></i> Delivery scheduling</li>
                        <li><i className="fas fa-credit-card"></i> Payment tracking</li>
                    </ul>
                </div>
                <div className="feature-category">
                     <div className="feature-header">
                        <div className="feature-icon dealer-icon"><i className="fas fa-warehouse"></i></div>
                        <h3>Dealer Features</h3>
                    </div>
                    <ul className="feature-list">
                        <li><i className="fas fa-shopping-cart"></i> Order management</li>
                        <li><i className="fas fa-shipping-fast"></i> Transport assignment</li>
                        <li><i className="fas fa-chart-bar"></i> Stock tracking (with storage condition monitoring)</li>
                        <li><i className="fas fa-handshake"></i> Contract management</li>
                        <li><i className="fas fa-clipboard-list"></i> Procurement processes</li>
                    </ul>
                </div>
                <div className="feature-category">
                    <div className="feature-header">
                        <div className="feature-icon retailer-icon"><i className="fas fa-store"></i></div>
                        <h3>Retailer Features</h3>
                    </div>
                    <ul className="feature-list">
                        <li><i className="fas fa-file-invoice"></i> Purchase order management</li>
                        <li><i className="fas fa-box-open"></i> Stock receipt</li>
                        <li><i className="fas fa-inventory"></i> Inventory management</li>
                        <li><i className="fas fa-money-check"></i> Payment processing</li>
                        <li><i className="fas fa-route"></i> Delivery tracking</li>
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="roles-section">
        <div className="container">
            <div className="section-header">
                <h2>Users & Their Roles</h2>
                <div className="section-underline"></div>
            </div>
            {/* --- Your Role Cards HTML --- */}
            <div className="roles-grid roles-grid-three"> 
                <div className="role-card">
                    <div className="role-image"><img src="https://media.istockphoto.com/photos/farmer-in-field-picture-id958375244?k=6&m=958375244&s=170667a&w=0&h=tWi266M_Ki2dsWk5IEGHAhrzXOLmsa45Oq6FuTJV3UY=" alt="Farmer" /></div>
                    <div className="role-content">
                        <div className="role-icon"><i className="fas fa-tractor"></i></div>
                        <h3>Farmers</h3>
                        <p className="role-subtitle">Primary Producers</p>
                        <p className="role-description">List agricultural products, manage inventory, and track sales through personalized dashboards.</p>
                        <Link to="/login"><button className="role-btn">Register as Farmer</button></Link>
                    </div>
                </div>
                <div className="role-card">
                    <div className="role-image"><img src="https://irp.cdn-website.com/6569b6f0/dms3rep/multi/CPT_1184-18741928.JPG" alt="Dealer" /></div>
                    <div className="role-content">
                        <div className="role-icon"><i className="fas fa-warehouse"></i></div>
                        <h3>Dealers</h3>
                        <p className="role-subtitle">Intermediary Buyers</p>
                        <p className="role-description">Purchase in bulk from farmers and handle transportation. They can browse products and place bulk orders.</p>
                        <Link to="/login"><button className="role-btn">Register as Dealer</button></Link>
                    </div>
                </div>
                <div className="role-card">
                    <div className="role-image"><img src="https://tse3.mm.bing.net/th/id/OIP.fF2-JVup5DRVfufabXOUjAAAAA?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3" alt="Retailer" /></div>
                    <div className="role-content">
                        <div className="role-icon"><i className="fas fa-store"></i></div>
                        <h3>Retailers</h3>
                        <p className="role-subtitle">End-Point Businesses</p>
                        <p className="role-description">Purchase products from dealers for consumer sales. They can place orders and manage inventory.</p>
                        <Link to="/login"><button className="role-btn">Register as Retailer</button></Link>
                    </div>
                </div>
            </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
            <h2>Ready to Transform Your Agricultural Business?</h2>
            <p>Join thousands of farmers, dealers, and retailers who trust AgroChain</p>
            <Link to="/signup"><button className="btn-cta">Get Started Today</button></Link>
        </div>
      </section>

      <Footer />

    </>
  );
};

export default Home;