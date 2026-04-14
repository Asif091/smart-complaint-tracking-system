const Complaint = require("../models/Complaint");
const User = require("../models/User");

exports.submitComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description and category are required" });
    }

    const user = await User.findById(req.user.id);
    let assignedDepartment = null;
    
    if (user.role === "employee" && user.department) {
      assignedDepartment = user.department;
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      createdBy: req.user.id,
      status: "pending",
      assignedDepartment: assignedDepartment
    });

    res.status(201).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating complaint" });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");  // <<<<<< ADD THIS LINE
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

// Assign complaint to specific staff member (Admin only)
exports.assignToStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;  // Changed from department to staffId

    // Admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can assign complaints" });
    }

    // Check if staff exists and has role "staff"
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== "staff") {
      return res.status(400).json({ message: "Invalid staff member" });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Assign to staff member
    complaint.assignedTo = staffId;
    complaint.assignedAt = new Date();

    // Update status from pending to assigned
    if (complaint.status === "pending") {
      complaint.status = "assigned";
    }

    await complaint.save();

    // Populate staff info for response
    await complaint.populate("assignedTo", "name email");

    res.json({ 
      message: `Complaint assigned to ${staff.name} successfully`, 
      complaint 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// <<<<<< NEW FUNCTION 1
exports.getComplaintsGroupedByDepartment = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const complaints = await Complaint.find()
      .populate("createdBy", "name email role department")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    const grouped = {
      "HR": [],
      "IT": [],
      "Finance": [],
      "Marketing & Sales": [],
      "Software & Product Development": [],
      "Unassigned": []
    };

    complaints.forEach(complaint => {
      const dept = complaint.assignedDepartment;
      if (dept && grouped[dept]) {
        grouped[dept].push(complaint);
      } else {
        grouped["Unassigned"].push(complaint);
      }
    });

    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching grouped complaints" });
  }
};

// <<<<<< NEW FUNCTION 2
exports.getMyAssignedComplaintsGrouped = async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({ message: "Access denied. Staff only." });
    }

    const complaints = await Complaint.find({ assignedTo: req.user.id })
      .populate("createdBy", "name email role department")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    const grouped = {
      "HR": [],
      "IT": [],
      "Finance": [],
      "Marketing & Sales": [],
      "Software & Product Development": []
    };

    complaints.forEach(complaint => {
      const dept = complaint.assignedDepartment;
      if (dept && grouped[dept]) {
        grouped[dept].push(complaint);
      }
    });

    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching assigned complaints" });
  }
};
// Update complaint status (Staff only)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["assigned", "in-progress", "resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Check if staff is assigned to this complaint
    if (req.user.role === "staff" && complaint.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update complaints assigned to you" });
    }

    complaint.status = status;
    await complaint.save();

    res.json({ message: `Status updated to ${status}`, complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};