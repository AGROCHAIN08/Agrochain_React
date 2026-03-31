const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createCheckoutSession,
  handleWebhook,
  getSessionStatus,
  verifyPayment
} = require("../controllers/paymentController");

// ===========================
// STRIPE CHECKOUT ROUTES
// ===========================

/**
 * @swagger
 * /api/payment/create-checkout-session:
 *   post:
 *     summary: Create a Stripe Checkout Session
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderType, orderId]
 *             properties:
 *               orderType:
 *                 type: string
 *                 enum: [farmer-dealer, dealer-retailer]
 *                 description: Type of payment flow
 *               orderId:
 *                 type: string
 *                 description: ID of the order to pay for
 *     responses:
 *       200:
 *         description: Stripe checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 url:
 *                   type: string
 *       400:
 *         description: Validation error
 *       404:
 *         description: Order not found
 */
router.post("/create-checkout-session", protect, createCheckoutSession);

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Stripe webhook endpoint (called by Stripe)
 *     tags: [Payment]
 *     description: This endpoint is called by Stripe to notify about payment events. No authentication required.
 *     responses:
 *       200:
 *         description: Webhook received
 */
// NOTE: Webhook uses express.raw() middleware, configured in app.js
router.post("/webhook", handleWebhook);

/**
 * @swagger
 * /api/payment/session-status/{sessionId}:
 *   get:
 *     summary: Get Stripe checkout session status
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session status details
 */
router.get("/session-status/:sessionId", protect, getSessionStatus);

/**
 * @swagger
 * /api/payment/verify:
 *   post:
 *     summary: Manually verify a payment (fallback if webhook fails)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified
 */
router.post("/verify", protect, verifyPayment);

module.exports = router;
