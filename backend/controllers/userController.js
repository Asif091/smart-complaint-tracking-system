const User = require("../models/User");

// 🔹 Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};
// 🔹 Create new user (admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await require("../models/User").findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const bcrypt = require("bcrypt");
    const hashed = await bcrypt.hash(password, 10);

    const user = await require("../models/User").create({
      name,
      email,
      password: hashed,
      role,
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error creating user" });
  }
};
// 🔹 Deactivate user
exports.deactivateUser = async (req, res) => {
  try {
    const user = await require("../models/User").findByIdAndUpdate(
      req.params.id,
      { status: "inactive" },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error deactivating user" });
  }
};
// 🔹 Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const user = await require("../models/User").findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error updating user" });
  }
};