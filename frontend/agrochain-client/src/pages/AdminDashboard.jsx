import "../assets/css/admin.css";

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <nav className="navbar">
        <div className="nav-left">
          <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" className="logo" alt="AgroChain Logo" />
          <span className="brand-name">Agro<span className="chain-text">Chain</span></span>
        </div>
        <div className="nav-center">
          <button className="nav-btn active">📊 System Analytics</button>
          <button className="nav-btn">⚙️ User Management</button>
          <button className="nav-btn">📜 Activity Logs</button>
        </div>
        <div className="nav-right">
          <span className="admin-badge">👤 Admin</span>
          <button className="logout-btn">🚪 Sign Out</button>
        </div>
      </nav>

      <main className="main-container">
        <section className="section active">
          <h2>📊 System Analytics & Insights</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Farmers</h3>
              <p>250</p>
            </div>
            <div className="stat-card">
              <h3>Dealers</h3>
              <p>180</p>
            </div>
            <div className="stat-card">
              <h3>Retailers</h3>
              <p>320</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
