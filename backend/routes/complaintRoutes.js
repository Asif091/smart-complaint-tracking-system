const express = require("express");
const { auth } = require("../middleware/auth");
const { submitComplaint, getMyComplaints, getComplaintById, updateComplaintStatus } = require("../controllers/complaintController");
const router = express.Router();

router.use(auth);

router.post("/", submitComplaint);
router.put("/:id/status", updateComplaintStatus);
router.get("/my", getMyComplaints);
router.get("/:id", getComplaintById);

module.exports = router;