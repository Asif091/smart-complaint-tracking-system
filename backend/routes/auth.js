const express = require("express");
const { auth } = require("../middleware/auth");
const { login, logout, getMe, register } = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);

router.post("/logout", auth, logout);
router.get("/me", auth, getMe);

module.exports = router;