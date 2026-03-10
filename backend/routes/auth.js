const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth, JWT_SECRET, requireDB } = require("../middleware/auth");
const { isConnected } = require("../config/db");

const PROTOTYPE_MODE = process.env.PROTOTYPE_MODE === "true";

const router = express.Router();

// Helper for prototype (no MongoDB) login
const buildPrototypeUser = (email) => ({
  id: "prototype-user",
  name: "Prototype User",
  email,
  role: "staff",
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required." });
    }

    // If DB is not connected
    if (!isConnected()) {
      if (!PROTOTYPE_MODE) {
        return res
          .status(503)
          .json({ message: "Database unavailable. Enable PROTOTYPE_MODE or connect MongoDB." });
      }

      // Prototype mode: accept any non-empty email/password and return a fake user
      const user = buildPrototypeUser(email);
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({ token, user, prototype: true });
    }

    // Normal path: real MongoDB login
    const user = await User.findOne({ email, status: "active" });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/auth/logout — stateless JWT: client discards token; this endpoint for consistency / future blacklist
router.post("/logout", auth, (req, res) => {
  res.json({ message: "Logged out successfully." });
});

// GET /api/auth/me — current user (for frontend to restore session)
router.get("/me", auth, async (req, res) => {
  try {
    // If DB is not connected
    if (!isConnected()) {
      if (PROTOTYPE_MODE && req.user) {
        // In prototype mode, trust the data from the token
        const { id = "prototype-user", name = "Prototype User", email, role = "staff" } = req.user;
        return res.json({
          user: { id, name, email, role },
        });
      }
      return res
        .status(503)
        .json({ message: "Database unavailable. Enable PROTOTYPE_MODE or connect MongoDB." });
    }

    // Normal path: real MongoDB lookup
    const user = await User.findById(req.user.id).select("-password");
    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "User not found or inactive." });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/auth/register — for prototype: seed first user (optional, can remove in production)
router.post("/register", requireDB, async (req, res) => {
  if (!isConnected()) return res.status(503).json({ message: "Database unavailable." });
  try {
    const { name, email, password, role = "staff" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required." });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered." });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
