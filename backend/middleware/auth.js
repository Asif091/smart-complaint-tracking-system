const jwt = require("jsonwebtoken");
const { isConnected } = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Optional: use for routes that work with or without DB (e.g. prototype)
const requireDB = (req, res, next) => {
  if (!isConnected()) {
    return res.status(503).json({ message: "Database unavailable. Run with MongoDB or use PROTOTYPE_MODE." });
  }
  next();
};

module.exports = { auth, JWT_SECRET, requireDB };
