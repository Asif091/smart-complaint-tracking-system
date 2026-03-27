const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");

const { getComplaints, getMyComplaints, updateComplaint, assignToDepartment } = require("../controllers/complaintController");

// create complaint
router.post("/", auth, require("../controllers/complaintController").submitComplaint);

// Get all complaints
router.get("/", auth, getComplaints);

// Get personal complaints
router.get("/my-complaints", auth, getMyComplaints);

// Update complaint (before assignment)
router.put("/:id", auth, updateComplaint);

// Assign to department (Admin only)
router.put("/:id/assign-department", auth, authorize("admin"), assignToDepartment);

module.exports = router;