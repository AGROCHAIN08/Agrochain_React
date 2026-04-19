const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const retailerController = require("../controllers/retailercontroller");
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   productId:
 *                     type: string
 *                   productName:
 *                     type: string
 *                   quantity:
 *                     type: number
 *                   unitPrice:
 *                     type: number
 *                   dealerName:
 *                     type: string
 *                   dealerEmail:
 *                     type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not a retailer
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
 *             required: [retailerEmail, cartItems]
 *             properties:
 *               retailerEmail:
 *                 type: string
 *                 format: email
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [_id, productName, quantity, unitPrice, dealerEmail]
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Dealer inventory item ID
 *                     productName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *                     dealerEmail:
 *                       type: string
 *                       format: email
 *     responses:
 *       201:
 *         description: Order(s) placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Cart is empty or validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not a retailer
 *       404:
 *         description: Retailer not found
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not a retailer
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum: [Placed, Processing, Shipped, Delivered, Cancelled]
 *                 example: Processing
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *               totalAmount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *           examples:
 *             statusUpdate:
 *               summary: Update only order status
 *               value:
 *                 orderStatus: Processing
 *             prePaymentEdit:
 *               summary: Update products before payment
 *               value:
 *                 products:
 *                   - productId: 66f000000000000000000001
 *                     productName: Basmati Rice
 *                     quantity: 2
 *                     unitPrice: 120
 *                 totalAmount: 240
 *                 paymentMethod: Stripe
 *     responses:
 *       200:
 *         description: Order updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 order:
 *                   type: object
 *       400:
 *         description: Invalid status, products, or total amount
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not a retailer
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *               totalAmount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *           examples:
 *             existingOrder:
 *               summary: Pay the existing order without changing quantities
 *               value: {}
 *             editedOrder:
 *               summary: Pay after editing product quantities
 *               value:
 *                 products:
 *                   - productId: 66f000000000000000000001
 *                     productName: Basmati Rice
 *                     quantity: 2
 *                     unitPrice: 120
 *                 totalAmount: 240
 *                 paymentMethod: Stripe
 *     responses:
 *       200:
 *         description: Stripe checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 url:
 *                   type: string
 *                 publishableKey:
 *                   type: string
 *       400:
 *         description: Invalid request body or payment already completed
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not a retailer
 *       404:
 *         description: Order not found
 *       500:
 *         description: Stripe or frontend URL configuration error
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
 *             required: [orderId, quality, comments, rating]
 *             properties:
 *               orderId:
 *                 type: string
 *               retailerEmail:
 *                 type: string
 *                 format: email
 *                 description: Optional. If omitted, the email from the JWT token is used.
 *               quality:
 *                 type: string
 *                 enum: [Excellent, Good, Average, Poor]
 *               comments:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *           examples:
 *             review:
 *               summary: Submit a review for a completed order
 *               value:
 *                 orderId: 68ea67d77e3861d4c522d729
 *                 quality: Good
 *                 comments: Fresh product and timely delivery
 *                 rating: 4
 *     responses:
 *       200:
 *         description: Review submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 review:
 *                   type: object
 *                 itemsReviewed:
 *                   type: number
 *                 note:
 *                   type: string
 *       400:
 *         description: Validation error, incomplete payment, or review already submitted
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not a retailer or not authorized for this order
 *       404:
 *         description: Order or dealer not found
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               mobile:
 *                 type: string
 *               shopName:
 *                 type: string
 *               shopType:
 *                 type: string
 *               shopAddress:
 *                 type: string
 *               monthlyPurchaseVolume:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not a retailer
 *       404:
 *         description: Retailer not found
 */
router.put("/profile/:email",protect,authorize('retailer'), updateRetailerProfile);

/**
 * @swagger
 * /api/retailer/products:
 *   get:
 *     summary: Get all available products from dealers (Redis Cached)
 *     tags: [Retailer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched available products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 source:
 *                   type: string
 *                   example: Redis Cache
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not a retailer
 *       500:
 *         description: Server error
 */
router.get("/products", protect, authorize('retailer'), retailerController.getAvailableProducts);

module.exports = router;
