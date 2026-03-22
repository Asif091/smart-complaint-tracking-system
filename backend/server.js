const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables BEFORE importing anything that reads process.env
dotenv.config();

const { connectDB } = require("./config/db");

const app = express();

// connect database
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.get("/", (req, res) => {
  res.send("Smart Complaint Tracking System Backend Running");
});
app.use("/api/auth", require("./routes/auth"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const userRoutes = require("./routes/userRoutes");

app.use("/api/users", userRoutes);