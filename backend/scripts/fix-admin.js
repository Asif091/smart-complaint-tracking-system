const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

try { dns.setServers(["8.8.8.8", "8.8.4.4"]); } catch (e) {}

dotenv.config({ path: './.env' });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  status: String
});

const User = mongoose.model('User', userSchema);

async function updateAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const admin = await User.findOne({ email: 'admin@example.com' });
  if (admin) {
    console.log(`Current role: ${admin.role}`);
    admin.role = 'admin';
    await admin.save();
    console.log('Updated admin role to: admin');
  } else {
    console.log('Admin user not found');
  }
  
  await mongoose.disconnect();
}

updateAdmin().catch(console.error);