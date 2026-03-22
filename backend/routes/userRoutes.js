const express = require("express");
const router = express.Router();

const {
  updateProfile,
  changePassword,
  deactivateUser,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");

// User actions
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Admin action
router.put("/deactivate/:id", protect, isAdmin, deactivateUser);

module.exports = router;