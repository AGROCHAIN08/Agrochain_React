const express = require("express");
const router = express.Router();
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
router.get("/dealer-inventory", getDealerInventories);
router.post("/place-order", placeOrder);
router.get("/orders/:email", getOrders);
router.put("/orders/:orderId", updateOrder);
router.post("/orders/:orderId/complete-payment", completePayment);
router.post("/submit-review", submitReview);

// --- 2. ADD THIS NEW ROUTE HERE ---
router.put("/profile/:email", updateRetailerProfile);

module.exports = router;