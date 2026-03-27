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
    console.error(err);
    res.status(500).json({ message: "Error creating complaint" });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate("createdBy", "name email");
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching complaints" });
  }
};

// Get personal complaint history - for employees to see their own complaints
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint
      .find({ createdBy: req.user.id })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching your complaints" });
  }
};

// Update complaint - only before assignment (when status is pending)
exports.updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    const complaint = await Complaint.findById(id);
    
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    
    if (complaint.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own complaints" });
    }
    
    if (complaint.status !== "pending") {
      return res.status(400).json({ message: "Cannot edit complaint after it has been assigned" });
    }
    
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );
    
    res.json(updatedComplaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating complaint" });
  }
};

// Assign complaint to department (Admin only) - FEATURE 3
exports.assignToDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { department } = req.body;

    // Admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can assign complaints" });
    }

    const validDepartments = ["HR", "IT", "Finance", "Marketing & Sales", "Software & Product Development"];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.assignedDepartment = department;
    complaint.assignedAt = new Date();

    if (complaint.status === "pending") {
      complaint.status = "assigned";
    }

    await complaint.save();

    res.json({ message: `Complaint assigned to ${department} department successfully`, complaint });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};