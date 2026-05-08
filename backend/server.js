const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables BEFORE importing anything that reads process.env
dotenv.config();

const { connectDB } = require("./config/db");

const app = express();

// connect database
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files with original filename (download mode)
app.get("/api/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  const Complaint = require("./models/Complaint");
  
  Complaint.findOne({ "attachments.filename": filename })
    .then(complaint => {
      let originalName = filename;
      if (complaint) {
        const attachment = complaint.attachments.find(a => a.filename === filename);
        if (attachment) {
          originalName = attachment.originalName;
        }
      }
      
      res.setHeader("Content-Disposition", `attachment; filename="${originalName}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      res.sendFile(filePath);
    })
    .catch(() => {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      res.sendFile(filePath);
    });
});

// Serve uploaded files (for images preview)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.get("/", (req, res) => {
  res.send("Smart Complaint Tracking System Backend Running");
});

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const complaintRoutes = require("./routes/complaintRoutes");
app.use("/api/complaints", complaintRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("JWT_SECRET:", process.env.JWT_SECRET);
});

