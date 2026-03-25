const mongoose = require("mongoose");
const dns = require("dns");

// Fix DNS resolution on Windows
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("[DB] MONGO_URI not set. Set it in .env to connect to MongoDB.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("[DB] MongoDB connected");
  } catch (error) {
    console.error("[DB] Connection failed:", error.message);
    process.exit(1);
  }
};

const isConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, isConnected };
