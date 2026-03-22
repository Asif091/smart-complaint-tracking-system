const Complaint = require("../models/Complaint");

exports.createComplaint = async (req, res) => {
  try {
    
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Only employees can create complaints" });
    }

    const { title, description } = req.body;

    const complaint = await require("../models/Complaint").create({
      title,
      description,
      createdBy: req.user.id, 
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Error creating complaint" });
  }
};
exports.getComplaints = async (req, res) => {
  try {
    const complaints = await require("../models/Complaint").find();

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Error fetching complaints" });
  }
};