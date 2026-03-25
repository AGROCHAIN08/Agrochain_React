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
  updateRetailerProfile
} = require("../controllers/retailercontroller");

/**
 * @swagger
 * /api/retailer/dealer-inventory:
 *   get:
 *     summary: Browse dealer inventories
 *     tags: [Retailer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of dealer inventory items
 */
router.get("/dealer-inventory", protect,authorize('retailer'),getDealerInventories);

/**
 * @swagger
 * /api/retailer/place-order:
 *   post:
 *     summary: Place an order from dealer inventory
 *     tags: [Retailer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dealerEmail, itemId, quantity]
 *             properties:
 *               dealerEmail:
 *                 type: string
 *               itemId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Validation error
 */
router.post("/place-order", protect,authorize('retailer'),placeOrder);

/**
 * @swagger
 * /api/retailer/orders/{email}:
 *   get:
 *     summary: Get retailer's orders
 *     tags: [Retailer]
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
router.get("/orders/:email",protect,authorize('retailer'), getOrders);

/**
 * @swagger
 * /api/retailer/orders/{orderId}:
 *   put:
 *     summary: Update an order
 *     tags: [Retailer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated
 *       404:
 *         description: Order not found
 */
router.put("/orders/:orderId",protect,authorize('retailer'), updateOrder);

/**
 * @swagger
 * /api/retailer/orders/{orderId}/complete-payment:
 *   post:
 *     summary: Complete payment for an order
 *     tags: [Retailer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment completed
 *       404:
 *         description: Order not found
 */
router.post("/orders/:orderId/complete-payment",protect,authorize('retailer'), completePayment);

/**
 * @swagger
 * /api/retailer/submit-review:
 *   post:
 *     summary: Submit a review for a dealer
 *     tags: [Retailer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dealerEmail, rating, comment]
 *             properties:
 *               dealerEmail:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted
 *       400:
 *         description: Validation error
 */
router.post("/submit-review",protect,authorize('retailer'), submitReview);

/**
 * @swagger
 * /api/retailer/profile/{email}:
 *   put:
 *     summary: Update retailer profile
 *     tags: [Retailer]
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
 *               shopName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       404:
 *         description: Retailer not found
 */
router.put("/profile/:email",protect,authorize('retailer'), updateRetailerProfile);

module.exports = router;