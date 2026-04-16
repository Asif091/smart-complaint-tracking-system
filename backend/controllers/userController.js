const User = require("../models/User");
const bcrypt = require("bcrypt");

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    ).select("-password");

    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect old password" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;  // <<<<<< NEW: added department

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }
    if (role === "admin") {
      return res.status(403).json({ message: "Cannot create admin users. Contact developer." });
    }
    // <<<<<< NEW - START: Validate department for employee role
    if (role === "employee" && !department) {
      return res.status(400).json({ message: "Department is required for employees" });
    }
    // <<<<<< NEW - END

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // <<<<<< NEW - START: Build user data with department for employees
    const userData = {
      name,
      email,
      password: hashed,
      role,
    };

    if (role === "employee" && department) {
      userData.department = department;
    }
    // <<<<<< NEW - END

    const user = await User.create(userData);  // <<<<<< NEW: using userData instead of direct object

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error creating user" });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current user to determine new status
    const currentUser = await User.findById(id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("Current user status:", currentUser.status);
    
    // Toggle status: if active, make inactive; if inactive, make active
    const newStatus = currentUser.status === "active" ? "inactive" : "active";
    console.log("New status:", newStatus);

    const user = await User.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `User ${newStatus === "active" ? "activated" : "deactivated"}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, department } = req.body;
    if (role === "admin") {
      return res.status(403).json({ message: "Cannot assign admin role. Contact developer." });
    }
    
    const updateData = { name, email, role };
    if (department) {
      updateData.department = department;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error updating user" });
  }
};