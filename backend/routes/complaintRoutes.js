const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const upload = require("../config/upload");

const { 
  submitComplaint,
  getComplaints, 
  getMyComplaints, 
  updateComplaint, 
  assignToStaff,
  getComplaintsGroupedByDepartment, 
  getMyAssignedComplaintsGrouped, 
  updateStatus,
  getComplaintHistory,    // NEW
  addComment,             // NEW
  getComplaintStats       // NEW
} = require("../controllers/complaintController");

// ============================================
// CREATE COMPLAINT
// ============================================
router.post("/", auth, upload.array("attachments", 5), submitComplaint);

// ============================================
// GET COMPLAINTS
// ============================================
// Get all complaints (Admin/Staff)
router.get("/", auth, getComplaints);

// Get personal complaints (Employee)
router.get("/my-complaints", auth, getMyComplaints);

// Get complaint statistics (Admin)
router.get("/stats", auth, authorize("admin"), getComplaintStats);

// Admin: Get all complaints grouped by department
router.get("/admin/grouped", auth, authorize("admin"), getComplaintsGroupedByDepartment);

// Staff: Get assigned complaints grouped by department
router.get("/staff/grouped", auth, authorize("staff"), getMyAssignedComplaintsGrouped);

// ============================================
// COMPLAINT DETAIL & HISTORY
// ============================================
// Get complaint history (NEW)
router.get("/:id/history", auth, getComplaintHistory);

// ============================================
// UPDATE COMPLAINT
// ============================================
// Update complaint (before assignment)
router.put("/:id", auth, updateComplaint);

// Assign to staff (Admin only)
router.put("/:id/assign-staff", auth, authorize("admin"), assignToStaff);

// Update status (with optional comment)
router.patch("/:id/status", auth, updateStatus);

// ============================================
// COMMENTS
// ============================================
// Add comment only (NEW)
router.post("/:id/comments", auth, addComment);

module.exports = router;