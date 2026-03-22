const express = require("express");
const router = express.Router();

const {
  updateProfile,
  changePassword,
  deactivateUser,
  getUsers,
  createUser,
  updateUser,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const { auth } = require("../middleware/auth");

// User actions (protected)
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Admin user management routes
router.get("/", auth, isAdmin, getUsers);
router.post("/", auth, isAdmin, createUser);
router.patch("/:id/status", auth, isAdmin, deactivateUser);
router.put("/:id", auth, isAdmin, updateUser);

module.exports = router;
