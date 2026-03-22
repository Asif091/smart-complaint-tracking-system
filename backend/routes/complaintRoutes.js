const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");

const { createComplaint, getComplaints } = require("../controllers/complaintController");

// create complaint
router.post("/", auth, createComplaint);

router.get("/", auth, getComplaints);

module.exports = router;