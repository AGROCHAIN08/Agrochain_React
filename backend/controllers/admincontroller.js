const User = require("../models/user");
const Order = require("../models/order");
const RetailerOrder = require("../models/retailerOrder");
const Log = require("../models/log");
const Representative = require("../models/representative");
const redisClient = require("../config/redis");

/* ===============================
   1. ENHANCED SYSTEM ANALYTICS
   =============================== */
exports.getStats = async (req, res) => {
  try {
    const cacheKey = "admin_stats";
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    // Count users by role
    const farmers = await User.countDocuments({ role: "farmer" });
    const dealers = await User.countDocuments({ role: "dealer" });
    const retailers = await User.countDocuments({ role: "retailer" });
    const totalUsers = farmers + dealers + retailers;

    // Compute total products from farmer crops
    const allFarmers = await User.find({ role: "farmer" });
    let totalProducts = 0;
    allFarmers.forEach(f => {
      if (Array.isArray(f.crops)) totalProducts += f.crops.length;
    });

    // Compute orders and revenue
    let orders = 0;
    let totalAmount = 0;
    let farmerDealerOrderCount = 0;

    try {
      farmerDealerOrderCount = await Order.countDocuments();
      const dealerRetailerOrders = await RetailerOrder.countDocuments();
      orders = farmerDealerOrderCount + dealerRetailerOrders;

      const orderSum = await Order.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
      const retailerOrderSum = await RetailerOrder.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
      totalAmount = (orderSum[0]?.total || 0) + (retailerOrderSum[0]?.total || 0);
    } catch (err) {
      console.error("Error calculating orders:", err);
    }

    // Additional analytics
    const activeUsers = totalUsers;

    // Pending orders
    let pendingOrders = 0;
    try {
      pendingOrders = await Order.countDocuments({
        status: { $in: ['Vehicle Assigned', 'Bid Placed'] }
      });
      const pendingRetailerOrders = await RetailerOrder.countDocuments({
        'paymentDetails.status': 'Pending'
      });
      pendingOrders += pendingRetailerOrders;
    } catch (err) {
      console.error("Error counting pending orders:", err);
    }

    // Completed orders
    let completedOrders = 0;
    try {
      completedOrders = await Order.countDocuments({ status: { $in: ['Completed', 'Bid Accepted', 'Delivered'] } });
      const completedRetailerOrders = await RetailerOrder.countDocuments({
        'paymentDetails.status': 'Completed'
      });
      completedOrders += completedRetailerOrders;
    } catch (err) {
      console.error("Error counting completed orders:", err);
    }

    // =====================
    // FINANCIAL & ORDER INSIGHTS
    // =====================

    // Average Order Value
    const avgOrderValue = orders > 0 ? Math.round(totalAmount / orders) : 0;

    // Bid Acceptance Rate
    let bidAccepted = 0, bidRejected = 0;
    try {
      bidAccepted = await Order.countDocuments({ bidStatus: 'Accepted' });
      bidRejected = await Order.countDocuments({ bidStatus: 'Rejected' });
    } catch (err) { console.error("Error counting bid stats:", err); }
    const totalBids = bidAccepted + bidRejected;
    const bidAcceptanceRate = totalBids > 0 ? Math.round((bidAccepted / totalBids) * 100) : 0;

    // Payment Pending Value
    let paymentPendingValue = 0;
    try {
      const pendingPaySum = await Order.aggregate([
        { $match: { paymentStatus: 'Pending' } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
      paymentPendingValue = pendingPaySum[0]?.total || 0;
    } catch (err) { console.error("Error fetching pending payment value:", err); }

    // Orders In Transit
    let inTransitOrders = 0;
    try {
      inTransitOrders = await Order.countDocuments({ status: 'In Transit' });
    } catch (err) { console.error("Error counting in-transit orders:", err); }

    // Cancelled Orders
    let cancelledOrders = 0;
    try {
      cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
    } catch (err) { console.error("Error counting cancelled orders:", err); }
    const cancelledRate = farmerDealerOrderCount > 0
      ? Math.round((cancelledOrders / farmerDealerOrderCount) * 100)
      : 0;

    // =====================
    // USER GROWTH & HEALTH
    // =====================
    const now = new Date();

    // New registrations today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    let newUsersToday = 0;
    try {
      newUsersToday = await User.countDocuments({ createdAt: { $gte: todayStart } });
    } catch (err) { console.error("Error counting today's users:", err); }

    // New registrations this week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    let newUsersThisWeek = 0;
    try {
      newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekStart } });
    } catch (err) { console.error("Error counting week's users:", err); }

    // Inactive users
    let inactiveUsers = 0;
    try {
      inactiveUsers = await User.countDocuments({ isActive: false });
    } catch (err) { console.error("Error counting inactive users:", err); }

    // Email verification rate
    let verifiedEmailUsers = 0;
    try {
      verifiedEmailUsers = await User.countDocuments({ emailVerified: true });
    } catch (err) { console.error("Error counting verified users:", err); }
    const emailVerificationRate = totalUsers > 0
      ? Math.round((verifiedEmailUsers / totalUsers) * 100)
      : 0;

    // Google Auth users
    let googleAuthUsers = 0;
    try {
      googleAuthUsers = await User.countDocuments({ googleAuth: true });
    } catch (err) { console.error("Error counting google auth users:", err); }

    // Monthly revenue (last 6 months)
    const monthlyRevenue = await getMonthlyRevenue();

    // Orders by status
    const ordersByStatus = await getOrdersByStatus();

    // Top products
    const topProducts = await getTopProducts(allFarmers);

    const statsData = {
      // Core stats
      farmers,
      dealers,
      retailers,
      products: totalProducts,
      orders,
      totalAmount,
      activeUsers,
      pendingOrders,
      completedOrders,
      monthlyRevenue,
      ordersByStatus,
      topProducts,
      // Financial & Order Insights
      avgOrderValue,
      bidAcceptanceRate,
      bidAccepted,
      bidRejected,
      paymentPendingValue,
      inTransitOrders,
      cancelledOrders,
      cancelledRate,
      // User Growth & Health
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      inactiveUsers,
      emailVerificationRate,
      verifiedEmailUsers,
      googleAuthUsers,
    };
    if (redisClient.isReady) await redisClient.setEx(cacheKey, 300, JSON.stringify(statsData));
    res.json(statsData);
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ msg: "Error fetching analytics" });
  }
};

// Helper function to get monthly revenue
async function getMonthlyRevenue() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await Order.aggregate([
      {
        $match: {
          assignedDate: { $gte: sixMonthsAgo },
          status: 'Bid Accepted'
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$assignedDate" },
            month: { $month: "$assignedDate" }
          },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    const retailerMonthlyData = await RetailerOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          'paymentDetails.status': 'Completed'
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Combine and format data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const combined = {};
    
    monthlyData.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      combined[key] = (combined[key] || 0) + item.revenue;
    });
    
    retailerMonthlyData.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      combined[key] = (combined[key] || 0) + item.revenue;
    });
    
    return Object.keys(combined).map(key => {
      const [year, month] = key.split('-');
      return {
        month: months[parseInt(month) - 1],
        revenue: combined[key]
      };
    });
  } catch (err) {
    console.error("Error getting monthly revenue:", err);
    return [];
  }
}

// Helper function to get orders by status
async function getOrdersByStatus() {
  try {
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    return statusCounts.map(item => ({
      name: item._id,
      count: item.count
    }));
  } catch (err) {
    console.error("Error getting orders by status:", err);
    return [];
  }
}

// Helper function to get top products
function getTopProducts(farmers) {
  const productCategories = {};
  
  farmers.forEach(farmer => {
    if (farmer.crops && Array.isArray(farmer.crops)) {
      farmer.crops.forEach(crop => {
        const category = crop.productType;
        productCategories[category] = (productCategories[category] || 0) + 1;
      });
    }
  });
  
  return Object.entries(productCategories)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/* ===============================
   2. CORE MONITORING & CONTROL
   =============================== */

exports.getUsers = async (req, res) => {
  try {
    const cacheKey = "admin_users";
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    const users = await User.find(
      {},
      "firstName lastName email role mobile isActive createdAt updatedAt"
    ).sort({ role: 1, createdAt: -1 });
    
    if (redisClient.isReady) await redisClient.setEx(cacheKey, 60, JSON.stringify(users));
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ msg: "Error fetching users" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // Log the deletion
    await createLog(user.email, "deleteUser", `Admin deleted user: ${user.email}`);
    
    if (redisClient.isReady) await redisClient.del("admin_users");
    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ msg: "Error deleting user" });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // Toggle active status
    user.isActive = user.isActive === false ? true : false;
    await user.save();
    
    // Log the action
    const action = user.isActive ? "activated" : "deactivated";
    await createLog(user.email, "updateProfile", `Admin ${action} user: ${user.email}`);
    
    if (redisClient.isReady) await redisClient.del("admin_users");
    res.json({ 

      msg: `User ${action} successfully`,
      isActive: user.isActive
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ msg: "Error updating user status" });
  }
};

/* ===============================
   3. ACTIVITY LOGS
   =============================== */
exports.getLogs = async (req, res) => {
  try {
    const { user, date, action } = req.query;
    const query = {};
    
    if (user) {
      query.userEmail = { $regex: new RegExp(user, "i") };
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.timestamp = { $gte: startDate, $lt: endDate };
    }
    
    if (action) {
      query.actionType = action;
    }

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(500);
    
    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ msg: "Error fetching activity logs" });
  }
};

const ACTION_TYPE_LABELS = {
  account: "Account",
  listing: "Listings",
  verification: "Verification",
  order: "Orders",
  payment: "Payments",
  vehicle: "Vehicles",
  inventory: "Inventory",
  review: "Reviews",
  admin: "Admin",
  other: "Other",
};

function pushActivity(activities, activity) {
  if (!activity?.timestamp) return;
  const timestamp = new Date(activity.timestamp);
  if (Number.isNaN(timestamp.getTime())) return;

  activities.push({
    type: activity.type || "other",
    title: activity.title || "Activity",
    details: activity.details || "",
    timestamp,
    source: activity.source || "system",
  });
}

function deriveActivitiesFromUserDocument(user, activities) {
  pushActivity(activities, {
    type: "account",
    title: "Account created",
    details: `${user.role} account created for ${user.email}`,
    timestamp: user.createdAt,
    source: "user",
  });

  if (user.role === "farmer") {
    (user.crops || []).forEach((crop) => {
      pushActivity(activities, {
        type: "listing",
        title: "Product submitted",
        details: `${crop.varietySpecies} submitted for verification`,
        timestamp: crop.dateAdded,
        source: "crop",
      });

      if (crop.claimedAt) {
        pushActivity(activities, {
          type: "verification",
          title: "Verification claimed",
          details: `${crop.varietySpecies} claimed by ${crop.claimedByName || crop.claimedBy || "representative"}`,
          timestamp: crop.claimedAt,
          source: "crop",
        });
      }

      if ((crop.verificationStatus || crop.approvalStatus) === "approved") {
        pushActivity(activities, {
          type: "verification",
          title: "Listing approved and published",
          details: `${crop.varietySpecies} approved and made visible to dealers`,
          timestamp: crop.qualityReport?.inspectedAt || crop.lastUpdated,
          source: "crop",
        });
      }

      if ((crop.verificationStatus || crop.approvalStatus) === "rejected") {
        pushActivity(activities, {
          type: "verification",
          title: "Listing rejected",
          details: `${crop.varietySpecies} was rejected during verification`,
          timestamp: crop.lastUpdated,
          source: "crop",
        });
      }

      (crop.reviews || []).forEach((review) => {
        pushActivity(activities, {
          type: "review",
          title: "Dealer review received",
          details: `${crop.varietySpecies} reviewed as ${review.quality} by ${review.dealerEmail}`,
          timestamp: review.date,
          source: "review",
        });
      });
    });
  }

  if (user.role === "dealer") {
    (user.vehicles || []).forEach((vehicle) => {
      pushActivity(activities, {
        type: "vehicle",
        title: "Vehicle added",
        details: `${vehicle.vehicleType} added with ID ${vehicle.vehicleId}`,
        timestamp: vehicle.dateAdded,
        source: "vehicle",
      });
    });

    (user.inventory || []).forEach((item) => {
      pushActivity(activities, {
        type: "inventory",
        title: "Inventory item added",
        details: `${item.productName} added to inventory`,
        timestamp: item.addedDate,
        source: "inventory",
      });

      (item.retailerReviews || []).forEach((review) => {
        pushActivity(activities, {
          type: "review",
          title: "Retailer review received",
          details: `${item.productName} reviewed as ${review.quality} by ${review.retailerEmail}`,
          timestamp: review.date,
          source: "review",
        });
      });
    });
  }
}

function deriveActivitiesFromOrders(user, orders, retailerOrders, activities) {
  if (user.role === "farmer") {
    orders.forEach((order) => {
      pushActivity(activities, {
        type: "order",
        title: "Vehicle assigned",
        details: `Order for product ${order.productId} assigned to dealer ${order.dealerEmail}`,
        timestamp: order.assignedDate || order.createdAt,
        source: "order",
      });

      if (order.bidDate) {
        pushActivity(activities, {
          type: "order",
          title: "Bid received",
          details: `Bid placed by ${order.dealerEmail} for order ${order._id}`,
          timestamp: order.bidDate,
          source: "order",
        });
      }

      if (order.bidResponseDate && order.bidStatus) {
        pushActivity(activities, {
          type: "order",
          title: `Bid ${order.bidStatus.toLowerCase()}`,
          details: `Bid for order ${order._id} was ${order.bidStatus.toLowerCase()}`,
          timestamp: order.bidResponseDate,
          source: "order",
        });
      }

      if (order.deliveryDate) {
        pushActivity(activities, {
          type: "order",
          title: "Order delivered",
          details: `Order ${order._id} delivered to dealer ${order.dealerEmail}`,
          timestamp: order.deliveryDate,
          source: "order",
        });
      }

      if (order.paymentStatus === "Completed") {
        pushActivity(activities, {
          type: "payment",
          title: "Payment completed",
          details: `Payment completed for order ${order._id}`,
          timestamp: order.updatedAt || order.deliveryDate || order.receiptGeneratedAt,
          source: "order",
        });
      }
    });
  }

  if (user.role === "dealer") {
    orders.forEach((order) => {
      pushActivity(activities, {
        type: "order",
        title: "Crop order created",
        details: `Order created with farmer ${order.farmerEmail} for product ${order.productId}`,
        timestamp: order.assignedDate || order.createdAt,
        source: "order",
      });

      if (order.bidDate) {
        pushActivity(activities, {
          type: "order",
          title: "Bid placed",
          details: `Placed bid for order ${order._id}`,
          timestamp: order.bidDate,
          source: "order",
        });
      }

      if (order.bidResponseDate && order.bidStatus) {
        pushActivity(activities, {
          type: "order",
          title: `Bid ${order.bidStatus.toLowerCase()} by farmer`,
          details: `Farmer ${order.farmerEmail} ${order.bidStatus.toLowerCase()} bid on order ${order._id}`,
          timestamp: order.bidResponseDate,
          source: "order",
        });
      }

      if (order.receiptGeneratedAt) {
        pushActivity(activities, {
          type: "order",
          title: "Receipt generated",
          details: `Receipt ${order.receiptNumber || ""} generated for order ${order._id}`.trim(),
          timestamp: order.receiptGeneratedAt,
          source: "order",
        });
      }

      if (order.paymentStatus === "Completed") {
        pushActivity(activities, {
          type: "payment",
          title: "Payment completed",
          details: `Completed payment for farmer order ${order._id}`,
          timestamp: order.updatedAt || order.receiptGeneratedAt,
          source: "order",
        });
      }
    });

    retailerOrders.forEach((order) => {
      pushActivity(activities, {
        type: "order",
        title: "Retailer order received",
        details: `Received retailer order from ${order.retailerEmail}`,
        timestamp: order.createdAt,
        source: "retailer-order",
      });

      if (order.paymentDetails?.status === "Completed") {
        pushActivity(activities, {
          type: "payment",
          title: "Retailer payment completed",
          details: `Retailer payment completed for order ${order._id}`,
          timestamp: order.updatedAt || order.createdAt,
          source: "retailer-order",
        });
      }

      if (order.reviewSubmitted && order.review?.date) {
        pushActivity(activities, {
          type: "review",
          title: "Retailer review submitted",
          details: `Retailer ${order.retailerEmail} reviewed order ${order._id}`,
          timestamp: order.review.date,
          source: "retailer-order",
        });
      }
    });
  }

  if (user.role === "retailer") {
    retailerOrders.forEach((order) => {
      pushActivity(activities, {
        type: "order",
        title: "Order placed",
        details: `Placed order with dealer ${order.dealerInfo?.email}`,
        timestamp: order.createdAt,
        source: "retailer-order",
      });

      if (order.paymentDetails?.status === "Completed") {
        pushActivity(activities, {
          type: "payment",
          title: "Payment completed",
          details: `Payment completed for retailer order ${order._id}`,
          timestamp: order.updatedAt || order.createdAt,
          source: "retailer-order",
        });
      }

      if (order.reviewSubmitted && order.review?.date) {
        pushActivity(activities, {
          type: "review",
          title: "Review submitted",
          details: `Submitted review for order ${order._id}`,
          timestamp: order.review.date,
          source: "retailer-order",
        });
      }
    });
  }
}

exports.getUserActivityTimeline = async (req, res) => {
  try {
    const { email } = req.params;
    const { type = "all", q = "", from = "", to = "" } = req.query;

    const user = await User.findOne(
      { email },
      "firstName lastName email role mobile isActive createdAt updatedAt crops vehicles inventory"
    ).lean();

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const [logs, orders, retailerOrders] = await Promise.all([
      Log.find({ userEmail: email }).sort({ timestamp: -1 }).lean(),
      Order.find({
        $or: [{ farmerEmail: email }, { dealerEmail: email }],
      }).sort({ createdAt: -1 }).lean(),
      RetailerOrder.find({
        $or: [{ retailerEmail: email }, { "dealerInfo.email": email }],
      }).sort({ createdAt: -1 }).lean(),
    ]);

    const activities = [];

    deriveActivitiesFromUserDocument(user, activities);
    deriveActivitiesFromOrders(user, orders, retailerOrders, activities);

    logs.forEach((log) => {
      pushActivity(activities, {
        type:
          log.actionType === "login"
            ? "account"
            : log.actionType === "addProduct"
              ? "listing"
              : log.actionType === "orderPlaced"
                ? "order"
                : log.actionType === "updateProfile"
                  ? "admin"
                  : log.actionType === "deleteUser"
                    ? "admin"
                    : "other",
        title: log.actionType === "login" ? "Login recorded" : log.actionType,
        details: log.details,
        timestamp: log.timestamp,
        source: "log",
      });
    });

    const normalizedQuery = q.trim().toLowerCase();
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (toDate && !Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
    }

    const filteredActivities = activities
      .filter((activity) => {
        const matchesType = type === "all" || activity.type === type;
        const matchesQuery =
          !normalizedQuery ||
          activity.title.toLowerCase().includes(normalizedQuery) ||
          activity.details.toLowerCase().includes(normalizedQuery) ||
          activity.source.toLowerCase().includes(normalizedQuery);
        const matchesFrom = !fromDate || activity.timestamp >= fromDate;
        const matchesTo = !toDate || activity.timestamp <= toDate;

        return matchesType && matchesQuery && matchesFrom && matchesTo;
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((activity) => ({
        ...activity,
        timestamp: activity.timestamp.toISOString(),
      }));

    res.json({
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      availableTypes: Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
      totalActivities: filteredActivities.length,
      latestActivityAt: filteredActivities[0]?.timestamp || null,
      activities: filteredActivities,
    });
  } catch (err) {
    console.error("Error fetching user activity timeline:", err);
    res.status(500).json({ msg: "Error fetching user activity timeline" });
  }
};

// Helper to create new logs (exported for use in other controllers)
async function createLog(userEmail, actionType, details) {
  try {
    const log = new Log({ 
      userEmail, 
      actionType, 
      details, 
      timestamp: new Date() 
    });
    await log.save();
  } catch (err) {
    console.error("Failed to create log:", err);
  }
}

exports.createLog = createLog;

/* ===============================
   4. ADDITIONAL ANALYTICS ENDPOINTS
   =============================== */

// Get user growth over time
exports.getUserGrowth = async (req, res) => {
  try {
    const cacheKey = "admin_growth";
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const growth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            role: "$role"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    if (redisClient.isReady) await redisClient.setEx(cacheKey, 300, JSON.stringify(growth));
    res.json(growth);
  } catch (err) {
    console.error("Error fetching user growth:", err);
    res.status(500).json({ msg: "Error fetching user growth" });
  }
};

// Get platform activity summary
exports.getActivitySummary = async (req, res) => {
  try {
    const cacheKey = "admin_activity";
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = await Log.countDocuments({
      timestamp: { $gte: today }
    });
    
    const todayOrders = await Order.countDocuments({
      assignedDate: { $gte: today }
    });
    
    const todayRetailerOrders = await RetailerOrder.countDocuments({
      createdAt: { $gte: today }
    });
    
    const activeUsersToday = await Log.distinct('userEmail', {
      timestamp: { $gte: today }
    });
    
    const summaryData = {
      todayLogs,
      todayOrders: todayOrders + todayRetailerOrders,
      activeUsersToday: activeUsersToday.length
    };
    if (redisClient.isReady) await redisClient.setEx(cacheKey, 300, JSON.stringify(summaryData));
    res.json(summaryData);
  } catch (err) {
    console.error("Error fetching activity summary:", err);
    res.status(500).json({ msg: "Error fetching activity summary" });
  }
};


// ===============================
// 5. PRODUCT MODERATION
// ===============================

exports.getAllProducts = async (req, res) => {
  try {
    const cacheKey = "admin_all_products";
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    // Fetch only farmers with their crops + basic info
    const farmers = await User.find(
      { role: "farmer" },
      "firstName lastName email mobile crops"
    );

    const products = [];

    farmers.forEach((farmer) => {
      if (Array.isArray(farmer.crops)) {
        farmer.crops.forEach((crop) => {
          products.push({
            cropId: crop._id,
            varietySpecies: crop.varietySpecies,
            productType: crop.productType,
            harvestQuantity: crop.harvestQuantity,
            unitOfSale: crop.unitOfSale,
            targetPrice: crop.targetPrice,
            imageUrl: crop.imageUrl,
            createdAt: crop.createdAt,
            farmer: {
              id: farmer._id,
              name: `${farmer.firstName} ${farmer.lastName || ""}`,
              email: farmer.email,
              mobile: farmer.mobile,
            },
          });
        });
      }
    });

    if (redisClient.isReady) await redisClient.setEx(cacheKey, 60, JSON.stringify(products));
    res.json(products);
  } catch (err) {
    console.error("Error fetching all products:", err);
    res.status(500).json({ msg: "Error fetching all products" });
  }
};

exports.adminDeleteProduct = async (req, res) => {
  try {
    const { farmerEmail, cropId } = req.params;

    const farmer = await User.findOne({ email: farmerEmail, role: "farmer" });
    if (!farmer) {
      return res.status(404).json({ msg: "Farmer not found" });
    }

    const index = farmer.crops.findIndex(
      (c) => c._id.toString() === cropId
    );
    if (index === -1) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const removed = farmer.crops[index];

    farmer.crops.splice(index, 1);
    await farmer.save();

    // audit log
    await createLog(
      farmer.email,
      "other",
      `ADMIN ACTION: Product "${removed.varietySpecies}" (${removed.productType}) deleted for farmer ${farmer.email}`
    );

    if (redisClient.isReady) await redisClient.del("admin_all_products");
    res.json({ msg: "Product deleted successfully by admin" });
  } catch (err) {
    console.error("Error deleting product as admin:", err);
    res.status(500).json({ msg: "Error deleting product" });
  }
};

/* ===============================
   6. REPRESENTATIVE MANAGEMENT
   =============================== */

// Get all authorized representative emails
exports.getRepresentatives = async (req, res) => {
  try {
    const reps = await Representative.find().sort({ createdAt: -1 });
    res.json(reps);
  } catch (err) {
    console.error("Error fetching representatives:", err);
    res.status(500).json({ msg: "Error fetching representatives" });
  }
};

// Add a new representative email
exports.addRepresentative = async (req, res) => {
  try {
    const { email, note } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if already exists
    const existing = await Representative.findOne({ email: emailLower });
    if (existing) {
      return res.status(409).json({ msg: "This email is already a registered representative" });
    }

    const rep = new Representative({
      email: emailLower,
      note: note || "",
      addedBy: req.user?.email || "admin",
    });

    await rep.save();

    await createLog(
      req.user?.email || "admin",
      "other",
      `ADMIN ACTION: Added representative email: ${emailLower}`
    );

    res.status(201).json({ msg: "Representative added successfully", representative: rep });
  } catch (err) {
    console.error("Error adding representative:", err);
    res.status(500).json({ msg: "Error adding representative" });
  }
};

// Remove a representative email by ID
exports.deleteRepresentative = async (req, res) => {
  try {
    const rep = await Representative.findByIdAndDelete(req.params.id);

    if (!rep) {
      return res.status(404).json({ msg: "Representative not found" });
    }

    await createLog(
      req.user?.email || "admin",
      "other",
      `ADMIN ACTION: Removed representative email: ${rep.email}`
    );

    res.json({ msg: "Representative removed successfully" });
  } catch (err) {
    console.error("Error deleting representative:", err);
    res.status(500).json({ msg: "Error deleting representative" });
  }
};

// Public endpoint: check if an email is an authorized representative
// Used by the login flow - does NOT require admin auth
exports.checkRepresentative = async (req, res) => {
  try {
    const { email } = req.params;
    const rep = await Representative.findOne({ email: email.toLowerCase().trim() });
    res.json({ isRepresentative: !!rep });
  } catch (err) {
    console.error("Error checking representative:", err);
    res.status(500).json({ msg: "Error checking representative status" });
  }
};

module.exports = exports;
