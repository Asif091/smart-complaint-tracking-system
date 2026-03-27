const Complaint = require("../models/Complaint");

exports.submitComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description and category are required" });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      createdBy: req.user.id,
      status: "pending"
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Error creating complaint" });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const complaints = await require("../models/Complaint").find();
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Error fetching complaints" });
  }
};

// Get personal complaint history - for employees to see their own complaints
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await require("../models/Complaint")
      .find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Error fetching your complaints" });
  }
};

// Update complaint - only before assignment (when status is pending)
exports.updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    // Find the complaint first
    const complaint = await require("../models/Complaint").findById(id);
    
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    
    // Only allow editing if the user created it and it's still pending (not assigned)
    if (complaint.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own complaints" });
    }
    
    if (complaint.status !== "pending") {
      return res.status(400).json({ message: "Cannot edit complaint after it has been assigned" });
    }
    
    // Update the complaint
    const updatedComplaint = await require("../models/Complaint").findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );
    
    res.json(updatedComplaint);
  } catch (err) {
    res.status(500).json({ message: "Error updating complaint" });
  }
};