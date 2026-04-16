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

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find().select('email role');
  console.log('Users in database:');
  users.forEach(u => console.log(`  ${u.email}: ${u.role}`));
  await mongoose.disconnect();
}

check().catch(console.error);