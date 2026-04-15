const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authController = require("../controllers/authcontroller");
const { 
  signup, 
  sendOTP, 
  verifyOTP, 
  verifyGoogleToken, 
  signupWithGoogle,
  sendLoginOTP,
  verifyLoginOTP,
  verifyGoogleLogin,
  updateFarmerProfile
} = require("../controllers/authcontroller");


// ===========================
// PROFILE ROUTE (COMMON FOR ALL USERS)
// ===========================
const User = require("../models/user");

/**
 * @swagger
 * /api/auth/profile/{email}:
 *   get:
 *     summary: Get user profile by email
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User's email address
 *     responses:
 *       200:
 *         description: User profile object
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/profile/:email", protect,async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ msg: "Error fetching user profile" });
  }
});


/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user with email OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, otp, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [farmer, dealer, retailer]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or OTP mismatch
 */
router.post("/signup", signup);

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to email for signup verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       500:
 *         description: Email sending failed
 */
router.post("/send-otp", sendOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify email OTP for signup
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-otp", verifyOTP);

/**
 * @swagger
 * /api/auth/verify-google:
 *   post:
 *     summary: Verify Google OAuth token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token
 *     responses:
 *       200:
 *         description: Google token verified
 *       401:
 *         description: Invalid Google token
 */
router.post("/verify-google", verifyGoogleToken);

/**
 * @swagger
 * /api/auth/signup-google:
 *   post:
 *     summary: Sign up using Google OAuth
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, role]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token
 *               role:
 *                 type: string
 *                 enum: [farmer, dealer, retailer]
 *     responses:
 *       201:
 *         description: User created via Google OAuth
 *       400:
 *         description: User already exists or invalid token
 */
router.post("/signup-google", signupWithGoogle);

/**
 * @swagger
 * /api/auth/farmer/update/{email}:
 *   put:
 *     summary: Update farmer profile (from auth route)
 *     tags: [Auth]
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
 *     responses:
 *       200:
 *         description: Profile updated
 *       404:
 *         description: Farmer not found
 */
router.put("/farmer/update/:email", updateFarmerProfile);

/**
 * @swagger
 * /api/auth/send-login-otp:
 *   post:
 *     summary: Send OTP for login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login OTP sent
 *       404:
 *         description: User not found
 */
router.post("/send-login-otp", sendLoginOTP);

/**
 * @swagger
 * /api/auth/verify-login-otp:
 *   post:
 *     summary: Verify OTP and login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-login-otp", verifyLoginOTP);

/**
 * @swagger
 * /api/auth/login-google:
 *   post:
 *     summary: Login using Google OAuth
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       404:
 *         description: User not registered
 */
router.post("/login-google", verifyGoogleLogin);

/**
 * @swagger
 * /api/auth/login:
 * post:
 * summary: Authenticate user and get JWT token
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * example: dealer@agrochain.com
 * password:
 * type: string
 * format: password
 * example: "securepassword123"
 * responses:
 * 200:
 * description: Login successful
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * token:
 * type: string
 * description: JWT Bearer token
 * user:
 * type: object
 * 400:
 * description: Invalid credentials
 * 500:
 * description: Server error
 */
router.post("/login", authController.login);

module.exports = router;