import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../assets/css/admin.css'; 
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

// --- AdminNavbar Component (from admin.html) ---
const AdminNavbar = ({ onSignout, onNavigate }) => {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" className="logo" alt="AgroChain Logo" />
        <span className="brand-name">Agro<span className="chain-text">Chain</span></span>
      </div>
      <div className="nav-center">
        <button id="analyticsTab" className="nav-btn active" onClick={() => onNavigate('analytics')}>📊 System Analytics</button>
        <button id="coreTab" className="nav-btn" onClick={() => onNavigate('core')}>⚙️ User Management</button>
        <button id="activityTab" className="nav-btn" onClick={() => onNavigate('activity')}>📜 Activity Logs</button>
      </div>
      <div className="nav-right">
        <span className="admin-badge">👤 Admin</span>
        <button id="signoutBtn" className="logout-btn" onClick={onSignout}>🚪 Sign Out</button>
      </div>
    </nav>
  );
};

// --- AdminDashboard Page Component ---
const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('analytics');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Loading ---
  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load all data concurrently
      const [statsRes, usersRes, logsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/logs')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadAllData();
  }, []);

  // --- Handlers ---
  const handleSignout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
      navigate('/login');
    }
  };

  const handleNavigate = (section) => {
    setActiveSection(section);
  };
  
  // --- Chart Data Formatting (from admin.js logic) ---
  const userDistData = stats ? {
    labels: ['Farmers', 'Dealers', 'Retailers'],
    datasets: [{
      data: [stats.farmers, stats.dealers, stats.retailers],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
    }]
  } : { labels: [], datasets: [] };
  
  // (You would replace these with real data from stats)
  const ordersTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Monthly Orders',
      data: [120, 180, 150, 220, 280, 350],
      borderColor: '#8b5cf6',
      fill: false,
    }]
  };
  
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Monthly Revenue',
      data: [1200000, 1450000, 1300000, 1650000, 1800000, 2100000],
      backgroundColor: '#06b6d4',
    }]
  };
  
  // --- User Management Logic (from admin.js) ---
  // ... (deleteUser, deactivateUser, filter logic) ...

  return (
    <>
      <AdminNavbar onSignout={handleSignout} onNavigate={handleNavigate} />
      
      <main className="main-container">
        {loading && <p>Loading dashboard...</p>}
        {error && <p style={{color: 'red'}}>{error}</p>}

        {/* Analytics Section */}
        <section id="analyticsSection" className={activeSection === 'analytics' ? 'section active' : 'section'}>
          <h2>📊 System Analytics & Insights</h2>
          {stats && (
            <>
              <div className="stats-grid" id="statsGrid">
                <div className="stat-card stat-farmers"><h3>Farmers</h3><p id="farmerCount">{stats.farmers}</p></div>
                <div className="stat-card stat-dealers"><h3>Dealers</h3><p id="dealerCount">{stats.dealers}</p></div>
                <div className="stat-card stat-retailers"><h3>Retailers</h3><p id="retailerCount">{stats.retailers}</p></div>
                <div className="stat-card stat-products"><h3>Total Products</h3><p id="productCount">{stats.products}</p></div>
                <div className="stat-card stat-orders"><h3>Total Orders</h3><p id="orderCount">{stats.orders}</p></div>
                <div className="stat-card stat-revenue"><h3>Total Revenue</h3><p id="totalAmount">₹{stats.totalAmount.toLocaleString('en-IN')}</p></div>
              </div>

              <div className="charts-container">
                <div className="chart-card">
                  <h3>📈 User Distribution</h3>
                  <Pie data={userDistData} />
                </div>
                <div className="chart-card">
                  <h3>📊 Monthly Orders Trend</h3>
                  <Line data={ordersTrendData} />
                </div>
                <div className="chart-card full-width">
                  <h3>💹 Revenue Analytics (Last 6 Months)</h3>
                  <Bar data={revenueData} />
                </div>
              </div>
            </>
          )}
        </section>
        
        {/* User Management Section */}
        <section id="coreSection" className={activeSection === 'core' ? 'section active' : 'section'}>
          <h2>⚙️ User Management & Control</h2>
          {/* ... (Filter bar) ... */}
          <div id="usersTableContainer" className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td><strong>{u.firstName} {u.lastName || ''}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.isActive === false ? 'Inactive' : 'Active'}</td>
                    <td>
                      <button className="action-btn delete">🗑️ Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        
        {/* Activity Logs Section */}
        <section id="activitySection" className={activeSection === 'activity' ? 'section active' : 'section'}>
          <h2>📜 User Activity Logs</h2>
          {/* ... (Filter bar) ... */}
          <div id="logsTableContainer" className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Action</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td><strong>{log.userEmail}</strong></td>
                    <td>{log.actionType}</td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
};

export default AdminDashboard;