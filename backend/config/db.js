const mongoose = require("mongoose");

// Prototype-friendly: server keeps running even if DB fails (for local/dev without MongoDB)
const PROTOTYPE_MODE = process.env.PROTOTYPE_MODE === "true";

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("[DB] MONGO_URI not set. Set it in .env to connect to MongoDB.");
    if (!PROTOTYPE_MODE) process.exit(1);
    return;
  }

  try {
    await mongoose.connect(uri, { family: 4 });
    console.log("[DB] MongoDB connected");
  } catch (error) {
    console.error("[DB] Connection failed:", error.message);
    if (!PROTOTYPE_MODE) {
      console.error("[DB] Exiting. Set PROTOTYPE_MODE=true in .env to run without DB.");
      process.exit(1);
    }
    console.warn("[DB] Running in prototype mode without database.");
  }
};

// Optional: use in routes to guard DB-dependent endpoints
const isConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, isConnected };
