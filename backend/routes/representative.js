const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  getPendingCrops,
  claimBatch,
  unclaimBatch,
  getMyAssigned,
  getAllCropsForRep,
  editVerification,
  approveCrop,
  rejectCrop,
  postApprovalEdit,
  getExpiryAlerts,
} = require("../controllers/representativecontroller");

/**
 * @swagger
 * /api/representative/pending:
 *   get:
 *     summary: Get unassigned pending crops for verification
 *     tags: [Representative]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of pending crop batches
 */
// ── Unassigned queue (all reps see this)
router.get("/pending",  protect, getPendingCrops);

/**
 * @swagger
 * /api/representative/claim/{batchId}:
 *   post:
 *     summary: Claim a crop batch for verification
 *     tags: [Representative]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch claimed
 *       404:
 *         description: Batch not found
 */
// ── Claim / unclaim a batch
router.post("/claim/:batchId",   protect, claimBatch);

/**
 * @swagger
 * /api/representative/unclaim/{batchId}:
 *   post:
 *     summary: Release a claimed batch
 *     tags: [Representative]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch unclaimed
 *       404:
 *         description: Batch not found
 */
router.post("/unclaim/:batchId", protect, unclaimBatch);

/**
 * @swagger
 * /api/representative/my-assigned:
 *   get:
 *     summary: Get batches assigned to current representative
 *     tags: [Representative]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of assigned batches
 */
// ── My assigned verifications
router.get("/my-assigned", protect, getMyAssigned);

/**
 * @swagger
 * /api/representative/crops:
 *   get:
 *     summary: Get all crops filtered by status
 *     tags: [Representative]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [approved, rejected, in_verification]
 *       - in: query
 *         name: mine
 *         schema:
 *           type: boolean
 *         description: Filter to only show own assigned items
 *     responses:
 *       200:
 *         description: Filtered array of crops
 */
// ── All crops by status
router.get("/crops", protect, getAllCropsForRep);

/**
 * @swagger
 * /api/representative/expiry-alerts:
 *   get:
 *     summary: Get expiry alerts for crops
 *     tags: [Representative]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of expiry alert items
 */
// ── Expiry alerts
router.get("/expiry-alerts", protect, getExpiryAlerts);

/**
 * @swagger
 * /api/representative/edit/{farmerEmail}/{cropId}:
 *   put:
 *     summary: Edit crop during verification (before approve/reject)
 *     tags: [Representative]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *               edits:
 *                 type: object
 *     responses:
 *       200:
 *         description: Verification edit saved
 *       404:
 *         description: Crop not found
 */
// ── Edit during verification (before approve/reject)
router.put("/edit/:farmerEmail/:cropId", protect, editVerification);

/**
 * @swagger
 * /api/representative/approve/{farmerEmail}/{cropId}:
 *   put:
 *     summary: Approve a crop (with optional images)
 *     tags: [Representative]
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
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               fieldImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Crop approved
 *       404:
 *         description: Crop not found
 */
// ── Approve — multipart: images[] + fieldImages[]
router.put(
  "/approve/:farmerEmail/:cropId",
  protect,
  upload.fields([
    { name: "images",      maxCount: 5 },
    { name: "fieldImages", maxCount: 5 },
  ]),
  approveCrop
);

/**
 * @swagger
 * /api/representative/reject/{farmerEmail}/{cropId}:
 *   put:
 *     summary: Reject a crop
 *     tags: [Representative]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Crop rejected
 *       404:
 *         description: Crop not found
 */
// ── Reject
router.put("/reject/:farmerEmail/:cropId", protect, rejectCrop);

/**
 * @swagger
 * /api/representative/admin-edit/{farmerEmail}/{cropId}:
 *   put:
 *     summary: Post-approval edit (expiry, remarks, deactivate)
 *     tags: [Representative]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               remarks:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Post-approval edit saved
 *       404:
 *         description: Crop not found
 */
// ── Post-approval admin edit (expiry / remarks / deactivate)
router.put("/admin-edit/:farmerEmail/:cropId", protect, postApprovalEdit);

module.exports = router;