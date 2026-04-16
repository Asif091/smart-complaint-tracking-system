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

async function deleteUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const emailsToDelete = [
      'test@test.com',
      'nabil@yahoo.com',
      'abc@yahoo.com',
      'rafid@example.com',
      'habib@example.com',
      'tt@gmail.com'
    ];

    const result = await User.deleteMany({ email: { $in: emailsToDelete } });
    console.log(`Deleted ${result.deletedCount} users`);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

deleteUsers();