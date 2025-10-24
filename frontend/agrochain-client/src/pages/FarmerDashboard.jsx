import "../assets/css/farmer.css";

export default function FarmerDashboard() {
  return (
    <div className="farmer-dashboard">
      <nav className="navbar">
        <div className="nav-left">
          <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" alt="AgroChain Logo" className="logo" />
          <span className="brand-name">Agro<span className="chain-text">Chain</span></span>
        </div>
      </nav>

      <main className="farmer-main">
        <h2>🌾 Farmer Inventory Dashboard</h2>
        <p>Manage crops, prices, and orders efficiently.</p>
      </main>
    </div>
  );
}
