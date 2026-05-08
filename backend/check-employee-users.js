const mongoose = require('mongoose');
const uri = 'mongodb://127.0.0.1:27017/smart-complaint-tracking-system';

const schema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  status: String,
}, { collection: 'users' });

const User = mongoose.model('User', schema);

mongoose.connect(uri).then(async () => {
  try {
    const users = await User.find({ email: { $in: ['employee1@example.com', 'employee2@example.com', 'admin@example.com'] } }, 'email role status password');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}).catch((err) => {
  console.error('Connection error:', err);
  process.exit(1);
});
