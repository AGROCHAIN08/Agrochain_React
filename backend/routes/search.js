const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global full-text search for crops, inventory, and users (Optimized & Cached)
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: The search term, such as mango, basmati, or punjab
 *     responses:
 *       200:
 *         description: Search executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 source:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing search query
 */
router.get("/", searchController.globalSearch);

module.exports = router;
