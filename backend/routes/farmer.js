// ===========================
// IN routes/farmer.js
// ===========================

const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const { 
  getFarmerProfile, updateFarmerProfile,
  addCrop, addBulkCrops,
  getCrops, updateCrop, deleteCrop,
  getFarmerOrders, getFarmerNotifications,
  acceptBid, rejectBid, markNotificationsAsRead
} = require("../controllers/farmercontroller");

// ===========================
// PROFILE ROUTES
// ===========================

/**
 * @swagger
 * /api/farmer/profile/{email}:
 *   get:
 *     summary: Get farmer profile
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *     responses:
 *       200:
 *         description: Farmer profile data
 *       404:
 *         description: Farmer not found
 */
router.get("/profile/:email", protect, authorize('farmer'), getFarmerProfile);

/**
 * @swagger
 * /api/farmer/profile/{email}:
 *   put:
 *     summary: Update farmer profile
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Raman"
 *               lastName:
 *                 type: string
 *                 example: "Kumar"
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               farmLocation:
 *                 type: string
 *                 example: "Gummidipundi, Tamil Nadu"
 *               farmSize:
 *                 type: string
 *                 example: "5 acres"
 *               cropsGrown:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Rice", "Mango"]
 *               aadhaar:
 *                 type: string
 *                 example: "1234-5678-9012"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Farmer not found
 */
router.put("/profile/:email", protect, authorize('farmer'), updateFarmerProfile);

// ===========================
// CROP/PRODUCT MANAGEMENT ROUTES
// ===========================

/**
 * @swagger
 * /api/farmer/crops/{email}:
 *   post:
 *     summary: Add a new crop for verification
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productType
 *               - varietySpecies
 *               - harvestQuantity
 *               - unitOfSale
 *               - targetPrice
 *             properties:
 *               productType:
 *                 type: string
 *                 example: "Cereal"
 *                 description: "Type of product e.g. Fruit, Vegetable, Cereal"
 *               varietySpecies:
 *                 type: string
 *                 example: "Basmati Rice"
 *                 description: "Specific variety e.g. Alphonso Mango, Basmati Rice"
 *               harvestQuantity:
 *                 type: number
 *                 example: 50
 *                 description: "Quantity available for sale"
 *               unitOfSale:
 *                 type: string
 *                 example: "kg"
 *                 description: "Unit e.g. kg, Box (20 Kg), Crate"
 *               targetPrice:
 *                 type: number
 *                 example: 1200
 *                 description: "Price per unit in rupees"
 *               availabilityStatus:
 *                 type: string
 *                 example: ""
 *                 description: "Optional availability status"
 *               harvestDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-01"
 *                 description: "Date of harvest (optional)"
 *               farmerVillage:
 *                 type: string
 *                 example: "Gummidipundi"
 *                 description: "Village/location of farm (optional)"
 *               additionalNotes:
 *                 type: string
 *                 example: "Organically grown, no pesticides used"
 *                 description: "Any extra info about the crop (optional)"
 *     responses:
 *       200:
 *         description: Product submitted for verification successfully
 *       400:
 *         description: All required fields must be provided
 *       404:
 *         description: Farmer not found
 */
router.post("/crops/:email", protect, authorize('farmer'), addCrop);

/**
 * @swagger
 * /api/farmer/crops-bulk/{email}:
 *   post:
 *     summary: Add multiple crops in bulk (all get the same batchId)
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - crops
 *             properties:
 *               harvestDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-01"
 *                 description: "Harvest date applied to all crops in this batch (optional)"
 *               farmerVillage:
 *                 type: string
 *                 example: "Gummidipundi"
 *                 description: "Village applied to all crops (optional)"
 *               additionalNotes:
 *                 type: string
 *                 example: "Fresh harvest batch"
 *                 description: "Notes applied to all crops (optional)"
 *               crops:
 *                 type: array
 *                 description: "Array of crops to add — all share one batchId"
 *                 items:
 *                   type: object
 *                   required:
 *                     - productType
 *                     - varietySpecies
 *                     - harvestQuantity
 *                     - unitOfSale
 *                     - targetPrice
 *                   properties:
 *                     productType:
 *                       type: string
 *                       example: "Fruit"
 *                     varietySpecies:
 *                       type: string
 *                       example: "Alphonso Mango"
 *                     harvestQuantity:
 *                       type: number
 *                       example: 100
 *                     unitOfSale:
 *                       type: string
 *                       example: "kg"
 *                     targetPrice:
 *                       type: number
 *                       example: 200
 *                     availabilityStatus:
 *                       type: string
 *                       example: ""
 *     responses:
 *       200:
 *         description: All crops submitted for verification
 *       400:
 *         description: Validation errors in one or more crops
 *       404:
 *         description: Farmer not found
 */
router.post("/crops-bulk/:email", protect, authorize('farmer'), addBulkCrops);

/**
 * @swagger
 * /api/farmer/crops/{email}:
 *   get:
 *     summary: Get all crops for a farmer (sorted newest first)
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *     responses:
 *       200:
 *         description: Array of crops sorted by dateAdded descending
 *       404:
 *         description: Farmer not found
 */
router.get("/crops/:email", protect, authorize('farmer'), getCrops);

/**
 * @swagger
 * /api/farmer/crops/{email}/{id}:
 *   put:
 *     summary: Update a specific crop (only allowed if status is pending or rejected)
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Crop _id (get it from GET /api/farmer/crops/{email} response)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productType:
 *                 type: string
 *                 example: "Vegetable"
 *               varietySpecies:
 *                 type: string
 *                 example: "Tomato"
 *               harvestQuantity:
 *                 type: number
 *                 example: 30
 *               unitOfSale:
 *                 type: string
 *                 example: "kg"
 *               targetPrice:
 *                 type: number
 *                 example: 800
 *               availabilityStatus:
 *                 type: string
 *                 example: "Available"
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       403:
 *         description: Cannot edit — product already claimed for verification
 *       404:
 *         description: Farmer or crop not found
 */
router.put("/crops/:email/:id", protect, authorize('farmer'), updateCrop);

/**
 * @swagger
 * /api/farmer/crops/{email}/{id}:
 *   delete:
 *     summary: Delete a specific crop (only pending or rejected crops can be deleted)
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Crop _id (get it from GET /api/farmer/crops/{email} response)
 *       - in: query
 *         name: force
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Pass force=true to delete even if crop is under verification (admin use)
 *     responses:
 *       200:
 *         description: Crop deleted successfully
 *       403:
 *         description: Cannot delete — product is under verification or approved
 *       404:
 *         description: Farmer or crop not found
 */
router.delete("/crops/:email/:id", protect, authorize('farmer'), deleteCrop);

// ===========================
// ORDER AND NOTIFICATION ROUTES
// ===========================

/**
 * @swagger
 * /api/farmer/orders/{email}:
 *   get:
 *     summary: Get all orders for a farmer (with dealer, vehicle and product details)
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *     responses:
 *       200:
 *         description: Array of orders with dealerDetails, vehicleDetails, productDetails
 *       404:
 *         description: Farmer not found
 */
router.get("/orders/:email", protect, authorize('farmer'), getFarmerOrders);

/**
 * @swagger
 * /api/farmer/notifications/{email}:
 *   get:
 *     summary: Get all notifications for a farmer (sorted newest first)
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *     responses:
 *       200:
 *         description: Array of notifications with id, title, message, read status, dealerDetails, productDetails
 *       404:
 *         description: Farmer not found
 */
router.get("/notifications/:email", protect, authorize('farmer'), getFarmerNotifications);

/**
 * @swagger
 * /api/farmer/notifications/{email}/mark-read:
 *   post:
 *     summary: Mark all unread notifications as read
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *     responses:
 *       200:
 *         description: Notifications marked as read — returns updated count
 *       404:
 *         description: Farmer not found
 */
router.post("/notifications/:email/mark-read", protect, authorize('farmer'), markNotificationsAsRead);

/**
 * @swagger
 * /api/farmer/accept-bid/{email}:
 *   post:
 *     summary: Accept a dealer's bid (triggers receipt generation and Stripe payment request)
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "664f1a2b3c4d5e6f7a8b9c0d"
 *                 description: "Order _id from GET /api/farmer/orders/{email} response"
 *     responses:
 *       200:
 *         description: Bid accepted — dealer notified to complete Stripe payment
 *       400:
 *         description: Bid already processed
 *       404:
 *         description: Order or dealer not found
 */
router.post("/accept-bid/:email", protect, authorize('farmer'), acceptBid);

/**
 * @swagger
 * /api/farmer/reject-bid/{email}:
 *   post:
 *     summary: Reject a dealer's bid (vehicle freed, crop set back to Available)
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer's email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "664f1a2b3c4d5e6f7a8b9c0d"
 *                 description: "Order _id from GET /api/farmer/orders/{email} response"
 *     responses:
 *       200:
 *         description: Bid rejected — dealer notified, vehicle freed
 *       400:
 *         description: Bid already processed
 *       403:
 *         description: Unauthorized — this order does not belong to this farmer
 *       404:
 *         description: Order not found
 */
router.post("/reject-bid/:email", protect, authorize('farmer'), rejectBid);

module.exports = router;