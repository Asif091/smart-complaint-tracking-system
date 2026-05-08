const Complaint = require('../models/Complaint');

// Predefined departments in order
const ALL_DEPARTMENTS = [
  "HR",
  "IT",
  "Finance",
  "Marketing & Sales",
  "Software & Product Development"
];

exports.getDepartmentStats = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    // Parse query params
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // 1. Aggregate complaints: total, status breakdown, priority counts per department
    const matchStage = { $match: { assignedDepartment: { $ne: null }, ...dateFilter } };
    const groupStage = {
      $group: {
        _id: "$assignedDepartment",
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ["$status", "assigned"] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] } }
      }
    };
    const stats = await Complaint.aggregate([matchStage, groupStage]);

    // 2. Average resolution time (days & hours) per department (only resolved complaints within date range)
    const resolvedMatch = {
      $match: {
        assignedDepartment: { $ne: null },
        status: "resolved",
        resolvedAt: { $ne: null },
        ...dateFilter
      }
    };
    const resolutionGroup = {
      $group: {
        _id: "$assignedDepartment",
        avgResolutionDays: { $avg: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60 * 24] } },
        avgResolutionHours: { $avg: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60] } }
      }
    };
    const resolutionStats = await Complaint.aggregate([resolvedMatch, resolutionGroup]);

    // Build result for all departments (including zero complaints)
    const result = ALL_DEPARTMENTS.map(dept => {
      const deptStats = stats.find(s => s._id === dept) || {
        total: 0,
        pending: 0,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      };
      const deptResolution = resolutionStats.find(r => r._id === dept);
      return {
        department: dept,
        total: deptStats.total,
        pending: deptStats.pending,
        assigned: deptStats.assigned,
        inProgress: deptStats.inProgress,
        resolved: deptStats.resolved,
        low: deptStats.low,
        medium: deptStats.medium,
        high: deptStats.high,
        critical: deptStats.critical,
        avgResolutionDays: deptResolution ? deptResolution.avgResolutionDays.toFixed(2) : null,
        avgResolutionHours: deptResolution ? deptResolution.avgResolutionHours.toFixed(1) : null
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Department stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};