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

exports.submitComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description and category are required" });
    }

    const user = await User.findById(req.user.id);
    let assignedDepartment = null;
    
    assignedDepartment = req.body.department || null;

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
      priority: priority || "low",
      createdBy: req.user.id,
      status: "pending",
      assignedDepartment: assignedDepartment,
      attachments
    });

    // Log complaint creation
    await logAction(complaint._id, req.user.id, "created", {
      comment: `Complaint submitted by ${user.name}`,
      metadata: { category, priority: priority || "low", attachmentsCount: attachments.length }
    });
    
    console.log("🔔 Attempting to create notification for admin...");
    const admin = await User.findOne({ role: "admin" });
    console.log("Admin found:", admin ? admin.email : "NO ADMIN");
    if (admin) {
      const createNotification = require('../utils/createNotification');
      await createNotification(admin._id, "complaint_created", complaint._id, `New complaint...`);
      console.log("✅ Notification created");
    }
    
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

    // NOTIFICATIONS: Notify staff and employee
    const createNotification = require('../utils/createNotification');
    
    // Notify staff member
    await createNotification(
      staff._id,
      "complaint_assigned",
      complaint._id,
      `New complaint assigned to you: "${complaint.title}"`
    );
    
    // Notify employee who submitted the complaint
    const employee = await User.findById(complaint.createdBy);
    if (employee && employee._id.toString() !== staff._id.toString()) {
      await createNotification(
        employee._id,
        "complaint_assigned",
        complaint._id,
        `Your complaint "${complaint.title}" has been assigned to ${staff.name}`
      );
    }

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

    // NOTIFICATIONS: Notify employee and staff (if not the one who changed)
    const createNotification = require('../utils/createNotification');
    
    // Get the employee who created the complaint
    const employee = await User.findById(complaint.createdBy);
    
    // Notify employee if they are not the one who changed status
    if (employee && employee._id.toString() !== req.user.id) {
      await createNotification(
        employee._id,
        "status_changed",
        complaint._id,
        `Your complaint "${complaint.title}" status changed from ${oldStatus} to ${status}`
      );
    }
    
    // Notify assigned staff if exists and not the one who changed status
    if (complaint.assignedTo && complaint.assignedTo.toString() !== req.user.id) {
      const staff = await User.findById(complaint.assignedTo);
      if (staff && staff._id.toString() !== employee?._id.toString()) {
        await createNotification(
          staff._id,
          "status_changed",
          complaint._id,
          `Complaint "${complaint.title}" status changed from ${oldStatus} to ${status}`
        );
      }
    }

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
// GET COMPLAINT HISTORY
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

    // Permission check
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
      history
    });

  } catch (err) {
    console.error("Error fetching complaint history:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// ADD COMMENT ONLY (No status change)
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

    // NOTIFICATION: Notify employee (complainant) when a comment is added
    // Skip if the commenter is the employee themselves
    if (complaint.createdBy.toString() !== req.user.id) {
      const createNotification = require('../utils/createNotification');
      const employee = await User.findById(complaint.createdBy);
      if (employee) {
        await createNotification(
          employee._id,
          "comment_added",
          complaint._id,
          `New comment on your complaint "${complaint.title}" from ${user.name}`
        );
      }
    }

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



exports.searchComplaints = async (req, res) => {
  try {
    const { keyword, category, status, priority, department } = req.query;

    let query = {};

    if (keyword && keyword.trim()) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (department && department !== 'all') {
      query.assignedDepartment = department;
    }

    if (req.user.role === 'employee') {
      query.createdBy = req.user.id;
    } else if (req.user.role === 'staff') {
      query.assignedTo = req.user.id;
    }

    const complaints = await Complaint.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: complaints.length,
      complaints
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.escalateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    
    const complaint = await Complaint.findById(id);
    
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    
    if (complaint.escalationLevel >= 3) {
      return res.status(400).json({ 
        message: "Already at maximum escalation level" 
      });
    }

    const priorities = ["low", "medium", "high", "critical"];
    let currentIndex = -1;
    
    if (complaint.priority === "low"){
      currentIndex = 0;
    }
    if (complaint.priority === "medium"){ 
      currentIndex = 1;
    }
    if (complaint.priority === "high"){
      currentIndex = 2;
    }
    if (complaint.priority === "critical"){ 
      currentIndex = 3;
    }
    
    if (currentIndex >= 3) {
      return res.status(400).json({ message: "Already at highest priority!" });
    }
    
    if (currentIndex === 0) {
      complaint.priority = "medium";
    }
    if (currentIndex === 1) {
      complaint.priority = "high";
    }
    if (currentIndex === 2) {
      complaint.priority = "critical";
    }
    
    if (!complaint.escalationLevel) {
      complaint.escalationLevel = 0;
    }
    complaint.escalationLevel = complaint.escalationLevel + 1;
    
    await complaint.save();
    
    res.json({
      success: true,
      message: `Priority changed to ${complaint.priority}`,
      priority: complaint.priority,
      escalationLevel: complaint.escalationLevel
    });
    
  } catch (error) {
    console.error("Escalation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const allComplaints = await Complaint.find({});

    let totalComplaints = 0;
    let resolvedComplaints = 0;
    let pendingComplaints = 0;
    let assignedComplaints = 0;
    let inProgressComplaints = 0;
    let totalResolutionHours = 0;
    let resolvedCountForAvg = 0;


    for (let i = 0; i < allComplaints.length; i++) {
      const complaint = allComplaints[i];
      totalComplaints = totalComplaints + 1;
      
      if (complaint.status === "pending") {
        pendingComplaints = pendingComplaints + 1;
      } else if (complaint.status === "assigned") {
        assignedComplaints = assignedComplaints + 1;
      } else if (complaint.status === "in-progress") {
        inProgressComplaints = inProgressComplaints + 1;
      } else if (complaint.status === "resolved") {
        resolvedComplaints = resolvedComplaints + 1;
        
        let endDate = complaint.resolvedAt;
        if (!endDate) {
          endDate = complaint.updatedAt;
        }
        
        if (endDate) {
          const startTime = new Date(complaint.createdAt).getTime();
          const endTime = new Date(endDate).getTime();
          const diffInHours = (endTime - startTime) / (1000 * 60 * 60);
          totalResolutionHours = totalResolutionHours + diffInHours;
          resolvedCountForAvg = resolvedCountForAvg + 1;
        }
      }
    }
    
    let averageResolutionHours = 0;
    if (resolvedCountForAvg > 0) {
      averageResolutionHours = totalResolutionHours / resolvedCountForAvg;
      averageResolutionHours = Number(averageResolutionHours.toFixed(1));
    }
    
    let resolutionRate = 0;
    if (totalComplaints > 0) {
      resolutionRate = (resolvedComplaints / totalComplaints) * 100;
      resolutionRate = Number(resolutionRate.toFixed(1));
    }


    const departments = ["HR", "IT", "Finance", "Marketing & Sales", "Software & Product Development"];
    const departmentReport = [];
    
    for (let i = 0; i < departments.length; i++) {
      const departmentName = departments[i];
      
      let departmentTotal = 0;
      let departmentResolved = 0;
      let departmentPending = 0;
      let departmentAssigned = 0;
      let departmentInProgress = 0;
      let departmentTotalResolutionHours = 0;
      let departmentResolvedCount = 0;
      
      for (let j = 0; j < allComplaints.length; j++) {
        const complaint = allComplaints[j];
        
        if (complaint.assignedDepartment === departmentName) {
          departmentTotal = departmentTotal + 1;
          
          if (complaint.status === "pending") {
            departmentPending = departmentPending + 1;
          } else if (complaint.status === "assigned") {
            departmentAssigned = departmentAssigned + 1;
          } else if (complaint.status === "in-progress") {
            departmentInProgress = departmentInProgress + 1;
          } else if (complaint.status === "resolved") {
            departmentResolved = departmentResolved + 1;
            
            let endDate = complaint.resolvedAt;
            if (!endDate) {
              endDate = complaint.updatedAt;
            }
            
            if (endDate) {
              const startTime = new Date(complaint.createdAt).getTime();
              const endTime = new Date(endDate).getTime();
              const diffInHours = (endTime - startTime) / (1000 * 60 * 60);
              departmentTotalResolutionHours = departmentTotalResolutionHours + diffInHours;
              departmentResolvedCount = departmentResolvedCount + 1;
            }
          }
        }
      }
      
      let departmentAverageResolution = 0;
      if (departmentResolvedCount > 0) {
        departmentAverageResolution = departmentTotalResolutionHours / departmentResolvedCount;
        departmentAverageResolution = Number(departmentAverageResolution.toFixed(1));
      }
      
      let departmentResolutionRate = 0;
      if (departmentTotal > 0) {
        departmentResolutionRate = (departmentResolved / departmentTotal) * 100;
        departmentResolutionRate = Number(departmentResolutionRate.toFixed(1));
      }
      
      departmentReport.push({
        department: departmentName,
        total: departmentTotal,
        pending: departmentPending,
        assigned: departmentAssigned,
        inProgress: departmentInProgress,
        resolved: departmentResolved,
        averageResolutionTime: departmentAverageResolution,
        resolutionRate: departmentResolutionRate
      });
    }


    const priorities = ["low", "medium", "high", "critical"];
    const priorityReport = [];
    
    for (let i = 0; i < priorities.length; i++) {
      const priorityName = priorities[i];
      
      let priorityTotal = 0;
      let priorityResolved = 0;
      let priorityPending = 0;
      let priorityAssigned = 0;
      let priorityInProgress = 0;
      let priorityTotalResolutionHours = 0;
      let priorityResolvedCount = 0;
      
      for (let j = 0; j < allComplaints.length; j++) {
        const complaint = allComplaints[j];
        
        if (complaint.priority === priorityName) {
          priorityTotal = priorityTotal + 1;
          
          if (complaint.status === "pending") {
            priorityPending = priorityPending + 1;
          } else if (complaint.status === "assigned") {
            priorityAssigned = priorityAssigned + 1;
          } else if (complaint.status === "in-progress") {
            priorityInProgress = priorityInProgress + 1;
          } else if (complaint.status === "resolved") {
            priorityResolved = priorityResolved + 1;
            
            let endDate = complaint.resolvedAt;
            if (!endDate) {
              endDate = complaint.updatedAt;
            }
            
            if (endDate) {
              const startTime = new Date(complaint.createdAt).getTime();
              const endTime = new Date(endDate).getTime();
              const diffInHours = (endTime - startTime) / (1000 * 60 * 60);
              priorityTotalResolutionHours = priorityTotalResolutionHours + diffInHours;
              priorityResolvedCount = priorityResolvedCount + 1;
            }
          }
        }
      }
      
      let priorityAverageResolution = 0;
      if (priorityResolvedCount > 0) {
        priorityAverageResolution = priorityTotalResolutionHours / priorityResolvedCount;
        priorityAverageResolution = Number(priorityAverageResolution.toFixed(1));
      }
      
      priorityReport.push({
        priority: priorityName,
        total: priorityTotal,
        pending: priorityPending,
        assigned: priorityAssigned,
        inProgress: priorityInProgress,
        resolved: priorityResolved,
        averageResolutionTime: priorityAverageResolution
      });
    }


    res.json({
      success: true,
      summary: {
        totalComplaints: totalComplaints,
        resolvedComplaints: resolvedComplaints,
        pendingComplaints: pendingComplaints,
        assignedComplaints: assignedComplaints,
        inProgressComplaints: inProgressComplaints,
        averageResolutionTime: averageResolutionHours,
        resolutionRate: resolutionRate
      },
      departmentReport: departmentReport,
      priorityReport: priorityReport
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};