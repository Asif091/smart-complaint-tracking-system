const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("[DB] MONGO_URI not set. Set it in .env to connect to MongoDB.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { family: 4 });
    console.log("[DB] MongoDB connected");
  } catch (error) {
    console.error("[DB] Connection failed:", error.message);
    process.exit(1);
  }
};

const isConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, isConnected };
