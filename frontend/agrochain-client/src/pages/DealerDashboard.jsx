import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../assets/css/dealer.css'; // Your existing CSS file

// --- DealerNavbar Component (from dealer.html) ---
const DealerNavbar = ({ user, cartCount, onSignout, onNavigate, activeSection }) => {
    const [profileOpen, setProfileOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleNav = (section) => {
        onNavigate(section);
        setMobileMenuOpen(false); // Close mobile menu on navigation
    };

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click is outside the profile dropdown button
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
                <button className="mobile-menu-btn" id="mobileMenuBtn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰</button>
                <div className="nav-left">
                    <img src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh" alt="AgroChain Logo" className="logo" />
                    <span className="brand-name">Agro<span className="chain-text">Chain</span></span>
                </div>
                <div className="navbar-center">
                    <button onClick={() => handleNav('browse')} className={activeSection === 'browse' ? 'active' : ''}>🌾 Products</button>
                    <button onClick={() => handleNav('vehicles')} className={activeSection === 'vehicles' ? 'active' : ''}>🚗 Vehicles</button>
                    <button onClick={() => handleNav('orders')} className={activeSection === 'orders' ? 'active' : ''}>📦 Orders</button>
                    <button onClick={() => handleNav('inventory')} className={activeSection === 'inventory' ? 'active' : ''}>📦 Inventory</button>
                    <button onClick={() => handleNav('retailerOrders')} className={activeSection === 'retailerOrders' ? 'active' : ''}>🛍️ Retailer Orders</button>
                </div>
                <div className="navbar-right">
                    <button className="cart-btn" id="navCartBtn" onClick={() => handleNav('cart')}>
                        🛒 <span className="cart-badge" id="cartBadge" style={{ display: cartCount > 0 ? 'flex' : 'none' }}>{cartCount}</span>
                    </button>
                    <div className="profile-dropdown">
                        <button className="profile-btn" id="profileBtn" onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}>
                            <span id="profileName">{user.businessName || user.firstName}</span> ▼
                        </button>
                        <div className={`profile-menu ${profileOpen ? 'show' : ''}`} id="profileMenu">
                            <button id="viewProfileBtn" onClick={() => handleNav('profile')}>👤 My Profile</button>
                            <button id="signoutBtn" className="logout-item" onClick={onSignout}>🚪 Sign Out</button>
                        </div>
                    </div>
                </div>
            </nav>
            {/* Mobile Menu */}
            <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
            <div className={`mobile-nav-menu ${mobileMenuOpen ? 'show' : ''}`} id="mobileNavMenu">
                <button onClick={() => handleNav('browse')} className={activeSection === 'browse' ? 'active' : ''}>🌾 Browse Products</button>
                <button onClick={() => handleNav('vehicles')} className={activeSection === 'vehicles' ? 'active' : ''}>🚗 Vehicles</button>
                <button onClick={() => handleNav('orders')} className={activeSection === 'orders' ? 'active' : ''}>📦 My Orders</button>
                <button onClick={() => handleNav('inventory')} className={activeSection === 'inventory' ? 'active' : ''}>📦 Inventory</button>
                <button onClick={() => handleNav('retailerOrders')} className={activeSection === 'retailerOrders' ? 'active' : ''}>🛍️ Retailer Orders</button>
                <button onClick={() => handleNav('cart')} className={activeSection === 'cart' ? 'active' : ''}>🛒 My Cart</button>
            </div>
        </>
    );
};

// --- DealerDashboard Page Component ---
const DealerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Navigation State
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

    // LocalStorage-backed State (for Cart and Farmer Orders)
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem("dealerCart");
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [orders, setOrders] = useState(() => {
        const savedOrders = localStorage.getItem("dealerOrders");
        return savedOrders ? JSON.parse(savedOrders) : [];
    });

    // Filter State
    const [filters, setFilters] = useState({
        filterProductType: '',
        filterVariety: '',
        filterPrice: ''
    });

    // Modal State
    const [modal, setModal] = useState({
        farmer: false,
        assignVehicle: false,
        review: false,
        bid: false,
        receipt: false,
        viewReviews: false
    });
    const [selectedData, setSelectedData] = useState(null); // For modals
    const [productQuantities, setProductQuantities] = useState({});
    const [vehicleFormData, setVehicleFormData] = useState({ vehicleId: '', vehicleType: '', temperatureCapacity: '' });
    const [reviewData, setReviewData] = useState({ quality: '', comments: '', rating: 1 });
    const [bidPrice, setBidPrice] = useState(0);

    // --- Core Data Fetching ---
    const loadAllProducts = useCallback(async () => {
        setLoading(prev => ({ ...prev, products: true }));
        try {
            const res = await api.get('/dealer/all-products');
            setAllProducts(res.data);
        } catch (err) {
            console.error("Error loading products:", err);
            setMessage(prev => ({ ...prev, product: 'Error loading products' }));
        } finally {
            setLoading(prev => ({ ...prev, products: false }));
        }
    }, []);

    const loadAllVehicles = useCallback(async () => {
        if (!user) return;
        setLoading(prev => ({ ...prev, vehicles: true }));
        try {
            const res = await api.get(`/dealer/vehicles/${user.email}`);
            setAllVehicles(res.data);
        } catch (err) {
            console.error("Error loading vehicles:", err);
        } finally {
            setLoading(prev => ({ ...prev, vehicles: false }));
        }
    }, [user]);

    const loadInventoryAndProfile = useCallback(async () => {
        if (!user) return;
        setLoading(prev => ({ ...prev, inventory: true, profile: true }));
        try {
            const res = await api.get(`/dealer/profile/${user.email}`);
            setInventory(res.data.inventory || []);
            setProfile(res.data);
        } catch (err) {
            console.error("Error loading inventory/profile:", err);
        } finally {
            setLoading(prev => ({ ...prev, inventory: false, profile: false }));
        }
    }, [user]);

    const loadRetailerOrders = useCallback(async () => {
        if (!user) return;
        setLoading(prev => ({ ...prev, retailerOrders: true }));
        try {
            const res = await api.get(`/dealer/retailer-orders/${user.email}`);
            setRetailerOrders(res.data);
        } catch (err) {
            console.error("Error loading retailer orders:", err);
        } finally {
            setLoading(prev => ({ ...prev, retailerOrders: false }));
        }
    }, [user]);

    // Initial data load on mount
    useEffect(() => {
        if (user) {
            setLoading(true);
            Promise.all([
                loadAllProducts(),
                loadAllVehicles(),
                loadInventoryAndProfile(),
                loadRetailerOrders()
            ]).finally(() => setLoading(false));
        }
    }, [user, loadAllProducts, loadAllVehicles, loadInventoryAndProfile, loadRetailerOrders]);

    // Poll for bid updates (from dealer.js)
    useEffect(() => {
        if (!user) return;
        
        const checkBidUpdates = async () => {
            try {
                // This fetches SERVER-side orders
                const res = await api.get(`/dealer/orders/${user.email}`);
                const serverOrders = res.data;
                if (!Array.isArray(serverOrders)) return;

                let hasUpdates = false;
                let inventoryNeedsRefresh = false;
                
                // Get local orders
                const localOrders = JSON.parse(localStorage.getItem("dealerOrders")) || [];

                const updatedOrderItems = localOrders.map(localOrder => {
                    // Find matching server order
                    const serverOrder = serverOrders.find(so => so._id === localOrder.serverOrderId);
                    
                    if (serverOrder && (serverOrder.bidStatus !== localOrder.bidStatus || !localOrder.serverDataSynced)) {
                        console.log(`Syncing order ${localOrder.orderId}`);
                        hasUpdates = true;
                        localOrder.bidStatus = serverOrder.bidStatus;
                        localOrder.status = serverOrder.status;
                        localOrder.serverDataSynced = true; // Mark as synced

                        if (serverOrder.bidStatus === 'Accepted' && serverOrder.receiptNumber) {
                            localOrder.receiptNumber = serverOrder.receiptNumber;
                            localOrder.receiptDate = serverOrder.receiptGeneratedAt;
                            localOrder.farmerName = serverOrder.farmerDetails?.firstName + ' ' + (serverOrder.farmerDetails?.lastName || '');
                            localOrder.farmerMobile = serverOrder.farmerDetails?.mobile;
                            inventoryNeedsRefresh = true;
                        }
                    }
                    return localOrder;
                });

                if (hasUpdates) {
                    setOrders(updatedOrderItems);
                }
                if (inventoryNeedsRefresh) {
                    loadInventoryAndProfile(); // Reload inventory
                }
            } catch (err) {
                console.error("Error polling for bid updates:", err);
            }
        };

        const interval = setInterval(checkBidUpdates, 10000);
        return () => clearInterval(interval);
    }, [user, loadInventoryAndProfile]);
    
    // Sync cart and orders with localStorage
    useEffect(() => {
        localStorage.setItem("dealerCart", JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        localStorage.setItem("dealerOrders", JSON.stringify(orders));
    }, [orders]);


    // --- Navigation ---
    const handleNavigate = (section) => {
        setActiveSection(section);
        setShowSidebar(section === 'browse');
    };

    const handleSignout = () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            logout();
            localStorage.removeItem('dealerCart');
            localStorage.removeItem('dealerOrders');
            navigate('/login');
        }
    };

    // --- Filter Logic ---
    const handleFilterChange = (e) => {
        const { id, value } = e.target;
        setFilters(prev => ({ ...prev, [id]: value }));
    };

    const getFilteredProducts = () => {
        return allProducts.filter(product => {
            if (product.harvestQuantity <= 0) return false;
            const { filterProductType, filterVariety, filterPrice } = filters;
            return (!filterProductType || product.productType === filterProductType) &&
                   (!filterVariety || product.varietySpecies.toLowerCase().includes(filterVariety.toLowerCase())) &&
                   (!filterPrice || product.targetPrice <= parseFloat(filterPrice));
        });
    };

    // --- Product/Cart Logic ---
    const handleQtyChange = (productId, value) => {
        const product = allProducts.find(p => p._id === productId);
        if (!product) return;
        
        const maxQuantity = product.harvestQuantity || 0;
        let qty = parseFloat(value);
        
        if (isNaN(qty)) {
            qty = ''; // Allow clearing the input
        } else if (qty < 0) {
            qty = 0;
        } else if (qty > maxQuantity) {
            qty = maxQuantity;
            alert(`Maximum available quantity is ${maxQuantity}`);
        }
        
        setProductQuantities(prev => ({ ...prev, [productId]: qty }));
    };

    const handleAddToCart = (product) => {
        const qty = productQuantities[product._id] || 0;
        if (!qty || qty <= 0) {
            alert("Please enter a valid quantity");
            return;
        }
        if (qty > product.harvestQuantity) {
            alert(`Only ${product.harvestQuantity} available`);
            return;
        }
        
        setCart(prevCart => {
            const existing = prevCart.find(item => item._id === product._id);
            if (existing) {
                const totalQty = existing.quantity + qty;
                if (totalQty > product.harvestQuantity) {
                    alert(`Total quantity (${totalQty}) exceeds available stock (${product.harvestQuantity})`);
                    return prevCart;
                }
                return prevCart.map(item =>
                    item._id === product._id ? { ...item, quantity: totalQty } : item
                );
            } else {
                return [...prevCart, { ...product, quantity: qty, originalHarvestQuantity: product.harvestQuantity }];
            }
        });
        alert("Product added to cart!");
        setProductQuantities(prev => ({ ...prev, [product._id]: '' }));
    };

    const handleRemoveFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item._id !== productId));
    };

    const handleOrderFromCart = (cartItem) => {
        const product = allProducts.find(p => p._id === cartItem._id);
        if (!product || cartItem.quantity > product.harvestQuantity) {
            alert("Stock quantity has changed or product is no longer available. Please update your cart.");
            if (!product) handleRemoveFromCart(cartItem._id);
            return;
        }
        
        const newOrder = {
            ...cartItem,
            orderId: 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            vehicleAssigned: false,
            reviewSubmitted: false,
            bidPlaced: false,
            bidStatus: null,
            serverOrderId: null // Will be filled upon vehicle assignment
        };
        
        setOrders(prevOrders => [...prevOrders, newOrder]);
        handleRemoveFromCart(cartItem._id);
        alert("✅ Proceed to My Orders to Assign a Vehicle!");
        handleNavigate('orders');
    };

    // --- Vehicle Logic ---
    const handleVehicleFormChange = (e) => {
        const { id, value } = e.target;
        setVehicleFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/dealer/vehicles/${user.email}`, { ...vehicleFormData, dealerEmail: user.email });
            setMessage(prev => ({ ...prev, vehicle: 'Vehicle added successfully!' }));
            setVehicleFormData({ vehicleId: '', vehicleType: '', temperatureCapacity: '' });
            loadAllVehicles();
        } catch (err) {
            setMessage(prev => ({ ...prev, vehicle: err.response?.data?.msg || 'Error adding vehicle' }));
        }
    };
    
    const handleDeleteVehicle = async (vehicleId) => {
        if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
        try {
            await api.delete(`/dealer/vehicles/${user.email}/${vehicleId}`);
            alert('Vehicle deleted!');
            loadAllVehicles();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error deleting vehicle. Make sure it is not assigned.');
        }
    };

    const handleFreeVehicle = async (vehicleId) => {
        if (!window.confirm('Are you sure you want to free this vehicle? The associated order will be cancelled.')) return;
        try {
            await api.post(`/dealer/vehicles/free/${user.email}/${vehicleId}`);
            alert('Vehicle freed!');
            loadAllVehicles();
            setOrders(prev => prev.filter(o => o.vehicleId !== vehicleId || o.bidStatus === 'Accepted')); // Remove from local orders if not completed
        } catch (err) {
            alert(err.response?.data?.msg || 'Error freeing vehicle');
        }
    };

    // --- Order Logic (Farmer) ---
    const handleAssignVehicle = async (e) => {
        e.preventDefault();
        const vehicleId = e.target.vehicleSelect.value;
        const tentativeDate = e.target.tentativeDate.value;
        
        if (!vehicleId || !tentativeDate) {
            alert("Please select a vehicle and a date.");
            return;
        }

        try {
            const res = await api.post("/dealer/assign-vehicle", {
                dealerEmail: user.email,
                productId: selectedData._id,
                farmerEmail: selectedData.farmerEmail,
                vehicleId: vehicleId,
                quantity: selectedData.quantity,
                tentativeDate: tentativeDate
            });
            
            setOrders(prevOrders => prevOrders.map(o => 
                o.orderId === selectedData.orderId 
                ? { ...o, vehicleAssigned: true, serverOrderId: res.data.orderId } 
                : o
            ));
            
            alert("Vehicle Assigned Successfully!");
            setModal(prev => ({ ...prev, assignVehicle: false }));
            loadAllVehicles();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error assigning vehicle');
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        const { quality, comments, rating } = reviewData;
        if (!quality || !comments || !rating) {
            alert("Please fill all review fields.");
            return;
        }
        
        try {
            await api.post('/dealer/submit-review', {
                productId: selectedData._id,
                dealerEmail: user.email,
                quality,
                comments,
                rating: parseInt(rating)
            });
            
            setOrders(prevOrders => prevOrders.map(o => 
                o.orderId === selectedData.orderId ? { ...o, reviewSubmitted: true } : o
            ));
            
            alert("Review submitted!");
            setModal(prev => ({ ...prev, review: false }));
            loadAllProducts();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error submitting review');
        }
    };

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        if (!bidPrice || bidPrice <= 0) {
            alert("Please enter a valid bid price.");
            return;
        }
        
        try {
            await api.post('/dealer/place-bid', {
                orderId: selectedData.serverOrderId,
                bidPrice: bidPrice
            });
            
            setOrders(prevOrders => prevOrders.map(o =>
                o.orderId === selectedData.orderId 
                ? { ...o, bidPlaced: true, bidPrice: bidPrice, bidStatus: 'Pending' }
                : o
            ));
            
            alert("Bid placed successfully!");
            setModal(prev => ({ ...prev, bid: false }));
        } catch (err) {
            alert(err.response?.data?.msg || 'Error placing bid');
        }
    };

    // --- Inventory Logic ---
    const handleInventoryPriceChange = async (item) => {
        const newPrice = window.prompt(`Enter new unit price for ${item.productName}:`, item.unitPrice);
        if (newPrice === null) return;
        if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) {
            alert("Invalid price.");
            return;
        }
        
        try {
            await api.put('/dealer/inventory/update-price', {
                dealerEmail: user.email,
                inventoryId: item._id,
                newPrice: parseFloat(newPrice)
            });
            alert("Price updated!");
            loadInventoryAndProfile();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error updating price');
        }
    };

    const handleInventoryQuantityChange = async (item) => {
        const newQty = window.prompt(`Enter new quantity for ${item.productName}:`, item.quantity);
        if (newQty === null) return;
        if (newQty === "" || isNaN(newQty) || parseFloat(newQty) < 0) {
            alert("Invalid quantity.");
            return;
        }
        
        try {
            await api.put('/dealer/inventory/update-quantity', {
                dealerEmail: user.email,
                inventoryId: item._id,
                newQuantity: parseFloat(newQty)
            });
            alert("Quantity updated!");
            loadInventoryAndProfile();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error updating quantity');
        }
    };
    
    const handleRemoveFromInventory = async (item) => {
        if (!window.confirm(`Are you sure you want to remove ${item.productName} from inventory?`)) return;
        
        try {
            await api.delete('/dealer/inventory/remove', {
                data: { dealerEmail: user.email, inventoryId: item._id }
            });
            alert("Item removed from inventory!");
            loadInventoryAndProfile();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error removing item');
        }
    };
    
    // --- Helper to open modals ---
    const openModal = (modalName, data) => {
        setSelectedData(data);
        if (modalName === 'review') setReviewData({ quality: '', comments: '', rating: 1 });
        if (modalName === 'bid') setBidPrice(0);
        setModal(prev => ({ ...prev, [modalName]: true }));
    };
    
    const closeModal = (modalName) => {
        setSelectedData(null);
        setModal(prev => ({ ...prev, [modalName]: false }));
    };


    // --- Render ---
    if (loading && !profile) { // Show a full page loader on initial load
        return <div style={{textAlign: 'center', paddingTop: '100px', fontSize: '1.2em'}}>Loading Dashboard...</div>;
    }
    
    if (!user || !profile) {
        return <div>Error loading user profile. Please try logging in again.</div>
    }

    // Calculate inventory stats
    const totalInvItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalInvValue = inventory.reduce((sum, item) => sum + (item.totalValue || (item.unitPrice * item.quantity) || 0), 0);
    const invProductTypes = new Set(inventory.map(item => item.productType)).size;

    return (
        <>
            <DealerNavbar 
                user={profile} 
                cartCount={cart.length} 
                onSignout={handleSignout} 
                onNavigate={handleNavigate}
                activeSection={activeSection}
            />
            
            <div className="main-container">
                <aside 
                    className={`sidebar-filters`}
                    id="sidebarFilters"
                    style={{ display: showSidebar ? 'block' : 'none' }}
                >
                    <h3>🔍 Filter Products</h3>
                    <div className="filter-group">
                        <label>Product Type</label>
                        <select id="filterProductType" value={filters.filterProductType} onChange={handleFilterChange}>
                            <option value="">All Types</option>
                            <option value="Fruit">Fruit</option>
                            <option value="Vegetable">Vegetable</option>
                            <option value="Cereal">Cereal</option>
                            <option value="Spices">Spices</option>
                            <option value="Pulses">Pulses</option>
                            <option value="Oil Seeds">Oil Seeds</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Variety</label>
                        <input type="text" id="filterVariety" value={filters.filterVariety} onChange={handleFilterChange} placeholder="e.g., Alphonso Mango" />
                    </div>
                    <div className="filter-group">
                        <label>Max Price (₹)</label>
                        <input type="number" id="filterPrice" value={filters.filterPrice} onChange={handleFilterChange} placeholder="Enter max price" />
                    </div>
                </aside>

                <main className="content-area" style={{ marginLeft: showSidebar ? '280px' : '0' }}>
                    
                    {/* --- Browse Products Section --- */}
                    <section id="browseSection" className={activeSection === 'browse' ? 'section active' : 'section'}>
                        {message.product && <div className="message error">{message.product}</div>}
                        <div id="productsGrid" className="products-grid">
                            {loading ? <p>Loading products...</p> : getFilteredProducts().length === 0 ? <div className="empty-state"><h3>No Products Found</h3></div> : getFilteredProducts().map(product => (
                                <ProductCard 
                                    key={product._id} 
                                    product={product} 
                                    onAddToCart={handleAddToCart}
                                    onQtyChange={handleQtyChange}
                                    onViewFarmer={openModal}
                                    onViewReviews={openModal}
                                    qty={productQuantities[product._id] || ''}
                                />
                            ))}
                        </div>
                    </section>
                    
                    {/* --- Cart Section --- */}
                    <section id="cartSection" className={activeSection === 'cart' ? 'section active' : 'section'}>
                        <div className="section-header"><h1 className="section-title">🛒 My Cart</h1></div>
                        <div id="cartGrid" className="orders-grid">
                            {cart.length === 0 ? <div className="empty-state"><h3>Your Cart is Empty</h3><p>Add items from the Products page.</p></div> : cart.map(item => (
                                <div key={item._id} className="order-item">
                                    <img src={item.imageUrl} alt={item.varietySpecies} className="order-image" />
                                    <div className="order-info">
                                        <h4>{item.varietySpecies}</h4>
                                        <p>{item.productType}</p>
                                        <p>₹{item.targetPrice} per {item.unitOfSale}</p>
                                        <p><b>Quantity:</b> {item.quantity}</p>
                                    </div>
                                    <div className="order-actions">
                                        <button className="btn-remove" onClick={() => handleRemoveFromCart(item._id)}>⌛ Remove</button>
                                        <button className="btn-primary" onClick={() => handleOrderFromCart(item)}>📦 Order Now</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* --- Orders Section (Farmer) --- */}
                    <section id="ordersSection" className={activeSection === 'orders' ? 'section active' : 'section'}>
                        <div className="section-header"><h1 className="section-title">📦 My Orders (to Farmers)</h1></div>
                        <div id="ordersGrid" className="orders-grid">
                            {orders.length === 0 ? <div className="empty-state"><h3>No orders placed yet.</h3><p>Order items from your cart to get started.</p></div> : orders.map(item => (
                                <FarmerOrderCard 
                                    key={item.orderId} 
                                    item={item} 
                                    onAssignVehicle={openModal}
                                    onAddReview={openModal}
                                    onPlaceBid={openModal}
                                    onViewReceipt={openModal}
                                />
                            ))}
                        </div>
                    </section>
                    
                    {/* --- Inventory Section (from Bids) --- */}
                    <section id="inventorySection" className={activeSection === 'inventory' ? 'section active' : 'section'}>
                        <div className="section-header"><h1 className="section-title">📦 My Inventory</h1></div>
                        <div className="inventory-stats">
                            <div className="stat-card"><div className="stat-label">Total Items</div><div className="stat-value" id="totalItems">{totalInvItems.toFixed(2)}</div></div>
                            <div className="stat-card"><div className="stat-label">Total Value</div><div className="stat-value" id="totalValue">₹{totalInvValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
                            <div className="stat-card"><div className="stat-label">Product Types</div><div className="stat-value" id="productTypes">{invProductTypes}</div></div>
                        </div>
                        {message.inventory && <div className="message success">{message.inventory}</div>}
                        <div id="inventoryGrid" className="inventory-grid">
                            {loading ? <p>Loading inventory...</p> : inventory.length === 0 ? <div className="empty-state"><h3>No Inventory Yet</h3><p>Accept bids from farmers to add items here.</p></div> : inventory.map(item => (
                                <InventoryCard 
                                    key={item._id} 
                                    item={item}
                                    onPriceChange={handleInventoryPriceChange}
                                    onQtyChange={handleInventoryQuantityChange}
                                    onRemove={handleRemoveFromInventory}
                                    onViewReviews={openModal}
                                />
                            ))}
                        </div>
                    </section>

                    {/* --- Vehicles Section --- */}
                    <section id="vehiclesSection" className={activeSection === 'vehicles' ? 'section active' : 'section'}>
                        <div className="section-header"><h1 className="section-title">🚗 Vehicle Management</h1></div>
                        <div className="vehicle-form">
                            <h3>Add New Vehicle</h3>
                            <form id="vehicleForm" onSubmit={handleAddVehicle}>
                                <div className="form-grid">
                                    <div className="form-group"><label>Vehicle ID *</label><input type="text" id="vehicleId" value={vehicleFormData.vehicleId} onChange={handleVehicleFormChange} placeholder="e.g., DL-14-RE-5678" required /></div>
                                    <div className="form-group"><label>Vehicle Type *</label><select id="vehicleType" value={vehicleFormData.vehicleType} onChange={handleVehicleFormChange} required><option value="">Select...</option><option value="Reefer Truck (5 MT)">Reefer Truck (5 MT)</option><option value="Insulated Van (2 MT)">Insulated Van (2 MT)</option><option value="Inspection Van">Inspection Van</option><option value="Heavy Truck (10 MT)">Heavy Truck (10 MT)</option></select></div>
                                    <div className="form-group"><label>Temperature Capacity *</label><input type="text" id="temperatureCapacity" value={vehicleFormData.temperatureCapacity} onChange={handleVehicleFormChange} placeholder="e.g., -18°C to 0°C" required /></div>
                                </div>
                                <button type="submit" className="btn-primary">Add Vehicle</button>
                            </form>
                        </div>
                        {message.vehicle && <div className="message success">{message.vehicle}</div>}
                        <div id="vehiclesGrid" className="vehicles-grid">
                            {loading ? <p>Loading vehicles...</p> : allVehicles.length === 0 ? <div className="empty-state"><h3>No Vehicles Added</h3><p>Add a vehicle using the form above.</p></div> : allVehicles.map(vehicle => (
                                <VehicleCard 
                                    key={vehicle._id}
                                    vehicle={vehicle}
                                    onDelete={handleDeleteVehicle}
                                    onFree={handleFreeVehicle}
                                />
                            ))}
                        </div>
                    </section>
                    
                    {/* --- Retailer Orders Section --- */}
                    <section id="retailerOrdersSection" className={activeSection === 'retailerOrders' ? 'section active' : 'section'}>
                         <div className="section-header"><h1 className="section-title">🛍️ Retailer Orders</h1></div>
                         <div id="retailerOrdersGrid" className="inventory-grid">
                            {loading ? <p>Loading retailer orders...</p> : retailerOrders.length === 0 ? <div className="empty-state"><h3>No orders from retailers yet.</h3></div> : retailerOrders.map(order => (
                                <RetailerOrderCard key={order._id} order={order} />
                            ))}
                         </div>
                    </section>

                    {/* --- Profile Section --- */}
                    <section id="profileSection" className={activeSection === 'profile' ? 'section active' : 'section'}>
                        <div className="section-header"><h1 className="section-title">👤 My Profile</h1></div>
                        <div id="profileInfo">
                            {loading ? <p>Loading profile...</p> : profile && (
                                <div className="product-details" style={{ maxWidth: '600px', background: 'white', padding: '20px', borderRadius: '8px' }}>
                                    <div className="product-detail-item"><div className="product-detail-label">Name</div><div className="product-detail-value">{profile.firstName} {profile.lastName || ''}</div></div>
                                    <div className="product-detail-item"><div className="product-detail-label">Email</div><div className="product-detail-value">{profile.email}</div></div>
                                    <div className="product-detail-item"><div className="product-detail-label">Mobile</div><div className="product-detail-value">{profile.mobile}</div></div>
                                    <div className="product-detail-item"><div className="product-detail-label">Business Name</div><div className="product-detail-value">{profile.businessName || 'N/A'}</div></div>
                                    <div className="product-detail-item"><div className="product-detail-label">GSTIN</div><div className="product-detail-value">{profile.gstin || 'N/A'}</div></div>
                                    <div className="product-detail-item"><div className="product-detail-label">Warehouse Address</div><div className="product-detail-value">{profile.warehouseAddress || 'N/A'}</div></div>
                                </div>
                            )}
                        </div>
                    </section>

                </main>
            </div>
            
            {/* --- Modals --- */}
            <FarmerModal 
                show={modal.farmer} 
                onClose={() => closeModal('farmer')} 
                farmerEmail={selectedData?.farmerEmail} 
            />
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
                user={profile} // Pass the full profile
            />
            <ViewReviewsModal
                show={modal.viewReviews}
                onClose={() => closeModal('viewReviews')}
                product={selectedData}
                allProducts={allProducts}
                inventory={inventory}
            />
        </>
    );
};

// --- Child Components (Cards & Modals) ---

const ProductCard = ({ product, onAddToCart, onQtyChange, onViewFarmer, onViewReviews, qty }) => (
    <div className="product-card">
        <img src={product.imageUrl} alt={product.varietySpecies} className="product-image" />
        <div className="product-content">
            <div className="product-header">
                <div className="product-title">
                    <h3>{product.varietySpecies}</h3>
                    <span className="product-type">{product.productType}</span>
                </div>
            </div>
            <div className="product-details">
                <div className="product-detail-item">
                    <div className="product-detail-label">Available Stock</div>
                    <div className="product-detail-value">{product.harvestQuantity} {product.unitOfSale}</div>
                </div>
                <div className="product-detail-item">
                    <div className="product-detail-label">Price</div>
                    <div className="product-detail-value">₹{product.targetPrice} per {product.unitOfSale}</div>
                </div>
            </div>
            {product.reviews && product.reviews.length > 0 && (
                <div className="product-reviews">
                    <h4 style={{ fontSize: '14px', margin: '10px 0 5px 0', color: '#374151' }}>⭐ Reviews ({product.reviews.length})</h4>
                    {product.reviews.slice(0, 2).map((review, index) => (
                        <div key={index} className="review-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="review-quality">{review.quality}</span>
                                <span className="review-rating">{'⭐'.repeat(review.rating)}</span>
                            </div>
                            <p className="review-comment">{review.comments}</p>
                        </div>
                    ))}
                    {product.reviews.length > 2 && <button className="btn-secondary" style={{width: '100%', marginTop: '5px'}} onClick={() => onViewReviews('viewReviews', product)}>View All {product.reviews.length} Reviews</button>}
                </div>
            )}
            <div className="product-actions">
                <button className="btn-secondary" onClick={() => onViewFarmer('farmer', { farmerEmail: product.farmerEmail })}>
                    View Farmer Details
                </button>
            </div>
            <div className="order-now-box">
                <input
                    type="number"
                    id={`qty-${product._id}`}
                    placeholder="Qty"
                    min="1"
                    max={product.harvestQuantity}
                    step="0.01"
                    value={qty}
                    onChange={(e) => onQtyChange(product._id, e.target.value)}
                />
                <button className="btn-primary" onClick={() => onAddToCart(product)}>🛒 Add to Cart</button>
            </div>
        </div>
    </div>
);

const FarmerOrderCard = ({ item, onAssignVehicle, onAddReview, onPlaceBid, onViewReceipt }) => {
    let actionButtons = null;
    let skipReview = item.quantity >= item.originalHarvestQuantity;

    if (item.bidStatus === 'Accepted') {
        actionButtons = (
            <>
                <span className="bid-accepted">✓ Bid Accepted</span>
                <button className="btn-receipt" onClick={() => onViewReceipt('receipt', item)}>📄 View Receipt</button>
            </>
        );
    } else if (item.bidStatus === 'Rejected') {
        actionButtons = <span className="bid-rejected">✗ Bid Cancelled</span>;
    } else if (item.bidPlaced) {
        actionButtons = <span className="bid-pending">⏳ Bid Pending</span>;
    } else if (item.vehicleAssigned) {
        if ((item.reviewSubmitted || skipReview) && !item.bidPlaced) {
            actionButtons = <button className="btn-bid" onClick={() => onPlaceBid('bid', item)}>💰 Place Bid</button>;
        } else if (!item.reviewSubmitted && !skipReview) {
            actionButtons = <button className="btn-review" onClick={() => onAddReview('review', item)}>⭐ Add Review</button>;
        } else if (item.reviewSubmitted && !item.bidPlaced) {
            actionButtons = <button className="btn-bid" onClick={() => onPlaceBid('bid', item)}>💰 Place Bid</button>;
        }
    } else {
        actionButtons = <button className="btn-assign" onClick={() => onAssignVehicle('assignVehicle', item)}>Assign Vehicle</button>;
    }

    return (
        <div className="order-item">
            <img src={item.imageUrl} alt={item.varietySpecies} className="order-image" />
            <div className="order-info">
                <h4>{item.varietySpecies}</h4>
                <p>{item.productType}</p>
                <p>₹{item.targetPrice} per {item.unitOfSale}</p>
                <p><b>Quantity Ordered:</b> {item.quantity}</p>
                {item.bidPrice > 0 && <p><b>Your Bid:</b> ₹{item.bidPrice} per {item.unitOfSale}</p>}
                {item.reviewSubmitted && <p style={{color: '#10b981'}}>✓ Review Submitted</p>}
                {skipReview && !item.reviewSubmitted && <p style={{color: '#06b6d4'}}>✓ Review skipped (full stock)</p>}
            </div>
            <div className="order-actions">{actionButtons}</div>
        </div>
    );
};

const VehicleCard = ({ vehicle, onDelete, onFree }) => (
    <div className={`vehicle-card vehicle-${vehicle.currentStatus.toLowerCase()}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{wordBreak: 'break-word'}}>{vehicle.vehicleId}</h3>
            <span className={`vehicle-status status-${vehicle.currentStatus.toLowerCase().replace(' ', '-')}-vehicle`}>{vehicle.currentStatus}</span>
        </div>
        <div className="product-details">
            <div className="product-detail-item"><div className="product-detail-label">Type</div><div className="product-detail-value">{vehicle.vehicleType}</div></div>
            <div className="product-detail-item"><div className="product-detail-label">Temperature</div><div className="product-detail-value">{vehicle.temperatureCapacity}</div></div>
        </div>
        {vehicle.assignedTo && (
            <div style={{ marginTop: '15px', padding: '10px', background: '#fef3c7', borderRadius: '6px' }}>
                <strong>Assigned to:</strong> {vehicle.assignedTo.productName}<br/>
                <strong>Farmer:</strong> {vehicle.assignedTo.farmerName}
            </div>
        )}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {vehicle.currentStatus !== 'AVAILABLE' && <button className="btn-free" onClick={() => onFree(vehicle._id)} style={{flex: 1}}>✓ Free Vehicle</button>}
            <button className="btn-delete" onClick={() => onDelete(vehicle._id)} style={{ flex: 1, width: vehicle.currentStatus === 'AVAILABLE' ? '100%' : 'auto' }}>🗑️ Delete</button>
        </div>
    </div>
);

const InventoryCard = ({ item, onPriceChange, onQtyChange, onRemove, onViewReviews }) => {
    const totalValue = item.totalValue || (item.unitPrice * item.quantity);
    return (
        <div className="inventory-card">
            <div className="inventory-card-header"><img src={item.imageUrl} alt={item.productName} className="inventory-image" /></div>
            <div className="inventory-content">
                <h3>{item.productName}</h3>
                <p className="inventory-type">{item.productType}</p>
                <div className="inventory-details">
                    <div className="inventory-detail-row"><span className="detail-label">Quantity:</span><span className="detail-value">{item.quantity.toFixed(2)} {item.unitOfSale || ''}</span></div>
                    <div className="inventory-detail-row"><span className="detail-label">Unit Price:</span><span className="detail-value">₹{item.unitPrice.toFixed(2)}</span></div>
                    <div className="inventory-detail-row"><span className="detail-label">Total Value:</span><span className="detail-value" style={{fontWeight: 'bold'}}>₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="inventory-detail-row"><span className="detail-label">Farmer:</span><span className="detail-value">{item.farmerName}</span></div>
                    <div className="inventory-detail-row"><span className="detail-label">Receipt #:</span><span className="detail-value">{item.receiptNumber || 'N/A'}</span></div>
                </div>
                {item.retailerReviews && item.retailerReviews.length > 0 && (
                    <div className="product-reviews" style={{padding: '10px', background: '#f9fafb'}}>
                        <h4 style={{ fontSize: '14px', margin: '0 0 5px 0', color: '#374151' }}>⭐ Retailer Reviews ({item.retailerReviews.length})</h4>
                        <button className="btn-secondary" style={{width: '100%', marginTop: '5px'}} onClick={() => onViewReviews('viewReviews', item)}>View All {item.retailerReviews.length} Reviews</button>
                    </div>
                )}
                <div className="inventory-actions">
                    <button className="btn-reduce" onClick={() => onQtyChange(item)}>➖ Reduce Quantity</button>
                    <button className="btn-primary" onClick={() => onPriceChange(item)} style={{background: '#3b82f6'}}>💰 Change Price</button>
                    <button className="btn-remove-inventory" onClick={() => onRemove(item)}>🗑️ Remove All</button>
                </div>
            </div>
        </div>
    );
};

const RetailerOrderCard = ({ order }) => (
    <div className="inventory-card" style={{borderLeft: `4px solid ${order.paymentDetails.status === 'Completed' ? '#10b981' : '#f59e0b'}`}}>
        <div className="inventory-content">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom: '15px'}}>
                <div>
                    <h3 style={{fontSize: '1.1em'}}>Order from: <span>{order.retailerEmail}</span></h3>
                    <p className="inventory-type" style={{margin: '5px 0'}}>Status: <strong>{order.orderStatus}</strong></p>
                    <p className="inventory-type">Payment: <span style={{color: order.paymentDetails.status === 'Completed' ? '#059669' : '#d97706', fontWeight: 'bold'}}>{order.paymentDetails.status}</span></p>
                </div>
                <p style={{fontSize: '1.4em', fontWeight: 'bold', color: '#059669'}}>₹{order.totalAmount.toFixed(2)}</p>
            </div>
            <div className="inventory-details" style={{background: '#f9fafb', padding: '15px', borderRadius: '8px'}}>
                <h4>Products Sold:</h4>
                {order.products.map(p => (
                    <div key={p.productId} className="detail-row" style={{padding: '8px 0', borderBottom: '1px dashed #e0e0e0'}}>
                        <span>{p.productName} <small>(Qty: {p.quantity})</small></span>
                        <span style={{fontWeight: '600'}}>₹{(p.quantity * p.unitPrice).toFixed(2)}</span>
                    </div>
                ))}
            </div>
            <div className="dealer-info-panel" style={{background: '#eef2ff', padding: '12px', borderRadius: '6px', border: '1px solid #c7d2fe', marginTop: '15px'}}>
                <p style={{margin: '5px 0'}}><strong>Retailer's Shipping Address:</strong></p>
                <p style={{margin: '5px 0', color: '#4338ca'}}>{order.shippingAddress}</p>
            </div>
        </div>
    </div>
);

// --- Modal Components ---

const FarmerModal = ({ show, onClose, farmerEmail }) => {
    const [farmer, setFarmer] = useState(null);
    useEffect(() => {
        if (show && farmerEmail) {
            setFarmer(null); // Clear previous
            api.get(`/farmer/profile/${farmerEmail}`)
                .then(res => setFarmer(res.data))
                .catch(err => console.error("Failed to fetch farmer", err));
        }
    }, [show, farmerEmail]);

    if (!show) return null;
    return (
        <div id="farmerModal" className="modal" style={{ display: 'block' }} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span id="closeFarmerModal" className="close" onClick={onClose}>&times;</span>
                <h3>Farmer Profile</h3>
                <div id="farmerProfileDetails">
                    {farmer ? (
                        <>
                            <p><b>Name:</b> {farmer.firstName} {farmer.lastName || ""}</p>
                            <p><b>Email:</b> {farmer.email}</p>
                            <p><b>Mobile:</b> {farmer.mobile || "N/A"}</p>
                            <p><b>Farm Location:</b> {farmer.farmLocation || "N/A"}</p>
                        </>
                    ) : <p>Loading...</p>}
                </div>
            </div>
        </div>
    );
};

const AssignVehicleModal = ({ show, onClose, onSubmit, vehicles }) => {
    if (!show) return null;
    return (
        <div id="assignVehicleModal" className="modal" style={{ display: 'block' }} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3>Assign Vehicle to Product</h3>
                <form onSubmit={onSubmit}>
                    <label>Select Vehicle:</label>
                    <select id="vehicleSelect" required>
                        <option value="">-- Select Vehicle --</option>
                        {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleType} - {v.vehicleId}</option>)}
                    </select>
                    <label>Enter Tentative Arrival Date:</label>
                    <input type="date" id="tentativeDate" required min={new Date().toISOString().split("T")[0]} />
                    <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '15px'}}>Assign Vehicle</button>
                </form>
            </div>
        </div>
    );
};

const ReviewModal = ({ show, onClose, onSubmit, data, setData, productName }) => {
    if (!show) return null;
    return (
        <div id="reviewModal" className="modal" style={{ display: 'block' }} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3 id="reviewModalTitle">Review: {productName}</h3>
                <form id="reviewForm" onSubmit={onSubmit}>
                    <label>Product Quality *</label>
                    <select id="reviewQuality" value={data.quality} onChange={(e) => setData(prev => ({ ...prev, quality: e.target.value }))} required>
                        <option value="">-- Select Quality --</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Average">Average</option>
                        <option value="Poor">Poor</option>
                    </select>
                    <label>Comments *</label>
                    <textarea id="reviewComments" value={data.comments} onChange={(e) => setData(prev => ({ ...prev, comments: e.target.value }))} placeholder="Describe product quality..." required rows="4"></textarea>
                    <label>Rating (1-5) *</label>
                    <input type="number" id="reviewRating" value={data.rating} onChange={(e) => setData(prev => ({ ...prev, rating: e.target.value }))} min="1" max="5" required />
                    <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '15px'}}>Submit Review</button>
                </form>
            </div>
        </div>
    );
};

const BidModal = ({ show, onClose, onSubmit, setBidPrice, order }) => {
    if (!show || !order) return null;
    return (
        <div id="bidModal" className="modal" style={{ display: 'block' }} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3>Place Your Bid</h3>
                <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <p><strong>Product:</strong> <span id="bidProductName">{order.varietySpecies}</span></p>
                    <p><strong>Original Price:</strong> <span id="bidOriginalPrice">₹{order.targetPrice} per {order.unitOfSale}</span></p>
                </div>
                <form id="bidForm" onSubmit={onSubmit}>
                    <label>Your Bid Price (per <span id="bidUnitOfSale">{order.unitOfSale}</span>) *</label>
                    <input type="number" id="bidPrice" step="0.01" placeholder="Enter your bid price" onChange={(e) => setBidPrice(e.target.value)} required />
                    <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '15px'}}>Submit Bid</button>
                </form>
            </div>
        </div>
    );
};

const ReceiptModal = ({ show, onClose, order, user }) => {
    if (!show || !order || !user) return null;
    return (
        <div id="receiptModal" className="modal" style={{ display: 'block' }} onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <div id="receiptContent">
                     <div style={{textAlign: 'center', borderBottom: '2px solid #1f2937', paddingBottom: '20px', marginBottom: '20px'}}>
                        <h2 style={{margin: 0, color: '#1f2937'}}>ORDER RECEIPT</h2>
                        <p style={{margin: '5px 0', color: '#6b7280'}}>AgroChain Platform</p>
                    </div>
                    <p><strong>Receipt Number:</strong> {order.receiptNumber}</p>
                    <p><strong>Date:</strong> {new Date(order.receiptDate || Date.now()).toLocaleDateString()}</p>
                    
                    <div style={{border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', marginBottom: '20px'}}>
                        <h3 style={{marginTop: 0}}>Product Details</h3>
                        <p><strong>Product:</strong> {order.varietySpecies}</p>
                        <p><strong>Quantity:</strong> {order.quantity} {order.unitOfSale}</p>
                        <p><strong>Agreed Price:</strong> ₹{order.bidPrice} per {order.unitOfSale}</p>
                        <p style={{fontSize: '18px', fontWeight: 'bold'}}><strong>Total Amount:</strong> ₹{(order.bidPrice * order.quantity).toFixed(2)}</p>
                    </div>
                    
                    <div style={{border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', marginBottom: '20px'}}>
                        <h3 style={{marginTop: 0}}>Farmer Details</h3>
                        <p><strong>Name:</strong> {order.farmerName}</p>
                        <p><strong>Email:</strong> {order.farmerEmail}</p>
                        <p><strong>Mobile:</strong> {order.farmerMobile}</p>
                    </div>

                    <div style={{border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px'}}>
                        <h3 style={{marginTop: 0}}>Dealer Details</h3>
                        <p><strong>Name:</strong> {user.businessName || user.firstName}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Mobile:</strong> {user.mobile}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button className="btn-primary" onClick={() => window.print()}>🖨️ Print Receipt</button>
                    <button className="btn-secondary" onClick={onClose} style={{ marginLeft: '10px' }}>Close</button>
                </div>
            </div>
        </div>
    );
};

// This is the shared "View All Reviews" modal
const ViewReviewsModal = ({ show, onClose, product, allProducts, inventory }) => {
    if (!show) return null;

    // Find the product from the correct list
    let fullProduct = null;
    if (product?.farmerName) { // It's an inventory item
        fullProduct = inventory.find(p => p._id === product._id);
    } else { // It's a browse-product item
        fullProduct = allProducts.find(p => p._id === product._id);
    }
    
    const reviews = fullProduct?.retailerReviews || fullProduct?.reviews || [];

    return (
        <div id="viewReviewsModal" className="modal" style={{ display: 'block', zIndex: 3000 }} onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3 style={{textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
                    Reviews for {fullProduct?.productName || fullProduct?.varietySpecies}
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
                                <span><strong>By:</strong> {review.retailerEmail || review.dealerEmail}</span>
                                <span>{new Date(review.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DealerDashboard;