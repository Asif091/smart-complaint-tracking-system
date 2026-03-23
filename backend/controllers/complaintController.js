const Complaint = require("../models/Complaint");

const submitComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description and category are required" });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: priority || "Medium",
      submittedBy: req.user.id
    });

    res.status(201).json({ success: true, complaint });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ submittedBy: req.user.id }).sort({ createdAt: -1 });

    res.json({ complaints });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate("submittedBy", "name email");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.submittedBy._id.toString() !== req.user.id && 
        req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ complaint });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update status" });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = status;

    await complaint.save();

    res.json({ message: "Status updated successfully", complaint });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaintStatus
};

