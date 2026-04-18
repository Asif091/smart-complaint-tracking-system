const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium"
    },

    status: {
      type: String,
      enum: ["pending", "assigned", "in-progress", "resolved"],
      default: "pending"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    assignedDepartment: {
      type: String,
      enum: ["HR", "IT", "Finance", "Marketing & Sales", "Software & Product Development"],
      default: null
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    
    assignedAt: {
      type: Date,
      default: null
    },

    // Track resolution time
    resolvedAt: {
      type: Date,
      default: null
    },

    // Store last comment for quick display
    lastComment: {
      text: String,
      by: String,
      at: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for action history
complaintSchema.virtual("actionHistory", {
  ref: "ActionLog",
  localField: "_id",
  foreignField: "complaint",
  options: { sort: { createdAt: -1 } } // Most recent first
});

// Virtual for resolution time (in days)
complaintSchema.virtual("resolutionTime").get(function() {
  if (this.resolvedAt && this.createdAt) {
    const diffTime = Math.abs(this.resolvedAt - this.createdAt);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
});


module.exports = mongoose.model("Complaint", complaintSchema);