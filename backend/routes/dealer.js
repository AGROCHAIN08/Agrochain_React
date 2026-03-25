const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const router = express.Router();
const { 
  getDealerProfile, 
  updateDealerProfile, 
  addVehicle, 
  getVehicles,
  updateVehicleStatus,
  deleteVehicle,
  getAllProducts,
  assignVehicle,
  getDealerOrders,
  placeBid,
  freeVehicle,
  getRetailerOrders,
  updateInventoryPrice,
  updateInventoryQuantity,
  removeInventoryItem,
  getFarmerProfileForDealer
} = require("../controllers/dealercontroller");

// ===========================
// PROFILE ROUTES
// ===========================

/**
 * @swagger
 * /api/dealer/profile/{email}:
 *   get:
 *     summary: Get dealer profile
 *     tags: [Dealer]
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
 *         description: Dealer profile data
 *       404:
 *         description: Dealer not found
 */
router.get("/profile/:email", protect,authorize('dealer'),getDealerProfile);

/**
 * @swagger
 * /api/dealer/profile/{email}:
 *   put:
 *     summary: Update dealer profile
 *     tags: [Dealer]
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
 *               businessName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       404:
 *         description: Dealer not found
 */
router.put("/profile/:email", protect,authorize('dealer'),updateDealerProfile);

// ===========================
// VEHICLE MANAGEMENT ROUTES
// ===========================

/**
 * @swagger
 * /api/dealer/vehicles/{email}:
 *   post:
 *     summary: Add a new vehicle
 *     tags: [Dealer]
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
 *             required: [vehicleType, vehicleNumber, capacity]
 *             properties:
 *               vehicleType:
 *                 type: string
 *               vehicleNumber:
 *                 type: string
 *               capacity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Vehicle added
 *       400:
 *         description: Validation error
 */
router.post("/vehicles/:email",protect,authorize('dealer'), addVehicle);

/**
 * @swagger
 * /api/dealer/vehicles/{email}:
 *   get:
 *     summary: Get all vehicles for a dealer
 *     tags: [Dealer]
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
 *         description: Array of vehicles
 */
router.get("/vehicles/:email", protect,authorize('dealer'),getVehicles);

/**
 * @swagger
 * /api/dealer/vehicles/{email}/{vehicleId}:
 *   put:
 *     summary: Update vehicle status
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: vehicleId
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
 *                 enum: [available, in_use, maintenance]
 *     responses:
 *       200:
 *         description: Vehicle status updated
 *       404:
 *         description: Vehicle not found
 */
router.put("/vehicles/:email/:vehicleId",protect,authorize('dealer'), updateVehicleStatus);

/**
 * @swagger
 * /api/dealer/vehicles/{email}/{vehicleId}:
 *   delete:
 *     summary: Delete a vehicle
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle deleted
 *       404:
 *         description: Vehicle not found
 */
router.delete("/vehicles/:email/:vehicleId",protect,authorize('dealer'), deleteVehicle);

/**
 * @swagger
 * /api/dealer/vehicles/free/{email}/{vehicleId}:
 *   post:
 *     summary: Free a vehicle (mark as available)
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle freed
 *       404:
 *         description: Vehicle not found
 */
router.post("/vehicles/free/:email/:vehicleId",protect,authorize('dealer'), freeVehicle);

// ===========================
// PRODUCT BROWSING ROUTES
// ===========================

/**
 * @swagger
 * /api/dealer/all-products:
 *   get:
 *     summary: Browse all available products (farmer crops)
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of all available products
 */
router.get("/all-products",protect,authorize('dealer'), getAllProducts);

// ===========================
// ORDER MANAGEMENT ROUTES (from Farmer)
// ===========================

/**
 * @swagger
 * /api/dealer/assign-vehicle:
 *   post:
 *     summary: Assign a vehicle to an order
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, vehicleId]
 *             properties:
 *               orderId:
 *                 type: string
 *               vehicleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle assigned to order
 *       404:
 *         description: Order or vehicle not found
 */
router.post("/assign-vehicle",protect,authorize('dealer'), assignVehicle);

/**
 * @swagger
 * /api/dealer/orders/{email}:
 *   get:
 *     summary: Get dealer's orders
 *     tags: [Dealer]
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
router.get("/orders/:email",protect, authorize('dealer'),getDealerOrders);

// ===========================
// BIDDING ROUTES
// ===========================

/**
 * @swagger
 * /api/dealer/place-bid:
 *   post:
 *     summary: Place a bid on a farmer's crop
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [farmerEmail, cropId, bidAmount, quantity]
 *             properties:
 *               farmerEmail:
 *                 type: string
 *               cropId:
 *                 type: string
 *               bidAmount:
 *                 type: number
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Bid placed successfully
 *       400:
 *         description: Validation error
 */
router.post("/place-bid", protect,authorize('dealer'),placeBid);

// ===========================
// INVENTORY MANAGEMENT ROUTES
// ===========================

/**
 * @swagger
 * /api/dealer/inventory/update-price:
 *   put:
 *     summary: Update inventory item price
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, price]
 *             properties:
 *               itemId:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Price updated
 *       404:
 *         description: Item not found
 */
router.put("/inventory/update-price",protect,authorize('dealer'), updateInventoryPrice);

/**
 * @swagger
 * /api/dealer/inventory/update-quantity:
 *   put:
 *     summary: Update inventory item quantity
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, quantity]
 *             properties:
 *               itemId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Quantity updated
 *       404:
 *         description: Item not found
 */
router.put("/inventory/update-quantity",protect,authorize('dealer'), updateInventoryQuantity);

/**
 * @swagger
 * /api/dealer/inventory/remove:
 *   delete:
 *     summary: Remove an inventory item
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId]
 *             properties:
 *               itemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item removed
 *       404:
 *         description: Item not found
 */
router.delete("/inventory/remove", protect,authorize('dealer'),removeInventoryItem);

// ===========================
// RETAILER ORDER ROUTES (for Dealer to see)
// ===========================

/**
 * @swagger
 * /api/dealer/retailer-orders/{email}:
 *   get:
 *     summary: Get retailer orders visible to the dealer
 *     tags: [Dealer]
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
 *         description: Array of retailer orders
 */
router.get("/retailer-orders/:email",protect, authorize('dealer'),getRetailerOrders);

// ===========================
// FARMER PROFILE ROUTE (for Dealer to view Farmer details)
// ===========================

/**
 * @swagger
 * /api/dealer/farmer-profile/{farmerEmail}:
 *   get:
 *     summary: View a farmer's profile (as dealer)
 *     tags: [Dealer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmerEmail
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Farmer profile data
 *       404:
 *         description: Farmer not found
 */
router.get("/farmer-profile/:farmerEmail", protect, authorize('dealer'), getFarmerProfileForDealer);

module.exports = router;