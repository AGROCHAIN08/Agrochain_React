import "../assets/css/retailer.css";

export default function RetailerDashboard() {
  return (
    <div className="retailer-dashboard">
      <nav className="navbar">
        <div className="nav-left">
          <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" alt="AgroChain Logo" className="logo" />
          <span className="brand-name">Agro<span className="chain-text">Chain</span></span>
        </div>
      </nav>

      <main className="retailer-main">
        <h2>🛍️ Retailer Dashboard</h2>
        <p>Browse products, manage orders, and track reviews.</p>
      </main>
    </div>
  );
}
