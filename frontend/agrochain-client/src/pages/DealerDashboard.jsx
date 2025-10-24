import "../assets/css/dealer.css";

export default function DealerDashboard() {
  return (
    <div className="dealer-dashboard">
      <nav className="navbar">
        <div className="nav-left">
          <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" alt="AgroChain Logo" className="logo" />
          <span className="brand-name">Agro<span className="chain-text">Chain</span></span>
        </div>
      </nav>

      <main className="dealer-main">
        <h2>🏢 Dealer Dashboard</h2>
        <p>Access products, inventory, and retailer orders.</p>
      </main>
    </div>
  );
}
