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
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', complaintSchema);
const userSchema = new mongoose.Schema({ name: String, email: String, password: String, role: String, status: String });
const User = mongoose.model('User', userSchema);

async function deleteComplaints() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const employee = await User.findOne({ email: 'employee1@example.com' });
    console.log('Employee:', employee);

    const result = await Complaint.deleteMany({
      createdBy: employee._id,
      category: { $in: ['Network Problem', 'Hardware Issue'] }
    });
    console.log(`Deleted ${result.deletedCount} complaints`);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

deleteComplaints();