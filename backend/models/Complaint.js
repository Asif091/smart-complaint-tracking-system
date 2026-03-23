const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: true
  },

  category: 
  {
    type: String,
    required: true
  },

  priority:
  {
    type: String,
    default: "Medium"
  },

  status:
  {
    type: String,
    default: "Pending"
  },

  submittedBy: 
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
},
{
  timestamps: true
}
);

module.exports = mongoose.model("Complaint", complaintSchema);