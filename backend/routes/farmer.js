// ===========================
// IN routes/farmer.js
// ===========================

const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const { 
  getFarmerProfile, 
  updateFarmerProfile, 
  addCrop, 
  getCrops, 
  updateCrop,
  deleteCrop,
  getFarmerOrders,
  getFarmerNotifications,
  acceptBid, 
  rejectBid,
  markNotificationsAsRead  // ADD THIS
} = require("../controllers/farmercontroller");

// ===========================
// PROFILE ROUTES
// ===========================
router.get("/profile/:email",protect,authorize('farmer'), getFarmerProfile);
router.put("/profile/:email", protect,authorize('farmer'),updateFarmerProfile);

// ===========================
// CROP/PRODUCT MANAGEMENT ROUTES
// ===========================
router.post("/crops/:email",protect, authorize('farmer'),upload.single("image"), addCrop);
router.get("/crops/:email", protect,authorize('farmer'),getCrops);
router.put("/crops/:email/:id",protect, authorize('farmer'),upload.single("image"), updateCrop);
router.delete("/crops/:email/:id",protect,authorize('farmer'), deleteCrop);

// ===========================
// ORDER AND NOTIFICATION ROUTES
// ===========================
router.get("/orders/:email",protect,authorize('farmer'), getFarmerOrders);
router.get("/notifications/:email",protect, authorize('farmer'),getFarmerNotifications);
router.post("/notifications/:email/mark-read", protect,authorize('farmer'),markNotificationsAsRead);  // ADD THIS LINE

router.post("/accept-bid/:email",protect,authorize('farmer'), acceptBid);
router.post("/reject-bid/:email",protect,authorize('farmer'), rejectBid);

module.exports = router;