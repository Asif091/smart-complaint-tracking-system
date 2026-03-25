const express = require("express");
const { auth } = require("../middleware/auth");
const { submitComplaint, getMyComplaints, getComplaintById, updateComplaintStatus } = require("../controllers/complaintController");
const router = express.Router();

const { auth } = require("../middleware/auth");

const { createComplaint, getComplaints, getMyComplaints, updateComplaint } = require("../controllers/complaintController");

// create complaint
router.post("/", auth, createComplaint);

// get all complaints (for admin/staff)
router.get("/", auth, getComplaints);

// get personal complaint history
router.get("/my-complaints", auth, getMyComplaints);

// update complaint (only before assignment)
router.put("/:id", auth, updateComplaint);

module.exports = router;