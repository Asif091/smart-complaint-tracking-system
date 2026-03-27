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

    status: {
      type: String,
      enum: ["pending", "assigned", "in-progress", "resolved"],
      default: "pending"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
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
    }

  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);