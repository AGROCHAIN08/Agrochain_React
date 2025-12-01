import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../assets/css/retailer.css';
import { useDispatch, useSelector } from 'react-redux';
import { initializeCart, addToCart, removeFromCart, clearCart } from '../redux/slices/cartSlice';

// --- RetailerNavbar Component ---
const RetailerNavbar = ({ user, cartCount, onSignout, onNavigate, activeSection }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownOpen && !event.target.closest('.profile-dropdown')) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [dropdownOpen]);

    const handleNav = (section) => {
        onNavigate(section);
        setDropdownOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" alt="AgroChain Logo" className="logo" />
                <span className="brand-name">Agro<span className="chain-text">Chain</span></span>
            </div>
            <div className="nav-center">
                <a href="#" className={`nav-link ${activeSection === 'browse' ? 'active' : ''}`} onClick={() => handleNav('browse')}>
                    <span className="nav-icon">🛍️</span> Browse Products
                </a>
                <a href="#" className={`nav-link ${activeSection === 'orders' ? 'active' : ''}`} onClick={() => handleNav('orders')}>
                    <span className="nav-icon">📦</span> My Orders
                </a>
            </div>
            <div className="nav-right">
                <a href="#" className={`nav-link ${activeSection === 'cart' ? 'active' : ''}`} onClick={() => handleNav('cart')}>
                    <span className="nav-icon">🛒</span> Cart
                    <span id="cartCount" className="cart-count" style={{ display: cartCount > 0 ? 'inline-block' : 'none' }}>{cartCount}</span>
                </a>
                <div className="profile-dropdown">
                    <button className="profile-btn" id="profileDropdownBtn" onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
                        <span className="profile-icon">👤</span>
                        <span id="retailerNameDisplay">{user.firstName}</span>
                        <span className="dropdown-arrow">▼</span>
                    </button>
                    <div className={`profile-dropdown-menu ${dropdownOpen ? 'show' : ''}`} id="profileDropdownMenu">
                        <a href="#" className="dropdown-item" id="profileBtn" onClick={() => handleNav('profile')}>
                            <span className="dropdown-icon">👤</span> My Profile
                        </a>
                        <div className="dropdown-divider"></div>
                        <a href="#" className="dropdown-item logout-item" id="signoutBtn" onClick={onSignout}>
                            <span className="dropdown-icon">🚪</span> Sign Out
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
};

// --- RetailerDashboard Page Component ---
const RetailerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Navigation State
    const [activeSection, setActiveSection] = useState('browse');

    // Data State
    const [allInventory, setAllInventory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cart State
    const dispatch = useDispatch();
    const { items: cart, totalItems, totalAmount } = useSelector((state) => state.cart);

    // Filter State
    const [filters, setFilters] = useState({ filterType: '', filterName: '', filterPrice: '' });
    const [productQuantities, setProductQuantities] = useState({});

    // Modal State
    const [modal, setModal] = useState({
        payment: false,
        receipt: false,
        review: false,
        viewReviews: false,
        editProfile: false // <--- Added editProfile state
    });
    const [selectedOrder, setSelectedOrder] = useState(null); 
    const [selectedProduct, setSelectedProduct] = useState(null); 
    const [paymentStep, setPaymentStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('UPI');

    // --- Core Data Fetching ---
    const loadAllData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [invRes, ordRes, profRes] = await Promise.all([
                api.get('/retailer/dealer-inventory'),
                api.get(`/retailer/orders/${user.email}`),
                api.get(`/auth/profile/${user.email}`)
            ]);
            setAllInventory(invRes.data);
            setOrders(ordRes.data);
            setProfile(profRes.data);
        } catch (err) {
            setError(err.message || "Failed to load all data");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadAllData();
    }, [user, loadAllData]);

    useEffect(() => {
        dispatch(initializeCart('retailer'));
    }, [dispatch]);

    // --- Handlers ---
    const handleSignout = () => {
        if (window.confirm("Are you sure you want to sign out?")) {
            logout();
            localStorage.removeItem('retailerCart');
            navigate('/login');
        }
    };

    const handleNavigate = (section) => {
        setActiveSection(section);
        window.scrollTo(0, 0);
    };

    const handleFilterChange = (e) => {
        const { id, value } = e.target;
        setFilters(prev => ({ ...prev, [id]: value }));
    };

    const getFilteredInventory = () => {
        return allInventory.filter(item => {
            const { filterType, filterName, filterPrice } = filters;
            const nameMatch = !filterName || item.productName.toLowerCase().includes(filterName.toLowerCase());
            const priceMatch = !filterPrice || isNaN(parseFloat(filterPrice)) || item.unitPrice <= parseFloat(filterPrice);
            const typeMatch = !filterType || item.productType === filterType;
            return nameMatch && priceMatch && typeMatch;
        });
    };

    // --- Cart Logic ---
    const handleQtyChange = (itemId, value) => {
        const item = allInventory.find(i => i._id === itemId);
        if (!item) return;

        let qty = parseFloat(value);
        if (isNaN(qty)) qty = '';
        else if (qty < 0) qty = 0;
        else if (qty > item.quantity) {
            qty = item.quantity;
            alert(`Only ${item.quantity} available.`);
        }
        setProductQuantities(prev => ({ ...prev, [itemId]: qty }));
    };

    const handleAddToCart = (item) => {
        const qty = productQuantities[item._id] || 0;

        // Validation
        if (!qty || qty <= 0) {
            alert('Please enter a valid quantity.');
            return;
        }
        if (qty > item.quantity) {
            alert(`Only ${item.quantity} available.`);
            return;
        }

        // Dispatch to Redux
        dispatch(
            addToCart({
                item: { ...item, quantity: qty },
                userRole: "retailer"
            })
        );

        alert("Added to cart!");

        // Clear input field after adding
        setProductQuantities(prev => ({ 
            ...prev, 
            [item._id]: '' 
        }));
    };


    const handleRemoveFromCart = (itemId) => {
        dispatch(removeFromCart({ itemId, userRole: 'retailer' }));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return alert('Your cart is empty!');
        if (!window.confirm('Are you sure you want to place this order?')) return;
        
        setLoading(true);
        try {
            await api.post('/retailer/place-order', {
                retailerEmail: user.email,
                cartItems: cart
            });
            alert('✅ Order placed successfully! Please go to "My Orders" to pay.');
            
            // 👇 CHANGED: Use Redux action instead of setCart
            dispatch(clearCart('retailer'));
            
            setActiveSection('orders');
            loadAllData();
        } catch (err) {
            alert(`❌ Error: ${err.response?.data?.msg || 'Checkout failed'}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Profile Update Logic ---
    const handleProfileUpdate = async (updatedData) => {
        setLoading(true);
        try {
            const res = await api.put(`/retailer/profile/${user.email}`, updatedData);
            setProfile(res.data);
            setModal(prev => ({ ...prev, editProfile: false }));
            alert("✅ Profile updated successfully!");
        } catch (err) {
            console.error(err);
            alert(`❌ Error: ${err.response?.data?.msg || 'Profile update failed'}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Modal Logic ---
    const openModal = (modalName, data) => {
        if (modalName === 'payment') {
            setSelectedOrder(JSON.parse(JSON.stringify(data)));
            setPaymentStep(1);
        } else if (modalName === 'receipt' || modalName === 'review') {
            setSelectedOrder(data);
        } else if (modalName === 'viewReviews') {
            setSelectedProduct(data);
        }
        setModal(prev => ({ ...prev, [modalName]: true }));
    };

    const closeModal = (modalName) => {
        setModal(prev => ({ ...prev, [modalName]: false }));
        setSelectedOrder(null);
        setSelectedProduct(null);
    };

    // Payment & Review Handlers...
    const handlePaymentQtyChange = (productId, newQuantity) => {
        const qty = parseInt(newQuantity);
        if (isNaN(qty) || qty < 1) {
            alert("Quantity must be at least 1.");
            return;
        }
        
        const inventoryItem = allInventory.find(item => item._id === productId);
        const maxQty = inventoryItem ? inventoryItem.quantity : 100; // Fallback

        if(qty > maxQty) {
            alert(`Only ${maxQty} units available.`);
            return;
        }

        const updatedOrder = { ...selectedOrder };
        const product = updatedOrder.products.find(p => p.productId === productId);
        if (product) {
            product.quantity = qty;
        }
        updatedOrder.totalAmount = updatedOrder.products.reduce((total, p) => total + (p.quantity * p.unitPrice), 0);
        setSelectedOrder(updatedOrder);
    };

    const handleConfirmPayment = async () => {
        setLoading(true);
        try {
            await api.post(`/retailer/orders/${selectedOrder._id}/complete-payment`, {
                products: selectedOrder.products,
                totalAmount: selectedOrder.totalAmount,
                paymentMethod: paymentMethod
            });
            alert('✅ Payment successful!');
            closeModal('payment');
            loadAllData();
        } catch (err) {
            alert(`❌ Error: ${err.response?.data?.msg || 'Payment failed'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (reviewData) => {
        setLoading(true);
        try {
            await api.post('/retailer/submit-review', {
                orderId: selectedOrder._id,
                retailerEmail: user.email,
                ...reviewData
            });
            alert('✅ Review submitted successfully!');
            closeModal('review');
            loadAllData();
        } catch (err) {
            alert(`❌ Error: ${err.response?.data?.msg || 'Review submission failed'}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Render ---
    if (loading && !profile) {
        return <div style={{ textAlign: 'center', paddingTop: '100px', fontSize: '1.2em' }}>Loading Dashboard...</div>;
    }

    if (!user || !profile) {
        return <div>Error loading user profile. Please try logging in again.</div>;
    }

    const cartCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
    const filteredInventory = getFilteredInventory();

    return (
        <>
            <RetailerNavbar 
                user={profile} 
                cartCount={totalItems}
                onSignout={handleSignout} 
                onNavigate={handleNavigate} 
                activeSection={activeSection}
            />
            
            <div className="content">
                {error && <p style={{color: 'red'}}>{error}</p>}

                {/* --- Browse Section --- */}
                <section id="browseSection" className={activeSection === 'browse' ? 'section active' : 'section'}>
                    <div className="browse-layout-container">
                        <FilterPanel filters={filters} onChange={handleFilterChange} />
                        <main className="product-listing">
                            <div className="section-header">
                                <h1 className="section-title">Browse Dealer Products</h1>
                            </div>
                            <div id="inventoryGrid" className="inventory-grid">
                                {loading && activeSection === 'browse' ? <p>Loading...</p> : filteredInventory.length === 0 ? <div className="empty-state"><h3>No Products Found</h3></div> :
                                    filteredInventory.map(item => (
                                        <InventoryCard
                                            key={item._id}
                                            item={item}
                                            qty={productQuantities[item._id] || ''}
                                            onQtyChange={handleQtyChange}
                                            onAddToCart={handleAddToCart}
                                            onViewReviews={openModal}
                                        />
                                    ))
                                }
                            </div>
                        </main>
                    </div>
                </section>
                
                {/* --- Cart Section --- */}
                <section id="cartSection" className={activeSection === 'cart' ? 'section active' : 'section'}>
                    <div className="section-header"><h1 className="section-title">My Shopping Cart</h1></div>
                    <div id="cartGrid">
                        {cart.length === 0 ? <div className="empty-state"><h3>Your cart is empty.</h3></div> :
                            cart.map(item => (
                                <CartItem key={item._id} item={item} onRemove={handleRemoveFromCart} />
                            ))
                        }
                        {cart.length > 0 && <CartSummary cart={cart} onCheckout={handleCheckout} loading={loading} />}
                    </div>
                </section>

                {/* --- Orders Section --- */}
                <section id="ordersSection" className={activeSection === 'orders' ? 'section active' : 'section'}>
                    <div className="section-header"><h1 className="section-title">My Orders</h1></div>
                    <div id="ordersGrid" className="inventory-grid">
                        {orders.length === 0 ? <div className="empty-state"><h3>You have no orders.</h3></div> :
                            orders.map(order => (
                                <OrderCard 
                                    key={order._id} 
                                    order={order} 
                                    onPay={openModal} 
                                    onReview={openModal} 
                                    onReceipt={openModal} 
                                />
                            ))
                        }
                    </div>
                </section>

                {/* --- NEW PROFESSIONAL PROFILE SECTION --- */}
                <section id="profileSection" className={activeSection === 'profile' ? 'section active' : 'section'}>
                    <div className="profile-container">
                        <div className="profile-header-card">
                            <div className="profile-cover"></div>
                            <div className="profile-avatar-large">
                                {profile.firstName?.charAt(0)}
                            </div>
                            <div className="profile-main-info">
                                <div>
                                    <h1>{profile.firstName} {profile.lastName}</h1>
                                    <span className="role-badge">Retailer</span>
                                </div>
                                <button className="btn-edit-profile" onClick={() => openModal('editProfile')}>
                                    ✏️ Edit Profile
                                </button>
                            </div>
                        </div>
                        
                        <div className="profile-details-grid">
                            <div className="detail-group">
                                <h3>🏪 Shop Information</h3>
                                <div className="detail-row"><label>Shop Name</label><span>{profile.shopName || 'N/A'}</span></div>
                                <div className="detail-row"><label>Shop Address</label><span>{profile.shopAddress || 'N/A'}</span></div>
                                <div className="detail-row"><label>Shop Type</label><span>{profile.shopType || 'General'}</span></div>
                            </div>
                            <div className="detail-group">
                                <h3>📞 Contact Details</h3>
                                <div className="detail-row"><label>Email</label><span>{profile.email}</span></div>
                                <div className="detail-row"><label>Mobile</label><span>{profile.mobile}</span></div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            
            {/* --- Modals --- */}
            <PaymentModal
                show={modal.payment}
                onClose={() => closeModal('payment')}
                order={selectedOrder}
                step={paymentStep}
                setStep={setPaymentStep}
                onQtyChange={handlePaymentQtyChange}
                onConfirm={handleConfirmPayment}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                loading={loading}
            />
            <ReceiptModal
                show={modal.receipt}
                onClose={() => closeModal('receipt')}
                order={selectedOrder}
                user={profile}
            />
            <ReviewModal
                show={modal.review}
                onClose={() => closeModal('review')}
                order={selectedOrder}
                onSubmit={handleSubmitReview}
                loading={loading}
            />
            <ViewReviewsModal
                show={modal.viewReviews}
                onClose={() => closeModal('viewReviews')}
                product={selectedProduct}
                allInventory={allInventory}
            />

            {/* --- New Edit Profile Modal --- */}
            <EditProfileModal
                show={modal.editProfile}
                onClose={() => closeModal('editProfile')}
                profileData={profile}
                onSave={handleProfileUpdate}
            />
        </>
    );
};

// --- Helper Components ---

// New Edit Profile Modal Component
// New Edit Profile Modal Component
const EditProfileModal = ({ show, onClose, profileData, onSave }) => {
    const [formData, setFormData] = useState({});
    
    useEffect(() => {
        if (show && profileData) { // <--- Fixed (removed "QL")
            setFormData({
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                mobile: profileData.mobile || '',
                shopName: profileData.shopName || '',
                shopAddress: profileData.shopAddress || '',
                shopType: profileData.shopType || ''
            });
        }
    }, [show, profileData]);

    if (!show) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.firstName || !formData.mobile) {
            alert("First Name and Mobile are required.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="modal" style={{display:'block', zIndex: 4000}} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '600px'}}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3 style={{textAlign:'center', color:'#1f2937', marginBottom:'20px'}}>✏️ Edit Profile</h3>
                <form className="profile-edit-form" onSubmit={handleSubmit}>
                    
                    <div className="form-section">
                        <h4>Personal Details</h4>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name *</label>
                                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
                            </div>
                            <div className="form-group full-width">
                                <label htmlFor="mobile">Mobile *</label>
                                <input type="text" id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h4>Shop Information</h4>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label htmlFor="shopName">Shop Name</label>
                                <input type="text" id="shopName" name="shopName" value={formData.shopName} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="shopType">Shop Type</label>
                                <select id="shopType" name="shopType" value={formData.shopType} onChange={handleChange}>
                                    <option value="">Select...</option>
                                    <option value="General">General</option>
                                    <option value="Grocery">Grocery</option>
                                    <option value="Supermarket">Supermarket</option>
                                    <option value="Wholesale">Wholesale</option>
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label htmlFor="shopAddress">Shop Address</label>
                                <textarea id="shopAddress" name="shopAddress" value={formData.shopAddress} onChange={handleChange} rows="3"></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ... [Keep existing sub-components: FilterPanel, InventoryCard, CartItem, CartSummary, OrderCard, PaymentModal, ReceiptModal, ReviewModal, ViewReviewsModal] ...

const FilterPanel = ({ filters, onChange }) => (
    <aside className="filter-panel">
        <h3 className="filter-title">🔍 Filter Products</h3>
        <div className="form-group">
            <label>Product Type</label>
            <select id="filterType" value={filters.filterType} onChange={onChange}>
                <option value="">All Types</option>
                <option value="Fruit">Fruit</option>
                <option value="Vegetable">Vegetable</option>
                <option value="Cereal">Cereal</option>
                <option value="Spices">Spices</option>
                <option value="Pulses">Pulses</option>
                <option value="Oil Seeds">Oil Seeds</option>
            </select>
        </div>
        <div className="form-group">
            <label>Variety</label>
            <input type="text" id="filterName" value={filters.filterName} onChange={onChange} placeholder="e.g., Alphonso Mango" />
        </div>
        <div className="form-group">
            <label>Max Price (₹)</label>
            <input type="number" id="filterPrice" value={filters.filterPrice} onChange={onChange} placeholder="Enter max price" />
        </div>
    </aside>
);

const InventoryCard = ({ item, qty, onQtyChange, onAddToCart, onViewReviews }) => {
    const unitOfSale = item.unitOfSale || 'unit';
    return (
        <div className="inventory-card">
            <img src={item.imageUrl} alt={item.productName} className="inventory-image" />
            <div className="inventory-content">
                <h3>{item.productName}</h3>
                <p className="inventory-type">{item.productType}</p>
                <div className="inventory-details">
                    <div className="detail-row"><span className="detail-label">Available:</span><span className="detail-value">{item.quantity} {unitOfSale}</span></div>
                    <div className="detail-row"><span className="detail-label">Price per {unitOfSale}:</span><span className="detail-value" style={{ fontWeight: 'bold', color: '#228B22' }}>₹{item.unitPrice.toFixed(2)}</span></div>
                </div>
                {item.retailerReviews && item.retailerReviews.length > 0 && (
                    <div className="product-reviews" style={{ marginTop: '15px', padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#374151' }}>
                            ⭐ Reviews ({item.retailerReviews.length})
                        </h4>
                        <button className="btn-secondary" style={{width: '100%'}} onClick={() => onViewReviews('viewReviews', item)}>
                            View All {item.retailerReviews.length} Reviews →
                        </button>
                    </div>
                )}
                <div className="dealer-info">Sold by: {item.dealerName} | ☎️ {item.dealerMobile}</div>
                <div className="add-to-cart-section">
                    <input type="number" id={`qty-${item._id}`} placeholder="Qty" min="1" max={item.quantity} value={qty} onChange={(e) => onQtyChange(item._id, e.target.value)} />
                    <button className="btn-primary btn-add-cart" onClick={() => onAddToCart(item)}>Add to Cart</button>
                </div>
            </div>
        </div>
    );
};

const CartItem = ({ item, onRemove }) => {
    const itemTotal = item.unitPrice * item.quantity;
    return (
        <div className="cart-item">
            <img src={item.imageUrl} alt={item.productName} className="cart-item-img" />
            <div className="cart-item-info">
                <h4>{item.productName}</h4>
                <p>Quantity: {item.quantity} x ₹{item.unitPrice.toFixed(2)}</p>
                <p>Sold by: {item.dealerName}</p>
            </div>
            <div className="cart-item-actions">
                <div className="price">₹{itemTotal.toFixed(2)}</div>
                <button className="btn-remove" onClick={() => onRemove(item._id)}>Remove</button>
            </div>
        </div>
    );
};

const CartSummary = ({ cart, onCheckout, loading }) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    return (
        <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="total-row"><span>Total</span><span>₹{subtotal.toFixed(2)}</span></div>
            <button className="btn-primary btn-checkout" onClick={onCheckout} disabled={loading}>
                {loading ? 'Processing...' : 'Proceed to Checkout'}
            </button>
        </div>
    );
};

const OrderCard = ({ order, onPay, onReview, onReceipt }) => {
    const orderDate = new Date(order.createdAt).toLocaleDateString();
    const totalQuantity = order.products.reduce((sum, p) => sum + p.quantity, 0);
    const productNames = order.products.map(p => p.productName).join(', ');
    const statusClass = order.orderStatus.toLowerCase();

    return (
        <div className="retailer-order-card">
            <span className={`order-status-badge status-${statusClass}`}>{order.orderStatus}</span>
            <div className="order-product-info">
                <h3>{productNames}</h3>
                <p>{order.products.length} item(s) in this order</p>
            </div>
            <div className="order-details-grid">
                <div className="order-detail-item"><div className="order-detail-label">Total Quantity</div><div className="order-detail-value">{totalQuantity} units</div></div>
                <div className="order-detail-item"><div className="order-detail-label">Dealer</div><div className="order-detail-value">{order.dealerInfo.businessName}</div></div>
                <div className="order-detail-item"><div className="order-detail-label">Total Amount</div><div className="order-detail-value">₹{order.totalAmount.toFixed(2)}</div></div>
                <div className="order-detail-item"><div className="order-detail-label">Order Date</div><div className="order-detail-value">{orderDate}</div></div>
            </div>
            <div className="dealer-info-panel">
                <span><strong>Contact:</strong> {order.dealerInfo.email}</span>
            </div>
            {order.paymentDetails.status === 'Completed' ? (
                <div className="order-action-panel completed">
                    <h4>✓ Payment Completed</h4>
                    <p><strong>Payment Method:</strong> {order.paymentDetails.method}</p>
                    <p><strong>Total Paid:</strong> ₹{order.totalAmount.toFixed(2)}</p>
                    {!order.reviewSubmitted ? (
                        <button className="btn-primary" onClick={() => onReview('review', order)} style={{ background: '#10b981', marginRight: '10px' }}>⭐ Add Review</button>
                    ) : (
                        <p style={{ color: '#065f46', fontWeight: 'bold', marginTop: '10px' }}>✓ Review Submitted</p>
                    )}
                    <button className="btn-secondary" onClick={() => onReceipt('receipt', order)} style={{ marginTop: '15px' }}>View Receipt</button>
                </div>
            ) : (
                <div className="order-action-panel pending">
                    <h4>⌛ Payment Pending</h4>
                    <p>Your order is confirmed. Please complete the payment to proceed.</p>
                    <button className="btn-primary" onClick={() => onPay('payment', order)}>Pay Now</button>
                </div>
            )}
        </div>
    );
};

const PaymentModal = ({ show, onClose, order, step, setStep, onQtyChange, onConfirm, paymentMethod, setPaymentMethod, loading }) => {
    if (!show) return null;
    return (
        <div id="paymentModal" className="modal" style={{ display: 'block' }} onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                
                {step === 1 && (
                    <div id="paymentStep1" className="payment-step">
                        <h3>Step 1: Review Your Order</h3>
                        <div id="payment-order-summary">
                            <div className="dealer-info" style={{ backgroundColor: '#f3e5f5', border: '1px solid #e1bee7', padding: '10px', borderRadius: '6px' }}>
                                <p><strong>Order From:</strong> {order.dealerInfo.businessName}</p>
                                <p><strong>Dealer Address:</strong> {order.dealerInfo.warehouseAddress}</p>
                            </div>
                            <h4 style={{marginTop: '15px'}}>Products (edit quantity if needed)</h4>
                            <div id="payment-order-items">
                                {order.products.map(p => (
                                    <div className="payment-order-item" key={p.productId}>
                                        <span>{p.productName} (₹{p.unitPrice.toFixed(2)} each)</span>
                                        <div>
                                            <input type="number" value={p.quantity} min="1" onChange={(e) => onQtyChange(p.productId, e.target.value)} />
                                        </div>
                                        <strong>₹{(p.quantity * p.unitPrice).toFixed(2)}</strong>
                                    </div>
                                ))}
                            </div>
                            <div className="total-row" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Total:</h3>
                                <h3 id="payment-total">₹{order.totalAmount.toFixed(2)}</h3>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button className="btn-primary" onClick={() => setStep(2)}>Next: Select Payment</button>
                        </div>
                    </div>
                )}
                
                {step === 2 && (
                    <div id="paymentStep2" className="payment-step">
                        <h3>Step 2: Select Payment Method</h3>
                        <div className="payment-options">
                            <label><input type="radio" name="paymentMethod" value="UPI" checked={paymentMethod === 'UPI'} onChange={(e) => setPaymentMethod(e.target.value)} /> UPI / QR Code</label>
                            <label><input type="radio" name="paymentMethod" value="Credit/Debit Card" checked={paymentMethod === 'Credit/Debit Card'} onChange={(e) => setPaymentMethod(e.target.value)} /> Credit/Debit Card</label>
                            <label><input type="radio" name="paymentMethod" value="Net Banking" checked={paymentMethod === 'Net Banking'} onChange={(e) => setPaymentMethod(e.target.value)} /> Net Banking</label>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setStep(1)}>Back to Review</button>
                            <button className="btn-primary" onClick={onConfirm} disabled={loading}>{loading ? "Processing..." : "Confirm & Proceed"}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ReceiptModal = ({ show, onClose, order, user }) => {
    if (!show) return null;
    return (
        <div id="receiptModal" className="modal" style={{ display: 'block' }} onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <div id="receiptContent">
                    <div style={{textAlign: 'center', borderBottom: '1px solid #ccc', marginBottom: '20px'}}>
                        <h2>Payment Receipt</h2>
                        <p>Order ID: {order._id}</p>
                    </div>
                    <p><strong>Billed To:</strong> {user.shopName || user.firstName}</p>
                    <p><strong>Date:</strong> {new Date(order.updatedAt).toLocaleDateString()}</p>
                    <hr />
                    <h4>Order from: {order.dealerInfo.businessName}</h4>
                    <p><strong>Dealer Address:</strong> {order.dealerInfo.warehouseAddress}</p>
                    <div className="inventory-details">
                        {order.products.map(p => (
                            <div key={p.productId} className="detail-row">
                                <span>{p.productName} (x{p.quantity})</span>
                                <span>₹{(p.quantity * p.unitPrice).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="total-row" style={{marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'space-between'}}>
                        <h4>Total Paid:</h4>
                        <h4>₹{order.totalAmount.toFixed(2)}</h4>
                    </div>
                    <p><strong>Payment Method:</strong> {order.paymentDetails.method}</p>
                    <p style={{color: 'green', fontWeight: 'bold'}}>Status: PAID</p>
                </div>
                <div className="modal-actions" style={{justifyContent: 'center'}}>
                    <button className="btn-primary" onClick={() => window.print()}>Print Receipt</button>
                </div>
            </div>
        </div>
    );
};

const ReviewModal = ({ show, onClose, order, onSubmit, loading }) => {
    const [quality, setQuality] = useState('');
    const [comments, setComments] = useState('');
    const [rating, setRating] = useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!quality || !comments || rating === 0) {
            alert('Please fill all fields and provide a star rating.');
            return;
        }
        onSubmit({ quality, comments, rating });
    };

    const handleStarClick = (value) => {
        setRating(value);
    };
    
    // Reset form when modal opens
    useEffect(() => {
        if (show) {
            setQuality('');
            setComments('');
            setRating(0);
        }
    }, [show]);

    if (!show) return null;
    return (
        <div id="reviewModal" className="modal" style={{ display: 'block' }} onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3 id="reviewModalTitle">Submit Review for order from {order.dealerInfo.businessName}</h3>
                
                <form id="reviewForm" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="reviewQuality">Product Quality *</label>
                        <select id="reviewQuality" value={quality} onChange={(e) => setQuality(e.target.value)} required>
                            <option value="">-- Select Quality --</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="reviewComments">Comments *</label>
                        <textarea id="reviewComments" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Describe product quality, delivery..." required rows="4"></textarea>
                    </div>
                    
                    <div className="form-group">
                        <label>Your Rating *</label>
                        <div className="star-rating" id="reviewRatingContainer">
                            {[5, 4, 3, 2, 1].map(value => (
                                <span 
                                    key={value}
                                    className={`star ${rating >= value ? 'selected' : ''}`} 
                                    data-value={value}
                                    onClick={() => handleStarClick(value)}
                                    style={{cursor: 'pointer', fontSize: '2.5em', color: rating >= value ? '#f59e0b' : '#ddd'}}
                                >
                                    &#9733;
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    <button type="submit" className="btn-primary" disabled={loading} style={{width: '100%', marginTop: '10px'}}>
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ViewReviewsModal = ({ show, onClose, product, allInventory }) => {
    if (!show) return null;

    const fullProduct = allInventory.find(p => p._id === product._id);
    const reviews = fullProduct?.retailerReviews || [];

    return (
        <div id="viewReviewsModal" className="modal" style={{ display: 'block', zIndex: 3000 }} onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3 style={{textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
                    Reviews for {fullProduct?.productName}
                </h3>
                <div style={{maxHeight: '400px', overflowY: 'auto', paddingTop: '15px'}}>
                    {reviews.length === 0 ? <p>No reviews yet.</p> : reviews.map((review, index) => (
                         <div key={index} style={{marginBottom: '15px', padding: '12px', background: '#f9fafb', borderRadius: '6px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                                <span style={{fontWeight: '600', color: '#10b981', fontSize: '14px'}}>{review.quality}</span>
                                <span style={{color: '#f59e0b', fontSize: '14px'}}>{'⭐'.repeat(review.rating)}</span>
                            </div>
                            <p style={{margin: '8px 0', fontSize: '13px', color: '#374151'}}>{review.comments}</p>
                            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '8px'}}>
                                <span><strong>By:</strong> {review.retailerEmail}</span>
                                <span>{new Date(review.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default RetailerDashboard;