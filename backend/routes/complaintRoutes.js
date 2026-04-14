const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");

const { getComplaints, getMyComplaints, updateComplaint, assignToStaff } = require("../controllers/complaintController");

const { getComplaintsGroupedByDepartment, getMyAssignedComplaintsGrouped, updateStatus } = require("../controllers/complaintController");

// create 
router.post("/", auth, require("../controllers/complaintController").submitComplaint);

// Get all complaints
router.get("/", auth, getComplaints);

// Get personal complaints
router.get("/my-complaints", auth, getMyComplaints);

// Update complaint (before assignment)
router.put("/:id", auth, updateComplaint);

// Assign to staff (Admin only)
router.put("/:id/assign-staff", auth, authorize("admin"), assignToStaff);

// Admin: Get all complaints grouped by department
router.get("/admin/grouped", auth, authorize("admin"), getComplaintsGroupedByDepartment);

// Staff: Get only assigned complaints grouped by department
router.get("/staff/grouped", auth, authorize("staff"), getMyAssignedComplaintsGrouped);

router.patch("/:id/status", auth, updateStatus);

module.exports = router;
