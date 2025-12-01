import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../assets/css/farmer.css'; 
import { useNavigate } from 'react-router-dom';

// --- FarmerNavbar Component (from farmer.html) ---
// THIS IS DEFINED *INSIDE* THE DASHBOARD FILE
const FarmerNavbar = ({ user, notificationCount, onSignout, onNavigate, activeSection }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav className="navbar farmer-navbar">
      <div className="nav-left">
        <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" alt="AgroChain Logo" className="logo" />
        <span className="brand-name">Agro<span className="chain-text">Chain</span></span>
      </div>
      
      <button className="menu-toggle" id="menuToggleBtn" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✖' : '☰'}
      </button>
      
      <div className={`nav-links-container ${menuOpen ? 'active' : ''}`} id="navLinksContainer">
          <div className="nav-center">
            <a href="#" className={activeSection === 'inventory' ? 'nav-link active' : 'nav-link'} onClick={() => onNavigate('inventory')}>
              <span className="nav-icon">🌾</span> Inventory
            </a>
            <a href="#" className={activeSection === 'orders' ? 'nav-link active' : 'nav-link'} onClick={() => onNavigate('orders')}>
              <span className="nav-icon">📦</span> Orders
            </a>
          </div>
          
          <div className="nav-right">
            <a href="#" className={activeSection === 'notifications' ? 'nav-link active' : 'nav-link'} id="navNotificationBtn" onClick={() => onNavigate('notifications')}>
              <span className="nav-icon">🔔</span>
              {notificationCount > 0 &&
                <span className="notification-badge" id="notificationBadge">{notificationCount}</span>
              }
            </a>
            <div className="profile-dropdown">
              <button className="profile-btn" id="profileDropdownBtn" onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
                <span className="profile-icon">👤</span>
                <span id="farmerNameDisplay">{user ? user.firstName : 'Farmer'}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              <div className={`profile-dropdown-menu ${dropdownOpen ? 'show' : ''}`} id="profileDropdownMenu">
                <a href="#" className="dropdown-item" id="viewProfileBtn" onClick={() => onNavigate('profile')}>
                  <span className="dropdown-icon">👤</span> My Profile
                </a>
                <div className="dropdown-divider"></div>
                <a href="#" className="dropdown-item logout-item" id="navSignoutBtn" onClick={onSignout}>
                  <span className="dropdown-icon">🚪</span> Sign Out
                </a>
              </div>
            </div>
          </div>
      </div>
    </nav>
  );
};

// --- FarmerDashboard Page Component ---
const FarmerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState('inventory');
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  // Add this to your existing modal state
  const [modal, setModal] = useState({ 
    farmer: false, 
    assignVehicle: false, 
    review: false, 
    bid: false, 
    receipt: false, 
    viewReviews: false,
    farmerReceipt: false  // ADD THIS
  });

  // Add state to track selected order for receipt
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showCropForm, setShowCropForm] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({
    productType: '', varietySpecies: '', harvestQuantity: '',
    unitOfSale: 'kg', targetPrice: '', image: null,
  });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [editProfileData, setEditProfileData] = useState(null);

  // --- Data Loading ---
  const loadAllData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [cropsRes, ordersRes, notificationsRes, profileRes] = await Promise.all([
        api.get(`/farmer/crops/${user.email}`),
        api.get(`/farmer/orders/${user.email}`),
        api.get(`/farmer/notifications/${user.email}`),
        api.get(`/auth/profile/${user.email}`)
      ]);
      setCrops(cropsRes.data);
      setOrders(ordersRes.data);
      setNotifications(notificationsRes.data);
      setProfile(profileRes.data);
      setEditProfileData({
        farmLocation: profileRes.data.farmLocation || '',
        latitude: profileRes.data.latitude || '',
        longitude: profileRes.data.longitude || '',
        farmSize: profileRes.data.farmSize || ''
      });
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAllData();
  }, [user, loadAllData]);

  const handleSignout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
      navigate('/login');
    }
  };

  const handleNavigate = (section) => {
    setActiveSection(section);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, image: e.target.files[0] }));
  };
  
  const resetForm = () => {
    setFormData({
      productType: '', varietySpecies: '', harvestQuantity: '',
      unitOfSale: 'kg', targetPrice: '', image: null,
    });
    setIsEditing(null);
    setShowCropForm(false);
  };

  const handleCropSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormMessage({ type: '', text: '' });

    const data = new FormData();
    data.append("productType", formData.productType);
    data.append("varietySpecies", formData.varietySpecies);
    data.append("harvestQuantity", formData.harvestQuantity);
    data.append("unitOfSale", formData.unitOfSale);
    data.append("targetPrice", formData.targetPrice);
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      let res;
      if (isEditing) {
        res = await api.put(`/farmer/crops/${user.email}/${isEditing}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post(`/farmer/crops/${user.email}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setFormMessage({ type: 'success', text: `Product ${isEditing ? 'updated' : 'added'}!` });
      resetForm();
      loadAllData(); 
    } catch (err) {
      setFormMessage({ type: 'error', text: err.response?.data?.msg || 'Operation failed' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditClick = (crop) => {
    setIsEditing(crop._id);
    setFormData({
      productType: crop.productType,
      varietySpecies: crop.varietySpecies,
      harvestQuantity: crop.harvestQuantity,
      unitOfSale: crop.unitOfSale,
      targetPrice: crop.targetPrice,
      image: null,
    });
    setShowCropForm(true);
    window.scrollTo(0, 0);
  };
  
  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/farmer/crops/${user.email}/${cropId}`);
      setFormMessage({ type: 'success', text: 'Product deleted!' });
      loadAllData();
    } catch (err) {
      setFormMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to delete' });
    }
  };

 const handleAcceptBid = async (orderId) => {
  if (!window.confirm('Are you sure you want to accept this bid?')) return;
  
  try {
    const res = await api.post(`/farmer/accept-bid/${user.email}`, { orderId });
    const data = res.data;
    
    if (res.status === 200 || res.status === 201) {
      alert(`✅ Bid accepted! Receipt Number: ${data.receiptNumber}`);
      
      // Reload all data to get updated inventory and orders
      await loadAllData();
      
      // Optional: Show receipt modal immediately
      // You can add a receipt modal state and show it here if needed
    }
  } catch (err) {
    alert(err.response?.data?.msg || 'Error accepting bid');
    console.error('Error accepting bid:', err);
  }
};

  const handleRejectBid = async (orderId) => {
    if (!window.confirm('Are you sure you want to reject this bid?')) return;
    try {
      await api.post(`/farmer/reject-bid/${user.email}`, { orderId });
      alert('Bid rejected.');
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error rejecting bid');
    }
  };
  
  const handleProfileEditChange = (e) => {
    const { name, value } = e.target;
    setEditProfileData(prev => ({...prev, [name]: value}));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/auth/farmer/update/${user.email}`, editProfileData);
      alert("Profile updated!");
      loadAllData();
      setEditProfileData(null); // Close edit form
    } catch (err) {
       alert(err.response?.data?.msg || 'Error updating profile');
    }
  };

  const handleGetGeo = () => {
     if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setEditProfileData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          alert("📍 Location updated!");
        },
        () => alert("Unable to fetch location. Please allow access.")
      );
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <FarmerNavbar 
        user={user} 
        notificationCount={unreadCount}
        onSignout={handleSignout} 
        onNavigate={handleNavigate} 
        activeSection={activeSection}
      />
      
      <div className="content">
        {error && <div className="error-message">{error}</div>}
        {formMessage.text && <div className={formMessage.type === 'success' ? 'message' : 'error-message'}>{formMessage.text}</div>}
        
        {activeSection === 'inventory' && (
          <section id="inventorySection">
            <div className="section-header">
              <button className="add-btn" onClick={() => setShowCropForm(!showCropForm)}>
                {showCropForm ? '✖ Cancel' : '+ Add New Product'}
              </button>
            </div>
            {showCropForm && (
              <form id="cropForm" onSubmit={handleCropSubmit}>
                <div className="form-row">
                  <label>Product Type:
                    <select name="productType" value={formData.productType} onChange={handleFormChange} required>
                      <option value="">Select Product Type</option>
                      <option value="Fruit">Fruit</option>
                      <option value="Vegetable">Vegetable</option>
                      <option value="Cereal">Cereal</option>
                      <option value="Spices">Spices</option>
                      <option value="Pulses">Pulses</option>
                      <option value="Oil Seeds">Oil Seeds</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                </div>
                <div className="form-row">
                  <label>Variety/Species:
                    <input type="text" name="varietySpecies" value={formData.varietySpecies} onChange={handleFormChange} placeholder="e.g., Alphonso Mango" required />
                  </label>
                </div>
                <div className="form-row">
                  <label>Harvest Quantity:
                    <input type="number" name="harvestQuantity" value={formData.harvestQuantity} onChange={handleFormChange} placeholder="e.g., 500" required min="1" />
                  </label>
                  <label>Unit of Sale:
                    <select name="unitOfSale" value={formData.unitOfSale} onChange={handleFormChange} required>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="quintal">Quintals (100 kg)</option>
                      <option value="ton">Tons (1000 kg)</option>
                      <option value="box">Box</option>
                      <option value="dozen">Dozen</option>
                    </select>
                  </label>
                </div>
                <div className="form-row">
                  <label>Target Price (₹):
                    <input type="number" name="targetPrice" value={formData.targetPrice} onChange={handleFormChange} placeholder="e.g., 50" required min="0" />
                  </label>
                </div>
                <div className="form-row">
                  <label>Product Image: {isEditing && "(Optional)"}
                    <input type="file" name="image" onChange={handleFileChange} accept="image/*" required={!isEditing} />
                  </label>
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Submitting...' : (isEditing ? '💾 Update Product' : '✨ List Product')}
                </button>
              </form>
            )}
            <div className="products-grid" id="productsGrid">
              {loading ? <p>Loading products...</p> : null}
              {!loading && crops.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🌱</div>
                  <h3>No Products Added Yet</h3>
                </div>
              )}
              {crops.map(crop => (
                <div key={crop._id} className="product-card">
                  <img src={crop.imageUrl} alt={crop.varietySpecies} className="product-card-image" />
                  <div className="product-card-content">
                    <h3>{crop.varietySpecies}</h3>
                    <span className="product-type">{crop.productType}</span>
                    <div className="product-details">
                      <div className="product-detail-item">
                        <div className="product-detail-label">Quantity</div>
                        <div className="product-detail-value">{crop.harvestQuantity} {crop.unitOfSale}</div>
                      </div>
                      <div className="product-detail-item price-highlight">
                        <div className="product-detail-label">Price</div>
                        <div className="product-detail-value">₹{crop.targetPrice} per {crop.unitOfSale}</div>
                      </div>
                    </div>
                    {/* ... Reviews ... */}
                    <div className="product-actions">
                      <button className="action-btn edit-btn" onClick={() => handleEditClick(crop)}>📝 Edit</button>
                      <button className="action-btn delete-btn" onClick={() => handleDeleteCrop(crop._id)}>🗑️ Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {activeSection === 'orders' && (
          <section id="ordersSection">
            <div className="section-header"><h2>📦 My Orders</h2></div>
            <div className="orders-grid" id="farmerOrdersGrid">
              {loading ? <p>Loading orders...</p> : null}
              {!loading && orders.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <h3>No Orders Yet</h3>
                </div>
              )}
              {orders.map(order => (
                <div key={order._id} className={`farmer-order-card status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className={`order-status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</span>
                  <div className="order-product-info">
                    <div className="order-product-name">{order.productDetails.varietySpecies}</div>
                  </div>
                  <div className="order-details-grid">
                    <div className="order-detail-item"><div className="order-detail-label">Quantity</div><div className="order-detail-value">{order.quantity} {order.productDetails.unitOfSale}</div></div>
                    <div className="order-detail-item"><div className="order-detail-label">Vehicle</div><div className="order-detail-value">{order.vehicleDetails.vehicleId}</div></div>
                    <div className="order-detail-item"><div className="order-detail-label">Total Amount</div><div className="order-detail-value">₹{order.totalAmount.toFixed(2)}</div></div>
                  </div>
                  <div className="dealer-info-panel">
                    <div className="dealer-info-title">🏢 Dealer Information</div>
                    <div className="dealer-contact-info">
                      <span><strong>Name:</strong> {order.dealerDetails.businessName || `${order.dealerDetails.firstName}`}</span>
                      <span><strong>Mobile:</strong> {order.dealerDetails.mobile}</span>
                    </div>
                  </div>
                  {order.status === 'Bid Placed' && order.bidStatus === 'Pending' && (
                    <div className="bid-panel">
                      <h4>💰 New Bid Received</h4>
                      <p><strong>Bid Price:</strong> ₹{order.bidPrice} per {order.productDetails.unitOfSale}</p>
                      <p><strong>Total Amount:</strong> ₹{order.totalAmount.toFixed(2)}</p>
                      <div className="bid-actions">
                        <button onClick={() => handleAcceptBid(order._id)} disabled={loading}>✓ Accept Bid</button>
                        <button onClick={() => handleRejectBid(order._id)} disabled={loading}>✗ Reject Bid</button>
                      </div>
                    </div>
                  )}
                  {order.status === 'Bid Accepted' && order.receiptNumber && (
                    <div style={{ background: '#d1fae5', border: '2px solid #10b981', borderRadius: '8px', padding: '15px', marginTop: '15px' }}>
                      <h4 style={{ marginTop: 0, color: '#059669' }}>✓ Bid Accepted</h4>
                      <p style={{ margin: '5px 0' }}><strong>Final Price:</strong> ₹{order.bidPrice} per {order.productDetails?.unitOfSale}</p>
                      <p style={{ margin: '5px 0' }}><strong>Total Amount:</strong> ₹{order.totalAmount?.toFixed(2)}</p>
                      <p style={{ margin: '5px 0' }}><strong>Receipt Number:</strong> {order.receiptNumber}</p>
                      <button 
                        onClick={() => {
                          setSelectedReceiptOrder(order);
                          setModal({...modal, farmerReceipt: true});
                        }} 
                        style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px' }}
                      >
                        📄 View Receipt
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
        
        {activeSection === 'notifications' && (
          <section id="notificationsSection">
            <div className="section-header"><h2>🔔 Notifications</h2></div>
            <div className="notifications-panel" id="notificationsList">
              {loading ? <p>Loading notifications...</p> : null}
              {!loading && notifications.length === 0 && (
                <div className="empty-state"><div className="empty-state-icon">🔔</div><h3>No New Notifications</h3></div>
              )}
              {notifications.map(n => (
                <div key={n.id || n._id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                  {/* ... notif card ... */}
                  <p className="notification-message">{n.message}</p>
                  <small className="notification-time">{new Date(n.timestamp).toLocaleString()}</small>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {activeSection === 'profile' && (
          <section id="profileSection">
            <div className="section-header"><h2>👤 My Profile</h2></div>
            <div className="profile-container">
              {loading ? <p>Loading profile...</p> : profile && (
                <div className="profile-card" id="profileInfo">
                  <p><b>Name:</b> {profile.firstName} {profile.lastName || ''}</p>
                  <p><b>Email:</b> {profile.email}</p>
                  <p><b>Mobile:</b> {profile.mobile}</p>
                  <p><b>Aadhaar:</b> {profile.aadhaar || 'N/A'}</p>
                  <p><b>Farm Location:</b> {profile.farmLocation || "N/A"}</p>
                  <p><b>Farm Size:</b> {profile.farmSize || "N/A"}</p>
                  <button id="editProfileBtnInCard" className="add-btn" style={{marginTop: '20px'}} onClick={() => setEditProfileData(profile)}>✏️ Edit Additional Details</button>
                </div>
              )}
              {editProfileData && (
                <form id="editProfileForm" className="profile-card edit-profile-form" onSubmit={handleProfileUpdate}>
                  <h3>Edit Additional Details</h3>
                  <label>Farm Location</label>
                  <input type="text" name="farmLocation" value={editProfileData.farmLocation} onChange={handleProfileEditChange} />
                  <label>Latitude</label>
                  <input type="text" name="latitude" value={editProfileData.latitude} readOnly />
                  <label>Longitude</label>
                  <input type="text" name="longitude" value={editProfileData.longitude} readOnly />
                  <button type="button" id="getGeoBtn" className="geo-btn" onClick={handleGetGeo}>📍 Get Current Location</button>
                  <label>Farm Size</label>
                  <input type="text" name="farmSize" value={editProfileData.farmSize} onChange={handleProfileEditChange} />
                  <div className="form-actions">
                    <button type="submit" id="saveProfileBtn" className="save-btn" disabled={loading}>💾 Save Changes</button>
                    <button type="button" id="cancelEditBtn" className="cancel-btn" onClick={() => setEditProfileData(null)}>✖ Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}
      </div>
      <FarmerReceiptModal 
            show={modal.farmerReceipt} 
            onClose={() => {
                setModal({ ...modal, farmerReceipt: false });
                setSelectedReceiptOrder(null);
            }} 
            order={selectedReceiptOrder} 
            user={user}
        />

    </>
  );
};

// Add this new modal component
const FarmerReceiptModal = ({ show, onClose, order, user }) => {
  if (!show || !order) return null;
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal" style={{display:'block', zIndex: 2000}} onClick={onClose}>
      <div className="modal-content" style={{maxWidth: '700px'}} onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        
        <div id="farmerReceiptContent">
          {/* Removed inline styles from the container and h2, relying on CSS for #farmerReceiptContent h2 */}
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <h2>AgroChain Sale Receipt</h2>
            <p style={{fontSize: '1.2em', margin: '10px 0'}}>Receipt No: <strong>{order.receiptNumber}</strong></p>
          </div>
          
          <div style={{border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginBottom: '20px', background: '#f9f9f9'}}>
            <h3 style={{marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '15px'}}>Transaction Summary</h3>
            
            {/* START: Replaced Table with Divs using #receiptDetails ID and .total-line class */}
            <div id="receiptDetails">
              <div>
                <span><strong>Product:</strong></span>
                <span>{order.productDetails?.varietySpecies || 'N/A'}</span>
              </div>
              <div>
                <span><strong>Quantity Sold:</strong></span>
                <span>{order.quantity} {order.productDetails?.unitOfSale}</span>
              </div>
              <div>
                <span><strong>Price per Unit:</strong></span>
                <span>₹{order.bidPrice || order.originalPrice}</span>
              </div>
              <div className="total-line">
                <span><strong>TOTAL AMOUNT:</strong></span>
                <span>₹{order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
            {/* END: Replaced Table with Divs */}

            {/* Dealer and Farmer details (kept inside Transaction Summary, cleaned up some inline borders) */}
            <div style={{display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', borderTop: '1px solid #e0e0e0', paddingTop: '15px', marginTop: '20px'}}>
              <div style={{flex: 1, minWidth: '250px', padding: '10px', background: '#fff', borderRadius: '6px'}}>
                <h4 style={{marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', color: '#3b82f6'}}>Sold To (Dealer)</h4>
                <p><strong>Name:</strong> {order.dealerDetails?.businessName || `${order.dealerDetails?.firstName} ${order.dealerDetails?.lastName}`}</p>
                <p><strong>Email:</strong> {order.dealerDetails?.email}</p>
                <p><strong>Mobile:</strong> {order.dealerDetails?.mobile}</p>
              </div>
              <div style={{flex: 1, minWidth: '250px', padding: '10px', background: '#fff', borderRadius: '6px'}}>
                <h4 style={{marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px', color: '#3b82f6'}}>Seller (Farmer)</h4>
                <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Mobile:</strong> {user?.mobile}</p>
              </div>
            </div>
          </div>

          
          <div style={{textAlign: 'center', marginTop: '30px', fontSize: '0.9em', color: '#6b7280', paddingTop: '15px', borderTop: '1px solid #e0e0e0'}}>
            <p>This transaction was securely recorded on {order.assignedDate ? new Date(order.assignedDate).toLocaleDateString() : new Date().toLocaleDateString()}.</p>
          </div>
        </div>
        
        <div style={{textAlign: 'center', marginTop: '20px'}}>
          {/* Removed inline style, relying on CSS for .btn-primary */}
          <button className="btn-primary" onClick={handlePrint}>
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;