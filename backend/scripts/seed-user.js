const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const dns = require('dns');

// Fix DNS resolution on Windows
try { dns.setServers(["8.8.8.8", "8.8.4.4"]); } catch (e) {}

dotenv.config({ path: './.env' });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'staff' },
  status: { type: String, default: 'active' }
});

const User = mongoose.model('User', userSchema);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = [
      { name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'admin' },
      { name: 'Employee One', email: 'employee1@example.com', password: 'employee123', role: 'employee' },
      { name: 'Employee Two', email: 'employee2@example.com', password: 'employee123', role: 'employee' },
      { name: 'Staff One', email: 'staff1@example.com', password: 'staff123', role: 'staff' },
      { name: 'Staff Two', email: 'staff2@example.com', password: 'staff123', role: 'staff' },
      { name: 'Manager User', email: 'manager@example.com', password: 'manager123', role: 'manager' }
    ];

    for (const user of users) {
      const existing = await User.findOne({ email: user.email });
      if (existing) {
        console.log(`${user.role} user already exists: ${user.email}`);
      } else {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await User.create({
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          status: 'active'
        });
        console.log(`Created ${user.role}: ${user.email} / ${user.password}`);
      }
    }

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seed();
