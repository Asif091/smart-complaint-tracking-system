const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");

dotenv.config();

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