const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { 
  getDealerInventories, 
  placeOrder, 
  getOrders, 
  updateOrder, 
  completePayment,
  submitReview,
  updateRetailerProfile // <--- 1. IMPORT THE NEW FUNCTION HERE
} = require("../controllers/retailercontroller");

// ... [Your existing routes] ...
router.get("/dealer-inventory", protect,authorize('retailer'),getDealerInventories);
router.post("/place-order", protect,authorize('retailer'),placeOrder);
router.get("/orders/:email",protect,authorize('retailer'), getOrders);
router.put("/orders/:orderId",protect,authorize('retailer'), updateOrder);
router.post("/orders/:orderId/complete-payment",protect,authorize('retailer'), completePayment);
router.post("/submit-review",protect,authorize('retailer'), submitReview);

// --- 2. ADD THIS NEW ROUTE HERE ---
router.put("/profile/:email",protect,authorize('retailer'), updateRetailerProfile);

module.exports = router;