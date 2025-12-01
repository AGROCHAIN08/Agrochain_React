import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../assets/css/dealer.css';

// --- DealerNavbar Component ---
const DealerNavbar = ({ user, cartCount, onSignout, onNavigate, activeSection }) => {
    const [profileOpen, setProfileOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleNav = (section) => {
        onNavigate(section);
        setMobileMenuOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileOpen && !event.target.closest('.profile-dropdown')) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [profileOpen]);

    return (
        <>
            <nav className="navbar">
                <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    ☰
                </button>
                <div className="nav-left">
                    <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" alt="AgroChain Logo" className="logo" />
                    <span className="brand-name">Agro<span className="chain-text">Chain</span></span>
                </div>
                <div className="navbar-center">
                    <button onClick={() => handleNav('browse')} className={activeSection === 'browse' ? 'active' : ''}>
                        🌾 Products
                    </button>
                    <button onClick={() => handleNav('vehicles')} className={activeSection === 'vehicles' ? 'active' : ''}>
                        🚗 Vehicles
                    </button>
                    <button onClick={() => handleNav('orders')} className={activeSection === 'orders' ? 'active' : ''}>
                        📦 Orders
                    </button>
                    <button onClick={() => handleNav('inventory')} className={activeSection === 'inventory' ? 'active' : ''}>
                        📦 Inventory
                    </button>
                    <button onClick={() => handleNav('retailerOrders')} className={activeSection === 'retailerOrders' ? 'active' : ''}>
                        🛍️ Retailer Orders
                    </button>
                </div>
                <div className="navbar-right">
                    <button className="cart-btn" onClick={() => handleNav('cart')}>
                        🛒 <span className="cart-badge" style={{ display: cartCount > 0 ? 'flex' : 'none' }}>{cartCount}</span>
                    </button>
                    <div className="profile-dropdown">
                        <button className="profile-btn" onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}>
                            <div className="profile-avatar-small">{user.firstName?.charAt(0)}</div>
                            <span className="profile-name-text">{user.businessName || user.firstName}</span>
                            <span className="dropdown-arrow">▼</span>
                        </button>
                        <div className={`profile-menu ${profileOpen ? 'show' : ''}`}>
                            <button onClick={() => handleNav('profile')}>👤 My Profile</button>
                            <div className="dropdown-divider"></div>
                            <button className="logout-item" onClick={onSignout}>🚪 Sign Out</button>
                        </div>
                    </div>
                </div>
            </nav>
            
            {/* Mobile Menu Overlay */}
            <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
            
            {/* Mobile Menu Sidebar */}
            <div className={`mobile-nav-menu ${mobileMenuOpen ? 'show' : ''}`}>
                <div className="mobile-menu-header">
                    <h3>Menu</h3>
                    <button className="close-menu-btn" onClick={() => setMobileMenuOpen(false)}>&times;</button>
                </div>
                <button onClick={() => handleNav('browse')} className={activeSection === 'browse' ? 'active' : ''}>
                    🌾 Browse Products
                </button>
                <button onClick={() => handleNav('vehicles')} className={activeSection === 'vehicles' ? 'active' : ''}>
                    🚗 Vehicles
                </button>
                <button onClick={() => handleNav('orders')} className={activeSection === 'orders' ? 'active' : ''}>
                    📦 My Orders
                </button>
                <button onClick={() => handleNav('inventory')} className={activeSection === 'inventory' ? 'active' : ''}>
                    📦 My Inventory
                </button>
                <button onClick={() => handleNav('retailerOrders')} className={activeSection === 'retailerOrders' ? 'active' : ''}>
                    🛍️ Retailer Orders
                </button>
                <button onClick={() => handleNav('cart')} className={activeSection === 'cart' ? 'active' : ''}>
                    🛒 My Cart ({cartCount})
                </button>
                <button onClick={() => handleNav('profile')} className={activeSection === 'profile' ? 'active' : ''}>
                    👤 My Profile
                </button>
                <button className="logout-item" onClick={onSignout}>
                    🚪 Sign Out
                </button>
            </div>
        </>
    );
};

// --- DealerDashboard Page Component ---
const DealerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // Navigation & State
    const [activeSection, setActiveSection] = useState('browse');
    const [showSidebar, setShowSidebar] = useState(true);
    
    // Data State
    const [allProducts, setAllProducts] = useState([]);
    const [allVehicles, setAllVehicles] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [retailerOrders, setRetailerOrders] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ vehicle: '', product: '', inventory: '' });

    // Cart & Orders (LocalStorage)
    const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("dealerCart")) || []);
    const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem("dealerOrders")) || []);

    // Filters & Modals
    const [filters, setFilters] = useState({ filterProductType: '', filterVariety: '', filterPrice: '' });
    const [productQuantities, setProductQuantities] = useState({});
    const [modal, setModal] = useState({ farmer: false, assignVehicle: false, review: false, bid: false, receipt: false, viewReviews: false });
    const [selectedData, setSelectedData] = useState(null);
    
    // Forms
    const [vehicleFormData, setVehicleFormData] = useState({ vehicleId: '', vehicleType: '', temperatureCapacity: '' });
    const [reviewData, setReviewData] = useState({ quality: '', comments: '', rating: 1 });
    const [bidPrice, setBidPrice] = useState(0);

    // --- Core Data Fetching ---
    const loadAllData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [prodRes, vehRes, profRes, retOrdRes] = await Promise.all([
                api.get('/dealer/all-products'),
                api.get(`/dealer/vehicles/${user.email}`),
                api.get(`/dealer/profile/${user.email}`),
                api.get(`/dealer/retailer-orders/${user.email}`)
            ]);
            setAllProducts(prodRes.data);
            setAllVehicles(vehRes.data);
            setProfile(profRes.data);
            setInventory(profRes.data.inventory || []);
            setRetailerOrders(retOrdRes.data);
        } catch (err) {
            console.error("Error loading data:", err);
            setMessage(prev => ({ ...prev, product: 'Error loading data' }));
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial Load
    useEffect(() => { loadAllData(); }, [loadAllData]);
    
    // Sync Storage
    useEffect(() => { localStorage.setItem("dealerCart", JSON.stringify(cart)); }, [cart]);
    useEffect(() => { localStorage.setItem("dealerOrders", JSON.stringify(orders)); }, [orders]);

    // Poll for updates
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(async () => {
             try {
                const res = await api.get(`/dealer/orders/${user.email}`);
                const serverOrders = res.data;
                const localOrders = JSON.parse(localStorage.getItem("dealerOrders")) || [];
                let hasUpdates = false;

                const updatedOrderItems = localOrders.map(localOrder => {
                    const serverOrder = serverOrders.find(so => so._id === localOrder.serverOrderId);
                    if (serverOrder && (serverOrder.bidStatus !== localOrder.bidStatus || !localOrder.serverDataSynced)) {
                        hasUpdates = true;
                        localOrder.bidStatus = serverOrder.bidStatus;
                        localOrder.status = serverOrder.status;
                        localOrder.serverDataSynced = true;
                        if (serverOrder.bidStatus === 'Accepted' && serverOrder.receiptNumber) {
                            localOrder.receiptNumber = serverOrder.receiptNumber;
                            localOrder.receiptDate = serverOrder.receiptGeneratedAt;
                            localOrder.farmerName = serverOrder.farmerDetails?.firstName + ' ' + (serverOrder.farmerDetails?.lastName || '');
                            localOrder.farmerMobile = serverOrder.farmerDetails?.mobile;
                            loadAllData(); // Refresh inventory
                        }
                    }
                    return localOrder;
                });
                if (hasUpdates) setOrders(updatedOrderItems);
             } catch(e) { console.error(e); }
        }, 10000);
        return () => clearInterval(interval);
    }, [user, loadAllData]);

    // --- Actions ---
    const handleNavigate = (section) => {
        setActiveSection(section);
        setShowSidebar(section === 'browse');
        window.scrollTo(0, 0);
    };

    const handleSignout = () => {
        if (window.confirm('Sign out?')) {
            logout();
            localStorage.removeItem('dealerCart');
            localStorage.removeItem('dealerOrders');
            navigate('/login');
        }
    };

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.id]: e.target.value });
    
    const getFilteredProducts = () => {
        return allProducts.filter(p => {
            if (p.harvestQuantity <= 0) return false;
            return (!filters.filterProductType || p.productType === filters.filterProductType) &&
                   (!filters.filterVariety || p.varietySpecies.toLowerCase().includes(filters.filterVariety.toLowerCase())) &&
                   (!filters.filterPrice || p.targetPrice <= parseFloat(filters.filterPrice));
        });
    };

    const handleQtyChange = (id, val) => setProductQuantities({ ...productQuantities, [id]: val });

    const handleAddToCart = (product) => {
        const qty = parseFloat(productQuantities[product._id]);
        if (!qty || qty <= 0) return alert("Please enter valid quantity");
        if (qty > product.harvestQuantity) return alert("Exceeds available stock");
        
        setCart(prev => {
            const exist = prev.find(i => i._id === product._id);
            return exist ? prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + qty } : i) 
                         : [...prev, { ...product, quantity: qty, originalHarvestQuantity: product.harvestQuantity }];
        });
        setProductQuantities({ ...productQuantities, [product._id]: '' });
        alert("Added to cart");
    };

    const handleRemoveFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id));

    const handleOrderFromCart = (item) => {
        const product = allProducts.find(p => p._id === item._id);
        if (!product || item.quantity > product.harvestQuantity) {
             alert("Stock changed. Please update cart.");
             return;
        }
        setOrders(prev => [...prev, { 
            ...item, 
            orderId: `local-${Date.now()}-${Math.random()}`, 
            vehicleAssigned: false, 
            reviewSubmitted: false, 
            bidPlaced: false, 
            bidStatus: null 
        }]);
        handleRemoveFromCart(item._id);
        alert("Proceed to Orders to assign vehicle.");
        handleNavigate('orders');
    };

    // Vehicle Logic
    const handleVehicleFormChange = (e) => setVehicleFormData({ ...vehicleFormData, [e.target.id]: e.target.value });
    const handleAddVehicle = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/dealer/vehicles/${user.email}`, { ...vehicleFormData, dealerEmail: user.email });
            setVehicleFormData({ vehicleId: '', vehicleType: '', temperatureCapacity: '' });
            loadAllData();
            setMessage({ ...message, vehicle: 'Vehicle Added!' });
        } catch (err) { alert("Error adding vehicle"); }
    };
    const handleDeleteVehicle = async (id) => {
        if(window.confirm("Delete vehicle?")) {
            await api.delete(`/dealer/vehicles/${user.email}/${id}`);
            loadAllData();
        }
    };
    const handleFreeVehicle = async (id) => {
        if(window.confirm("Free vehicle?")) {
            await api.post(`/dealer/vehicles/free/${user.email}/${id}`);
            loadAllData();
            setOrders(prev => prev.filter(o => o.vehicleId !== id || o.bidStatus === 'Accepted'));
        }
    };

    // Modal & Business Logic
    const openModal = (name, data) => { 
        setSelectedData(data); 
        if(name === 'review') setReviewData({ quality: '', comments: '', rating: 1 });
        if(name === 'bid') setBidPrice(0);
        setModal({ ...modal, [name]: true }); 
    };
    const closeModal = (name) => { setModal({ ...modal, [name]: false }); setSelectedData(null); };

    const handleAssignVehicle = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/dealer/assign-vehicle", {
                dealerEmail: user.email,
                productId: selectedData._id,
                farmerEmail: selectedData.farmerEmail,
                vehicleId: e.target.vehicleSelect.value,
                quantity: selectedData.quantity,
                tentativeDate: e.target.tentativeDate.value
            });
            setOrders(prev => prev.map(o => o.orderId === selectedData.orderId ? { ...o, vehicleAssigned: true, serverOrderId: res.data.orderId } : o));
            closeModal('assignVehicle');
            loadAllData();
            alert("Vehicle Assigned!");
        } catch (err) { alert(err.response?.data?.msg || "Error"); }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/dealer/submit-review', {
                productId: selectedData._id,
                dealerEmail: user.email,
                ...reviewData,
                rating: parseInt(reviewData.rating)
            });
            setOrders(prev => prev.map(o => o.orderId === selectedData.orderId ? { ...o, reviewSubmitted: true } : o));
            closeModal('review');
            loadAllData();
            alert("Review Submitted!");
        } catch (err) { alert("Error submitting review"); }
    };

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        try {
             await api.post('/dealer/place-bid', { orderId: selectedData.serverOrderId, bidPrice });
             setOrders(prev => prev.map(o => o.orderId === selectedData.orderId ? { ...o, bidPlaced: true, bidPrice, bidStatus: 'Pending' } : o));
             closeModal('bid');
             alert("Bid Placed!");
        } catch (err) { alert("Error placing bid"); }
    };

    // Inventory Handlers
    const handleInventoryPriceChange = async (item) => {
        const price = prompt("New Price:", item.unitPrice);
        if(price) {
            await api.put('/dealer/inventory/update-price', { dealerEmail: user.email, inventoryId: item._id, newPrice: price });
            loadAllData();
        }
    };
    const handleInventoryQuantityChange = async (item) => {
         const qty = prompt("New Quantity:", item.quantity);
         if(qty) {
            await api.put('/dealer/inventory/update-quantity', { dealerEmail: user.email, inventoryId: item._id, newQuantity: qty });
            loadAllData();
         }
    };
    const handleRemoveFromInventory = async (item) => {
        if(window.confirm("Remove item?")) {
            await api.delete('/dealer/inventory/remove', { data: { dealerEmail: user.email, inventoryId: item._id } });
            loadAllData();
        }
    };

    if (loading && !profile) return <div style={{textAlign: 'center', padding: '50px'}}>Loading...</div>;
    if (!profile) return <div>Error loading profile.</div>;

    // Inventory Stats
    const totalInvItems = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const totalInvValue = inventory.reduce((sum, i) => sum + (i.totalValue || (i.unitPrice * i.quantity) || 0), 0);

    return (
        <>
            <DealerNavbar 
                user={profile} 
                cartCount={cart.length} 
                onSignout={handleSignout} 
                onNavigate={handleNavigate}
                activeSection={activeSection}
            />
            
            <div className={`main-container ${showSidebar ? 'sidebar-active' : ''}`}>
                {/* Sidebar Filter (Only on Browse) */}
                <aside className={`sidebar-filters ${showSidebar ? 'show' : ''}`} style={{display: activeSection === 'browse' ? 'block' : 'none'}}>
                    <h3>🔍 Filter Products</h3>
                    <div className="filter-group">
                        <label>Type</label>
                        <select id="filterProductType" value={filters.filterProductType} onChange={handleFilterChange}>
                            <option value="">All Types</option>
                            <option value="Fruit">Fruit</option>
                            <option value="Vegetable">Vegetable</option>
                            <option value="Cereal">Cereal</option>
                            <option value="Spices">Spices</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Variety</label>
                        <input type="text" id="filterVariety" value={filters.filterVariety} onChange={handleFilterChange} placeholder="e.g. Mango" />
                    </div>
                    <div className="filter-group">
                        <label>Max Price</label>
                        <input type="number" id="filterPrice" value={filters.filterPrice} onChange={handleFilterChange} placeholder="₹" />
                    </div>
                </aside>

                <main className="content-area" style={{marginLeft: activeSection === 'browse' ? undefined : '0'}}>
                    {/* BROWSE SECTION */}
                    <section className={activeSection === 'browse' ? 'active-section' : 'hidden-section'}>
                        <div className="section-header">
                            <h2>🌾 Marketplace</h2>
                            <p style={{color:'#666'}}>Browse and purchase fresh produce directly from farmers.</p>
                        </div>
                        <div className="products-grid">
                            {getFilteredProducts().length === 0 ? <div className="empty-state"><h3>No products found.</h3></div> :
                            getFilteredProducts().map(p => (
                                <ProductCard key={p._id} product={p} onAddToCart={handleAddToCart} onQtyChange={handleQtyChange} onViewFarmer={openModal} onViewReviews={openModal} qty={productQuantities[p._id] || ''} />
                            ))}
                        </div>
                    </section>

                    {/* CART SECTION */}
                    <section className={activeSection === 'cart' ? 'active-section' : 'hidden-section'}>
                        <div className="section-header"><h2>🛒 My Cart</h2></div>
                        <div className="cart-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                            {cart.length === 0 ? <div className="empty-state"><h3>Your cart is empty.</h3></div> :
                            cart.map(item => (
                                <div key={item._id} className="modern-card">
                                    <img src={item.imageUrl} alt={item.varietySpecies} style={{width:'100%', height:'150px', objectFit:'cover'}} />
                                    <div className="card-body">
                                        <h4>{item.varietySpecies}</h4>
                                        <div className="card-badges"><span className="badge type">{item.productType}</span></div>
                                        <p className="price">₹{item.targetPrice} / {item.unitOfSale}</p>
                                        <p><strong>Qty:</strong> {item.quantity}</p>
                                        <div className="card-actions" style={{marginTop:'15px'}}>
                                            <button className="btn-primary" onClick={() => handleOrderFromCart(item)}>Order Now</button>
                                            <button className="btn-text" style={{color:'red'}} onClick={() => handleRemoveFromCart(item._id)}>Remove</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ORDERS SECTION */}
                    <section className={activeSection === 'orders' ? 'active-section' : 'hidden-section'}>
                        <div className="section-header"><h2>📦 My Orders (To Farmers)</h2></div>
                        <div className="orders-grid">
                            {orders.length === 0 ? <div className="empty-state"><h3>No orders yet.</h3></div> :
                            orders.map(order => (
                                <FarmerOrderCard key={order.orderId} item={order} onAssignVehicle={openModal} onPlaceBid={openModal} onAddReview={openModal} onViewReceipt={openModal} />
                            ))}
                        </div>
                    </section>

                    {/* INVENTORY SECTION */}
                    <section className={activeSection === 'inventory' ? 'active-section' : 'hidden-section'}>
                        <div className="section-header"><h2>📦 Warehouse Inventory</h2></div>
                        <div className="stats-row">
                            <div className="stat-box"><span>Items</span><h3>{totalInvItems.toFixed(2)}</h3></div>
                            <div className="stat-box"><span>Value</span><h3>₹{totalInvValue.toLocaleString()}</h3></div>
                        </div>
                        <div className="inventory-grid">
                            {inventory.map(item => (
                                <InventoryCard key={item._id} item={item} onPriceChange={handleInventoryPriceChange} onQtyChange={handleInventoryQuantityChange} onRemove={handleRemoveFromInventory} onViewReviews={openModal} />
                            ))}
                        </div>
                    </section>

                    {/* VEHICLES SECTION */}
                    <section className={activeSection === 'vehicles' ? 'active-section' : 'hidden-section'}>
                        <div className="section-header">
                            <h2>🚗 Vehicle Fleet Management</h2>
                            <p style={{color:'#6b7280'}}>Manage your logistics and delivery fleet.</p>
                        </div>

                        {/* Enhanced Add Vehicle Form */}
                        <div className="vehicle-form-container">
                             <div className="vehicle-form-header">
                                <h3>➕ Add New Vehicle</h3>
                             </div>
                             <form onSubmit={handleAddVehicle} className="vehicle-add-form">
                                <div className="form-group">
                                    <label>Vehicle Registration No.</label>
                                    <input type="text" id="vehicleId" placeholder="e.g. MH-12-AB-1234" value={vehicleFormData.vehicleId} onChange={handleVehicleFormChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Vehicle Type</label>
                                    <select id="vehicleType" value={vehicleFormData.vehicleType} onChange={handleVehicleFormChange} required>
                                        <option value="">Select Type...</option>
                                        <option value="Reefer Truck (5 MT)">Reefer Truck (5 MT)</option>
                                        <option value="Heavy Truck (10 MT)">Heavy Truck (10 MT)</option>
                                        <option value="Insulated Van (2 MT)">Insulated Van (2 MT)</option>
                                        <option value="Inspection Van">Inspection Van</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Temperature Capacity</label>
                                    <input type="text" id="temperatureCapacity" placeholder="e.g. -18°C to 4°C" value={vehicleFormData.temperatureCapacity} onChange={handleVehicleFormChange} required />
                                </div>
                                <button type="submit" className="btn-add-vehicle">Add to Fleet</button>
                             </form>
                        </div>

                        <div className="vehicles-grid">
                            {allVehicles.length === 0 ? (
                                <div className="empty-state"><div style={{fontSize:'3rem'}}>🚚</div><h3>No vehicles in fleet</h3></div>
                            ) : (
                                allVehicles.map(v => (
                                    <VehicleCard key={v._id} vehicle={v} onDelete={handleDeleteVehicle} onFree={handleFreeVehicle} />
                                ))
                            )}
                        </div>
                    </section>

                    {/* RETAILER ORDERS SECTION */}
                    <section className={activeSection === 'retailerOrders' ? 'active-section' : 'hidden-section'}>
                        <div className="section-header"><h2>🛍️ Orders from Retailers</h2></div>
                        <div className="orders-grid">
                            {retailerOrders.length === 0 ? <div className="empty-state"><h3>No orders received.</h3></div> :
                            retailerOrders.map(order => <RetailerOrderCard key={order._id} order={order} />)}
                        </div>
                    </section>

                    {/* PROFILE SECTION - PROFESSIONAL */}
                    <section className={activeSection === 'profile' ? 'active-section' : 'hidden-section'}>
                        <div className="profile-container">
                            <div className="profile-header-card">
                                <div className="profile-cover"></div>
                                <div className="profile-avatar-large">
                                    {profile.firstName?.charAt(0)}
                                </div>
                                <div className="profile-main-info">
                                    <h1>{profile.businessName || `${profile.firstName} ${profile.lastName}`}</h1>
                                    <span className="role-badge">Authorized Dealer</span>
                                </div>
                            </div>
                            
                            <div className="profile-details-grid">
                                <div className="detail-group">
                                    <h3>🏢 Business Information</h3>
                                    <div className="detail-row"><label>Business Name</label><span>{profile.businessName || 'N/A'}</span></div>
                                    <div className="detail-row"><label>GSTIN</label><span>{profile.gstin || 'N/A'}</span></div>
                                    <div className="detail-row"><label>Commodities</label><span>{profile.preferredCommodities?.join(', ') || 'General'}</span></div>
                                </div>
                                <div className="detail-group">
                                    <h3>📞 Contact Details</h3>
                                    <div className="detail-row"><label>Email</label><span>{profile.email}</span></div>
                                    <div className="detail-row"><label>Mobile</label><span>{profile.mobile}</span></div>
                                    <div className="detail-row"><label>Warehouse</label><span>{profile.warehouseAddress || 'N/A'}</span></div>
                                </div>
                            </div>
                        </div>
                    </section>

                </main>
            </div>
            
            {/* --- RESTORED MODALS --- */}
            
            <FarmerModal show={modal.farmer} onClose={() => closeModal('farmer')} farmerEmail={selectedData?.farmerEmail} />
            
            <AssignVehicleModal 
                show={modal.assignVehicle} 
                onClose={() => closeModal('assignVehicle')} 
                onSubmit={handleAssignVehicle} 
                vehicles={allVehicles.filter(v => v.currentStatus === 'AVAILABLE')} 
            />
            
            <ReviewModal 
                show={modal.review} 
                onClose={() => closeModal('review')} 
                onSubmit={handleSubmitReview} 
                data={reviewData} 
                setData={setReviewData} 
                productName={selectedData?.varietySpecies} 
            />

            <BidModal 
                show={modal.bid} 
                onClose={() => closeModal('bid')} 
                onSubmit={handlePlaceBid} 
                setBidPrice={setBidPrice} 
                order={selectedData} 
            />
            
            <ReceiptModal 
                show={modal.receipt} 
                onClose={() => closeModal('receipt')} 
                order={selectedData} 
                user={profile} 
            />

            {/* FIXED VIEW REVIEWS MODAL */}
            <ViewReviewsModal 
                show={modal.viewReviews} 
                onClose={() => closeModal('viewReviews')} 
                product={selectedData} 
            />
        </>
    );
};

// --- SUB COMPONENTS ---

const ProductCard = ({ product, onAddToCart, qty, onQtyChange, onViewFarmer, onViewReviews }) => (
    <div className="modern-card product-card">
        <img src={product.imageUrl} alt={product.varietySpecies} />
        <div className="card-body">
            <div className="card-badges">
                <span className="badge type">{product.productType}</span>
                <span className="badge stock">{product.harvestQuantity} {product.unitOfSale}</span>
            </div>
            <h3>{product.varietySpecies}</h3>
            <p className="price">₹{product.targetPrice} <small>/ {product.unitOfSale}</small></p>
            {product.reviews && product.reviews.length > 0 && (
                <div style={{fontSize:'0.85em', color:'#666', marginBottom:'10px'}}>
                    ⭐ {product.reviews.length} Review(s)
                    <button className="btn-text" style={{fontSize:'0.9em', marginLeft:'5px'}} onClick={() => onViewReviews('viewReviews', product)}>View</button>
                </div>
            )}
            <div className="card-actions">
                <button className="btn-text" onClick={() => onViewFarmer('farmer', product)}>View Farmer</button>
                <div className="action-group">
                    <input type="number" value={qty} onChange={(e) => onQtyChange(product._id, e.target.value)} placeholder="Qty" style={{width:'60px'}} />
                    <button className="btn-icon" onClick={() => onAddToCart(product)}>🛒</button>
                </div>
            </div>
        </div>
    </div>
);

// Enhanced Vehicle Card
const VehicleCard = ({ vehicle, onDelete, onFree }) => {
    const isTruck = vehicle.vehicleType.toLowerCase().includes('truck');
    const statusClass = vehicle.currentStatus.toLowerCase();

    return (
        <div className="vehicle-card-enhanced">
            <div className={`vehicle-status-bar ${statusClass}`}></div>
            <div className="vehicle-card-body">
                <div className="vehicle-header-row">
                    <div className={`vehicle-icon-box ${isTruck ? 'truck' : 'van'}`}>
                        {isTruck ? '🚚' : '🚐'}
                    </div>
                    <span className={`vehicle-status-badge ${statusClass}`}>
                        {vehicle.currentStatus}
                    </span>
                </div>
                
                <div className="vehicle-info">
                    <h4>{vehicle.vehicleId}</h4>
                    <span className="vehicle-type">{vehicle.vehicleType}</span>
                </div>

                <div className="vehicle-specs">
                    <div className="spec-item">
                        <span>Temp Range:</span>
                        <span>{vehicle.temperatureCapacity}</span>
                    </div>
                    {vehicle.assignedTo && (
                        <div className="spec-item" style={{marginTop:'8px', paddingTop:'8px', borderTop:'1px dashed #e5e7eb'}}>
                            <span>Assigned:</span>
                            <span>{vehicle.assignedTo.farmerName}</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="vehicle-card-footer">
                {vehicle.currentStatus === 'ASSIGNED' && (
                    <button onClick={() => onFree(vehicle._id)} className="btn-vehicle-action free">
                        ⚡ Free Vehicle
                    </button>
                )}
                <button onClick={() => onDelete(vehicle._id)} className="btn-vehicle-action delete">
                    🗑️ Delete
                </button>
            </div>
        </div>
    );
};

const InventoryCard = ({ item, onPriceChange, onQtyChange, onRemove, onViewReviews }) => (
    <div className="modern-card"> 
        <img src={item.imageUrl} alt={item.productName} style={{width:'100%', height:'120px', objectFit:'cover'}} />
        <div className="card-body">
            <h4>{item.productName}</h4> 
            <p>Qty: {item.quantity} | ₹{item.unitPrice}</p> 
            <div style={{marginTop:'10px', display:'flex', gap:'5px', flexWrap:'wrap'}}>
                <button className="btn-secondary" style={{fontSize:'0.8em', padding:'5px'}} onClick={() => onQtyChange(item)}>Qty</button>
                <button className="btn-secondary" style={{fontSize:'0.8em', padding:'5px'}} onClick={() => onPriceChange(item)}>Price</button>
                <button className="btn-del" style={{fontSize:'0.8em', padding:'5px'}} onClick={() => onRemove(item)}>🗑️</button>
                {item.retailerReviews?.length > 0 && <button className="btn-text" onClick={() => onViewReviews('viewReviews', item)}>⭐ Reviews</button>}
            </div>
        </div> 
    </div>
);

const FarmerOrderCard = ({ item, onAssignVehicle, onPlaceBid, onAddReview, onViewReceipt }) => {
    let action = null;
    const skipReview = item.quantity >= item.originalHarvestQuantity;

    if (item.bidStatus === 'Accepted') action = <button className="btn-primary" onClick={() => onViewReceipt('receipt', item)}>Receipt</button>;
    else if (item.bidStatus === 'Rejected') action = <span className="badge" style={{background:'#fee2e2', color:'red'}}>Rejected</span>;
    else if (item.bidPlaced) action = <span className="badge" style={{background:'#fef3c7', color:'#d97706'}}>Bid Pending</span>;
    else if (item.vehicleAssigned) {
        if (!item.reviewSubmitted && !skipReview) action = <button className="btn-secondary" onClick={() => onAddReview('review', item)}>Review</button>;
        else action = <button className="btn-primary" onClick={() => onPlaceBid('bid', item)}>Place Bid</button>;
    } else {
        action = <button className="btn-primary" style={{background:'#ef4444'}} onClick={() => onAssignVehicle('assignVehicle', item)}>Assign Vehicle</button>;
    }

    return (
        <div className="modern-card"> 
             <img src={item.imageUrl} alt={item.varietySpecies} style={{width:'100%', height:'120px', objectFit:'cover'}} />
             <div className="card-body">
                <h4>{item.varietySpecies}</h4> 
                <p>Qty: {item.quantity} | ₹{item.targetPrice}</p>
                <div style={{marginTop:'10px'}}>{action}</div>
             </div> 
        </div>
    );
};

const RetailerOrderCard = ({ order }) => (
    <div className="modern-card"> 
        <div className="card-body">
            <h4>Order from {order.retailerEmail}</h4> 
            <p>Status: <strong>{order.orderStatus}</strong></p>
            <p style={{fontSize:'1.2em', color:'green', fontWeight:'bold'}}>Total: ₹{order.totalAmount.toFixed(2)}</p> 
            <div style={{fontSize:'0.9em', color:'#666', marginTop:'5px'}}>
                {order.products.map(p => <div key={p.productId}>{p.productName} x {p.quantity}</div>)}
            </div>
        </div> 
    </div>
);

// --- MODAL COMPONENT DEFINITIONS ---

const FarmerModal = ({ show, onClose, farmerEmail }) => {
    const [farmer, setFarmer] = useState(null);
    useEffect(() => {
        if (show && farmerEmail) {
            setFarmer(null);
            api.get(`/farmer/profile/${farmerEmail}`)
                .then(res => setFarmer(res.data))
                .catch(err => console.error(err));
        }
    }, [show, farmerEmail]);

    if (!show) return null;
    return (
        <div className="modal" style={{display:'block'}} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3>Farmer Profile</h3>
                {farmer ? (
                    <div>
                        <p><b>Name:</b> {farmer.firstName} {farmer.lastName}</p>
                        <p><b>Email:</b> {farmer.email}</p>
                        <p><b>Mobile:</b> {farmer.mobile || 'N/A'}</p>
                        <p><b>Location:</b> {farmer.farmLocation || 'N/A'}</p>
                    </div>
                ) : <p>Loading...</p>}
            </div>
        </div>
    );
};

const AssignVehicleModal = ({ show, onClose, onSubmit, vehicles }) => {
    if (!show) return null;
    return (
        <div className="modal" style={{display:'block'}} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3>Assign Vehicle</h3>
                <form onSubmit={onSubmit}>
                    <label>Select Vehicle</label>
                    <select id="vehicleSelect" required style={{width:'100%', padding:'10px', margin:'10px 0'}}>
                        <option value="">-- Select --</option>
                        {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleType} ({v.vehicleId})</option>)}
                    </select>
                    <label>Tentative Date</label>
                    <input type="date" id="tentativeDate" required style={{width:'100%', padding:'10px', margin:'10px 0'}} />
                    <button className="btn-primary" type="submit" style={{width:'100%'}}>Assign</button>
                </form>
            </div>
        </div>
    );
};

const ReviewModal = ({ show, onClose, onSubmit, data, setData, productName }) => {
    if (!show) return null;
    return (
        <div className="modal" style={{display:'block'}} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3>Review: {productName}</h3>
                <form onSubmit={onSubmit}>
                    <select value={data.quality} onChange={e => setData({...data, quality: e.target.value})} required style={{width:'100%', padding:'10px', margin:'10px 0'}}>
                        <option value="">Quality</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Average">Average</option>
                        <option value="Poor">Poor</option>
                    </select>
                    <textarea value={data.comments} onChange={e => setData({...data, comments: e.target.value})} placeholder="Comments" required style={{width:'100%', padding:'10px', margin:'10px 0'}} />
                    <label>Rating: {data.rating}</label>
                    <input type="range" min="1" max="5" value={data.rating} onChange={e => setData({...data, rating: e.target.value})} style={{width:'100%'}} />
                    <button className="btn-primary" type="submit" style={{width:'100%', marginTop:'10px'}}>Submit</button>
                </form>
            </div>
        </div>
    );
};

const BidModal = ({ show, onClose, onSubmit, setBidPrice, order }) => {
    if (!show) return null;
    return (
        <div className="modal" style={{display:'block'}} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3>Place Bid: {order?.varietySpecies}</h3>
                <p>Original Price: ₹{order?.targetPrice}</p>
                <input type="number" onChange={e => setBidPrice(e.target.value)} placeholder="Your Bid Price" required style={{width:'100%', padding:'10px', margin:'10px 0'}} />
                <button className="btn-primary" onClick={onSubmit} style={{width:'100%'}}>Submit Bid</button>
            </div>
        </div>
    );
};

const ReceiptModal = ({ show, onClose, order, user }) => {
    if (!show) return null;
    return (
        <div className="modal" style={{display:'block'}} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{textAlign:'center'}}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3>Order Receipt</h3>
                <p><strong>Receipt #:</strong> {order.receiptNumber}</p>
                <div style={{textAlign:'left', background:'#f9f9f9', padding:'15px', borderRadius:'8px', margin:'15px 0'}}>
                    <p>Item: {order.varietySpecies}</p>
                    <p>Qty: {order.quantity}</p>
                    <p>Amount: ₹{(order.bidPrice * order.quantity).toFixed(2)}</p>
                    <hr/>
                    <p>Farmer: {order.farmerName}</p>
                    <p>Dealer: {user.businessName}</p>
                </div>
                <button className="btn-primary" onClick={() => window.print()}>Print</button>
            </div>
        </div>
    );
};

// --- FIX: UPDATED VIEW REVIEWS MODAL ---
const ViewReviewsModal = ({ show, onClose, product }) => {
    if (!show || !product) return null;

    // Correctly get reviews from the passed product/item directly
    const reviews = product.retailerReviews || product.reviews || [];

    return (
        <div className="modal" style={{display:'block', zIndex: 3000}} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3>Reviews for {product.productName || product.varietySpecies}</h3>
                <div style={{maxHeight:'400px', overflowY:'auto', marginTop:'15px'}}>
                    {reviews.length === 0 ? (
                        <p style={{color:'#666', fontStyle:'italic'}}>No reviews available.</p>
                    ) : (
                        reviews.map((review, index) => (
                             <div key={index} style={{marginBottom: '15px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border:'1px solid #eee'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                                    <span style={{fontWeight: '600', color: '#10b981', fontSize: '14px'}}>{review.quality}</span>
                                    <span style={{color: '#f59e0b', fontSize: '14px'}}>{'⭐'.repeat(review.rating)}</span>
                                </div>
                                <p style={{margin: '8px 0', fontSize: '14px', color: '#374151', lineHeight:'1.5'}}>{review.comments}</p>
                                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginTop: '8px'}}>
                                    <span>By: {review.retailerEmail || review.dealerEmail || 'Anonymous'}</span>
                                    <span>{review.date ? new Date(review.date).toLocaleDateString() : 'Recent'}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DealerDashboard;