const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

try { dns.setServers(["8.8.8.8", "8.8.4.4"]); } catch (e) {}

dotenv.config({ path: './.env' });

const complaintSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  status: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedDepartment: String,
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', complaintSchema);
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  status: String
});

const User = mongoose.model('User', userSchema);

async function deleteAdminComplaints() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminUsers = await User.find({ role: 'admin' });
    const adminIds = adminUsers.map(u => u._id);
    console.log('Admin IDs:', adminIds);

    const result = await Complaint.deleteMany({ createdBy: { $in: adminIds } });
    console.log(`Deleted ${result.deletedCount} complaints created by admins`);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

deleteAdminComplaints();