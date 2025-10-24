import "../assets/css/home.css";
import RoleCards from "../components/RoleCards";

export default function Home() {
  return (
    <div className="home-page">
      <section id="home" className="hero-section">
        <div className="container hero-container-content">
          <div className="hero-text-content">
            <p className="hero-subtitle-top">Welcome to AgroChain</p>
            <h1 className="hero-title-main">
              <span className="green-text">Empowering Every Node in</span> Agricultural Supply Chain
            </h1>
            <div className="hero-buttons">
              <a href="/login">
                <button className="btn-primary">Get Started</button>
              </a>
            </div>
          </div>

          <div className="hero-image-collage-container">
            <div className="image-box image-center">
              <img src="https://i.postimg.cc/T345N1Xw/Farmer.jpg" alt="Farmer" />
            </div>
            <div className="image-box image-top-left">
              <img src="https://blog.agribazaar.com/wp-content/uploads/2020/10/img_0143.jpg" alt="Platform" />
            </div>
            <div className="image-box image-bottom-right">
              <img src="https://imgmediagumlet.lbb.in/media/2024/04/660a45fd89be373da51865fc_1711949309521.jpg" alt="Harvest" />
            </div>
          </div>
        </div>
      </section>

      <RoleCards />

      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Agricultural Business?</h2>
          <p>Join thousands of farmers, dealers, and retailers who trust AgroChain</p>
          <a href="/signup">
            <button className="btn-cta">Get Started Today</button>
          </a>
        </div>
      </section>
    </div>
  );
}
