const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["admin", "employee", "staff", "manager"],
    required: true
  },
department: {
    type: String,
    enum: ["HR", "IT", "Finance", "Marketing & Sales", "Software & Product Development"]
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
},
{
  timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);