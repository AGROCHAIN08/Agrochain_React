const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getStats,
  getUsers,
  deleteUser,
  deactivateUser,
  getLogs,
  getUserActivityTimeline,
  getAllProducts,
  adminDeleteProduct,
  getRepresentatives,
  addRepresentative,
  deleteRepresentative,
  checkRepresentative,
} = require("../controllers/admincontroller");


// ====================
// Admin routes
// ====================

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats (user counts, orders, etc.)
 */
router.get("/stats", protect, authorize('admin'), getStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of all users
 */
router.get("/users", protect, authorize('admin'), getUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User MongoDB ID
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", protect, authorize('admin'), deleteUser);

/**
 * @swagger
 * /api/admin/deactivate/{id}:
 *   put:
 *     summary: Deactivate a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User MongoDB ID
 *     responses:
 *       200:
 *         description: User deactivated
 *       404:
 *         description: User not found
 */
router.put("/deactivate/:id", protect, authorize('admin'), deactivateUser);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get application logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Log entries
 */
router.get("/logs", protect, authorize('admin'), getLogs);
router.get("/user-activity/:email", protect, authorize('admin'), getUserActivityTimeline);

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Get all products (crops) across all farmers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of all products
 */
router.get("/products", protect, authorize('admin'), getAllProducts);

/**
 * @swagger
 * /api/admin/products/{farmerEmail}/{cropId}:
 *   delete:
 *     summary: Admin delete a product/crop
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmerEmail
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: cropId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
router.delete("/products/:farmerEmail/:cropId", protect, authorize('admin'), adminDeleteProduct);

// ====================
// Representative routes
// ====================

/**
 * @swagger
 * /api/admin/representatives/check/{email}:
 *   get:
 *     summary: Check if an email is a registered representative (public)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Whether the email belongs to a representative
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isRepresentative:
 *                   type: boolean
 */
// Public check (used during login - no admin auth needed)
router.get("/representatives/check/:email", checkRepresentative);

/**
 * @swagger
 * /api/admin/representatives:
 *   get:
 *     summary: Get all representatives
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of representatives
 */
// Protected CRUD (admin only)
router.get("/representatives", protect, authorize('admin'), getRepresentatives);

/**
 * @swagger
 * /api/admin/representatives:
 *   post:
 *     summary: Add a new representative
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name]
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Representative added
 *       400:
 *         description: Validation error
 */
router.post("/representatives", protect, authorize('admin'), addRepresentative);

/**
 * @swagger
 * /api/admin/representatives/{id}:
 *   delete:
 *     summary: Delete a representative
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Representative MongoDB ID
 *     responses:
 *       200:
 *         description: Representative deleted
 *       404:
 *         description: Representative not found
 */
router.delete("/representatives/:id", protect, authorize('admin'), deleteRepresentative);


module.exports = router;
