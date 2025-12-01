import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../assets/css/about.css'; 

// About Page component
const About = () => {
  return (
    <>
      <Navbar /> 
      
      <header className="about-header">
          <h1>About AgroChain</h1>
          <p>Connecting farmers, suppliers, and consumers through trust and transparency worldwide</p>
      </header>

      <section className="story-section">
          <div className="story-card">
              <h2>Our Story</h2>
              <div className="underline"></div>
              <p>
                 AgroChain was founded in 2025 with a simple mission: to make agricultural trade more transparent, fair, and efficient. What started as a small idea to connect local farmers with buyers has now grown into a trusted platform empowering thousands of agricultural producers across the globe.
              </p>
              <p>
                  We believe that agriculture is the backbone of our economy – and through technology, we aim to make every link in the supply chain traceable, reliable, and sustainable. From farmers and wholesalers to retailers and consumers, AgroChain ensures that every transaction adds value and fosters trust.
              </p>
          </div>
      </section>

      <section className="mission-vision-section">
          <div className="mission-vision-container">
              <div className="mission-card">
                  <div className="card-icon"><i className="fas fa-bullseye"></i></div>
                  <h2>Our Mission</h2>
                  <p>To revolutionize agricultural trade by providing a platform that offers transparency...</p>
              </div>
              <div className="vision-card">
                  <div className="card-icon"><i className="fas fa-eye"></i></div>
                  <h2>Our Vision</h2>
                  <p>We envision a world where agricultural supply chains are seamless...</p>
              </div>
          </div>
      </section>

      <section className="team-section">
          <h2 className="team-title">Meet Our Team</h2>
          <div className="team-underline"></div> 
          <div className="team-container team-row-top">
                {/* --- Sriman --- */}
                <div className="team-card">
                    <div className="team-image">
                        <img src="https://i.postimg.cc/ZYMZXdMf/Whats-App-Image-2025-10-15-at-04-04-54-bf405ea2.jpg" alt="B. Srimanreddy" />
                    </div>
                    <div className="team-content">
                        <h3>B. Sriman Reddy</h3>
                        <p className="team-role">Farmer Experience Lead</p>
                        <p className="team-description">
                        Leads the overall AgroChain development team. Designed and built the login and authentication systems...
                        </p>
                        <div className="team-social">
                            <a href="http://www.linkedin.com/in/srimanreddy-bommireddy-b351ab282"><i className="fab fa-linkedin-in"></i></a>
                            <a href="https://github.com/Sriman2517"><i className="fab fa-github"></i></a>
                            <a href="mailto:srimanreddy.b23@iiits.in"><i className="fas fa-envelope"></i></a>
                        </div>
                    </div>
                </div>
                {/* --- Palvash --- */}
                <div className="team-card">
                   <div className="team-image">
                        <img src="https://i.postimg.cc/7YNLd6SJ/Whats-App-Image-2025-10-15-at-04-18-15-f80d4e99.jpg" alt="A. Palvash Kumar" />
                    </div>
                    <div className="team-content">
                        <h3>A. Palvash Kumar</h3>
                        <p className="team-role">Dealer Operations Lead</p>
                        <p className="team-description">
                        Focuses on ensuring dealers have an efficient space to manage their listings and trade with farmers...
                        </p>
                        <div className="team-social">
                            <a href="https://www.linkedin.com/in/palvash-kumar-avasu-7b370228b/"><i className="fab fa-linkedin-in"></i></a>
                            <a href="https://github.com/Palvash-kumar"><i className="fab fa-github"></i></a>
                            <a href="mailto:palvashkumar.a23@iiits.in"><i className="fas fa-envelope"></i></a>
                        </div>
                    </div>
                </div>
                {/* --- Anoop --- */}
                <div className="team-card">
                   <div className="team-image">
                        <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_maRilyRBx" alt="A. Anoop" />
                    </div>
                    <div className="team-content">
                        <h3>A. Anoop</h3>
                        <p className="team-role">Dealer Platform Coordinator</p>
                        <p className="team-description">
                        Works closely with Palvash on the Dealer Dashboard. Focuses on maintaining stable dealer operations...
                        </p>
                        <div className="team-social">
                            <a href="http://www.linkedin.com/in/anoop-annapureddy-16a331309"><i className="fab fa-linkedin-in"></i></a>
                            <a href="https://github.com/Anoopreddy-debug"><i className="fab fa-github"></i></a>
                            <a href="mailto:anoop.a23@iiits.in"><i className="fas fa-envelope"></i></a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="team-container team-row-bottom">
                 {/* --- Vishwesh --- */}
                <div className="team-card">
                    <div className="team-image">
                        <img src="https://i.postimg.cc/zXNSZ0Pc/Whats-App-Image-2025-10-15-at-04-30-05-eed46b5a.jpg" alt="B. Vishwesh" />
                    </div>
                    <div className="team-content">
                        <h3>B. Vishwesh</h3>
                        <p className="team-role">Retail Experience Lead</p>
                        <p className="team-description">
                        Handles the Retailer Dashboard and ensures retailers can easily browse and buy products...
                        </p>
                        <div className="team-social">
                            <a href="https://www.linkedin.com/in/vishwesh-boddu-20458a388/"><i className="fab fa-linkedin-in"></i></a>
                            <a href="https://github.com/vishu2726"><i className="fab fa-github"></i></a>
                            <a href="mailto:vishwesh.b23@iiits.in"><i className="fas fa-envelope"></i></a>
                        </div>
                    </div>
                </div>
                {/* --- Om Sai --- */}
                <div className="team-card">
                    <div className="team-image">
                        <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_UR521elVM" alt="D. Om Sai" />
                    </div>
                    <div className="team-content">
                        <h3>D. Om Sai</h3>
                        <p className="team-role">System Operations Lead</p>
                        <p className="team-description">
                        Oversees the Admin Dashboard, managing analytics, user activities, and platform monitoring...
                        </p>
                        <div className="team-social">
                            <a href="https://www.linkedin.com/in/dharavath-sai-baa836320"><i className="fab fa-linkedin-in"></i></a>
                            <a href="https://github.com/omsai-1"><i className="fab fa-github"></i></a>
                            <a href="mailto:omsai.d23@iiits.in"><i className="fas fa-envelope"></i></a>
                        </div>
                    </div>
                </div>
            </div>
      </section>

    <Footer />
    </>
  );
};

export default About;