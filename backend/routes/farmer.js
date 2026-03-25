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
 *     responses:
 *       200:
 *         description: Farmer profile data
 *       404:
 *         description: Farmer not found
 */
router.get("/profile/:email",protect,authorize('farmer'), getFarmerProfile);

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               farmSize:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       404:
 *         description: Farmer not found
 */
router.put("/profile/:email", protect,authorize('farmer'),updateFarmerProfile);

// ===========================
// CROP/PRODUCT MANAGEMENT ROUTES
// ===========================

/**
 * @swagger
 * /api/farmer/crops/{email}:
 *   post:
 *     summary: Add a new crop
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cropName, quantity, price]
 *             properties:
 *               cropName:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *               unit:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Crop added successfully
 *       400:
 *         description: Validation error
 */
router.post("/crops/:email", protect, authorize('farmer'), addCrop);

/**
 * @swagger
 * /api/farmer/crops-bulk/{email}:
 *   post:
 *     summary: Add multiple crops in bulk
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [crops]
 *             properties:
 *               crops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cropName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *     responses:
 *       201:
 *         description: Crops added successfully
 *       400:
 *         description: Validation error
 */
router.post("/crops-bulk/:email", protect, authorize('farmer'), addBulkCrops);

/**
 * @swagger
 * /api/farmer/crops/{email}:
 *   get:
 *     summary: Get all crops for a farmer
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of crops
 */
router.get("/crops/:email", protect,authorize('farmer'),getCrops);

/**
 * @swagger
 * /api/farmer/crops/{email}/{id}:
 *   put:
 *     summary: Update a specific crop
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Crop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cropName:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Crop updated
 *       404:
 *         description: Crop not found
 */
router.put("/crops/:email/:id", protect, authorize('farmer'), updateCrop);

/**
 * @swagger
 * /api/farmer/crops/{email}/{id}:
 *   delete:
 *     summary: Delete a specific crop
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Crop ID
 *     responses:
 *       200:
 *         description: Crop deleted
 *       404:
 *         description: Crop not found
 */
router.delete("/crops/:email/:id",protect,authorize('farmer'), deleteCrop);

// ===========================
// ORDER AND NOTIFICATION ROUTES
// ===========================

/**
 * @swagger
 * /api/farmer/orders/{email}:
 *   get:
 *     summary: Get farmer's orders
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of orders
 */
router.get("/orders/:email",protect,authorize('farmer'), getFarmerOrders);

/**
 * @swagger
 * /api/farmer/notifications/{email}:
 *   get:
 *     summary: Get farmer's notifications
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of notifications
 */
router.get("/notifications/:email",protect, authorize('farmer'),getFarmerNotifications);

/**
 * @swagger
 * /api/farmer/notifications/{email}/mark-read:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */
router.post("/notifications/:email/mark-read", protect,authorize('farmer'),markNotificationsAsRead);

/**
 * @swagger
 * /api/farmer/accept-bid/{email}:
 *   post:
 *     summary: Accept a dealer's bid
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bidId]
 *             properties:
 *               bidId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bid accepted
 *       404:
 *         description: Bid not found
 */
router.post("/accept-bid/:email",protect,authorize('farmer'), acceptBid);

/**
 * @swagger
 * /api/farmer/reject-bid/{email}:
 *   post:
 *     summary: Reject a dealer's bid
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bidId]
 *             properties:
 *               bidId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bid rejected
 *       404:
 *         description: Bid not found
 */
router.post("/reject-bid/:email",protect,authorize('farmer'), rejectBid);

module.exports = router;