const mongoose = require("mongoose");

const actionLogSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      index: true // For faster queries
    },
    
    action: {
      type: String,
      enum: ["created", "assigned", "status_changed", "commented", "resolved"],
      required: true
    },
    
    // Status tracking (for status_changed action)
    oldStatus: {
      type: String,
      enum: ["pending", "assigned", "in-progress", "resolved", null],
      default: null
    },
    
    newStatus: {
      type: String,
      enum: ["pending", "assigned", "in-progress", "resolved", null],
      default: null
    },
    
    // Resolution notes / comments
    comment: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    
    // Who performed this action
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    // Denormalized user info (for display without populate)
    performedByName: {
      type: String,
      required: true
    },
    
    performedByRole: {
      type: String,
      enum: ["admin", "employee", "staff", "manager"],
      required: true
    },
    
    // Additional metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

// Index for efficient querying
actionLogSchema.index({ complaint: 1, createdAt: -1 });
actionLogSchema.index({ performedBy: 1 });

// Virtual for formatted timestamp
actionLogSchema.virtual("formattedDate").get(function() {
  return this.createdAt.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
});

// Static method to create a log entry
actionLogSchema.statics.logAction = async function(data) {
  try {
    const log = await this.create({
      complaint: data.complaintId,
      action: data.action,
      oldStatus: data.oldStatus || null,
      newStatus: data.newStatus || null,
      comment: data.comment || null,
      performedBy: data.userId,
      performedByName: data.userName,
      performedByRole: data.userRole,
      metadata: data.metadata || {}
    });
    return log;
  } catch (error) {
    console.error("Error creating action log:", error);
    throw error;
  }
};

// Static method to get complaint history
actionLogSchema.statics.getComplaintHistory = async function(complaintId) {
  try {
    return await this.find({ complaint: complaintId })
      .sort({ createdAt: -1 }) // Most recent first
      .lean(); // Return plain JavaScript objects
  } catch (error) {
    console.error("Error fetching complaint history:", error);
    throw error;
  }
};

module.exports = mongoose.model("ActionLog", actionLogSchema);