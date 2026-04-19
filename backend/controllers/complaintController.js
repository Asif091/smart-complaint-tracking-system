const Complaint = require("../models/Complaint");
const User = require("../models/User");
const ActionLog = require("../models/ActionLog");

// Helper function to log actions
const logAction = async (complaintId, userId, action, details = {}) => {
  try {
    const user = await User.findById(userId).select("name role");
    if (!user) return null;

    return await ActionLog.logAction({
      complaintId,
      action,
      oldStatus: details.oldStatus,
      newStatus: details.newStatus,
      comment: details.comment,
      userId,
      userName: user.name,
      userRole: user.role,
      metadata: details.metadata || {}
    });
  } catch (error) {
    console.error("Failed to log action:", error);
    return null;
  }
};

// ============================================
// SUBMIT COMPLAINT
// ============================================
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

    // Handle file uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        });
      });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: priority || "medium",
      createdBy: req.user.id,
      status: "pending",
      assignedDepartment: assignedDepartment,
      attachments
    });

    // Log complaint creation
    await logAction(complaint._id, req.user.id, "created", {
      comment: `Complaint submitted by ${user.name}`,
      metadata: { category, priority: priority || "medium", attachmentsCount: attachments.length }
    });

    res.status(201).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating complaint" });
  }
};

// ============================================
// GET ALL COMPLAINTS
// ============================================
exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching complaints" });
  }
};

// ============================================
// GET PERSONAL COMPLAINTS
// ============================================
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

// ============================================
// UPDATE COMPLAINT (before assignment)
// ============================================
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
    
    const oldTitle = complaint.title;
    const oldDescription = complaint.description;
    
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );

    // Log the edit action
    await logAction(complaint._id, req.user.id, "commented", {
      comment: `Complaint edited. Title: "${oldTitle}" → "${title}"`,
      metadata: { edited: true }
    });
    
    res.json(updatedComplaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating complaint" });
  }
};

// ============================================
// ASSIGN TO STAFF
// ============================================
exports.assignToStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

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

    const oldStatus = complaint.status;
    const wasAssigned = !!complaint.assignedTo;
    const previousStaffId = complaint.assignedTo;

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

    // Log the assignment action
    await logAction(complaint._id, req.user.id, "assigned", {
      oldStatus: oldStatus,
      newStatus: complaint.status,
      comment: `Assigned to ${staff.name} (${staff.email})`,
      metadata: { 
        staffId: staff._id,
        staffName: staff.name,
        previousStaffId: previousStaffId || null
      }
    });

    res.json({ 
      message: `Complaint assigned to ${staff.name} successfully`, 
      complaint 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// GET COMPLAINTS GROUPED BY DEPARTMENT (Admin)
// ============================================
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

// ============================================
// GET MY ASSIGNED COMPLAINTS GROUPED (Staff)
// ============================================
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

// ============================================
// UPDATE STATUS (with comment support)
// ============================================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const validStatus = ["pending", "assigned", "in-progress", "resolved"];
    
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Permission check
    if (req.user.role === "staff" && complaint.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update complaints assigned to you" });
    }

    if (req.user.role === "employee" && complaint.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own complaints" });
    }

    const oldStatus = complaint.status;
    
    // Update status
    complaint.status = status;
    
    // If resolved, set resolvedAt
    if (status === "resolved" && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date();
    }

    // Store last comment for quick display
    if (comment) {
      const user = await User.findById(req.user.id).select("name");
      complaint.lastComment = {
        text: comment,
        by: user.name,
        at: new Date()
      };
    }

    await complaint.save();

    // Log the status change
    const actionLog = await logAction(complaint._id, req.user.id, "status_changed", {
      oldStatus: oldStatus,
      newStatus: status,
      comment: comment || null,
      metadata: { 
        changedBy: req.user.role,
        resolutionTime: status === "resolved" ? complaint.resolutionTime : null
      }
    });

    res.json({ 
      success: true,
      message: `Status updated to ${status}`,
      complaint,
      actionLog
    });

  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// GET COMPLAINT HISTORY (NEW)
// ============================================
exports.getComplaintHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

// Permission check - FIXED VERSION
const isAdmin = req.user.role === "admin";
const isAssignedStaff = complaint.assignedTo?._id?.toString() === req.user.id;
const isCreator = complaint.createdBy?._id?.toString() === req.user.id;

if (!isAdmin && !isAssignedStaff && !isCreator) {
  return res.status(403).json({ message: "Access denied" });
}

    // Get action history
    const history = await ActionLog.find({ complaint: id })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate statistics
    const stats = {
      totalActions: history.length,
      statusChanges: history.filter(h => h.action === "status_changed").length,
      comments: history.filter(h => h.comment).length,
      lastUpdated: history[0]?.createdAt || complaint.createdAt
    };

    res.json({
      complaint: {
        _id: complaint._id,
        title: complaint.title,
        status: complaint.status,
        createdBy: complaint.createdBy,
        assignedTo: complaint.assignedTo,
        createdAt: complaint.createdAt,
        resolutionTime: complaint.resolutionTime
      },
      history,
      stats
    });

  } catch (err) {
    console.error("Error fetching complaint history:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// ADD COMMENT ONLY (NEW - No status change)
// ============================================
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Permission check
    const isAdmin = req.user.role === "admin";
    const isAssignedStaff = complaint.assignedTo?.toString() === req.user.id;
    const isCreator = complaint.createdBy.toString() === req.user.id;

    if (!isAdmin && !isAssignedStaff && !isCreator) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update last comment for quick display
    const user = await User.findById(req.user.id).select("name");
    complaint.lastComment = {
      text: comment,
      by: user.name,
      at: new Date()
    };
    await complaint.save();

    // Log the comment
    const actionLog = await logAction(complaint._id, req.user.id, "commented", {
      comment: comment,
      metadata: { status: complaint.status }
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      actionLog
    });

  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// GET COMPLAINT STATISTICS (NEW - For dashboard)
// ============================================
exports.getComplaintStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const totalComplaints = await Complaint.countDocuments();
    
    const statusCounts = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const departmentCounts = await Complaint.aggregate([
      { $group: { _id: "$assignedDepartment", count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } }
    ]);

    const priorityCounts = await Complaint.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    // Average resolution time
    const resolutionStats = await Complaint.aggregate([
      { $match: { status: "resolved", resolvedAt: { $ne: null } } },
      { 
        $project: { 
          resolutionDays: { 
            $divide: [
              { $subtract: ["$resolvedAt", "$createdAt"] }, 
              1000 * 60 * 60 * 24
            ] 
          } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          avgResolutionDays: { $avg: "$resolutionDays" },
          minResolutionDays: { $min: "$resolutionDays" },
          maxResolutionDays: { $max: "$resolutionDays" }
        } 
      }
    ]);

    res.json({
      totalComplaints,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      departmentCounts: departmentCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      priorityCounts: priorityCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      resolutionStats: resolutionStats[0] || { avgResolutionDays: 0 }
    });

  } catch (err) {
    console.error("Error fetching complaint stats:", err);
    res.status(500).json({ message: "Server error" });
  }
};