const express = require("express");
const router = express.Router();
const {
  getStats,
  getUsers,
  deleteUser,
  deactivateUser,
  getLogs,
  getAllProducts,
  adminDeleteProduct,
} = require("../controllers/admincontroller");


// ====================
// Admin routes
// ====================
router.get("/stats", getStats);
router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.put("/deactivate/:id", deactivateUser);
router.get("/logs", getLogs);

router.get("/products", getAllProducts);
router.delete("/products/:farmerEmail/:cropId", adminDeleteProduct);


module.exports = router;
