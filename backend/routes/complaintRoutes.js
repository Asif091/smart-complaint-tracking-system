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
  getComplaintHistory,    
  addComment,             
  getComplaintStats,       
  searchComplaints,
  escalateComplaint  
} = require("../controllers/complaintController");


router.post("/", auth, upload.array("attachments", 5), submitComplaint);

router.get("/", auth, getComplaints);

router.get("/search", auth, searchComplaints);

// Get personal complaints (Employee)
router.get("/my-complaints", auth, getMyComplaints);

// Admin: Get all complaints grouped by department
router.get("/admin/grouped", auth, authorize("admin"), getComplaintsGroupedByDepartment);

// Staff: Get assigned complaints grouped by department
router.get("/staff/grouped", auth, authorize("staff"), getMyAssignedComplaintsGrouped);

router.get("/:id/history", auth, getComplaintHistory);

router.put("/:id", auth, updateComplaint);

// Assign to staff (Admin only)
router.put("/:id/assign-staff", auth, authorize("admin"), assignToStaff);

// Update status (with optional comment)
router.patch("/:id/status", auth, updateStatus);

router.post("/:id/escalate", auth, escalateComplaint);

router.post("/:id/comments", auth, addComment);

module.exports = router;