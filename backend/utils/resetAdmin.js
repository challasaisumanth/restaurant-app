require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, lowercase: true },
  password: String,
  role: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const reset = async () => {
  try {
    console.log('Connecting...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('Connected!');

    await User.deleteMany({});
    console.log('Cleared old users');

    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin',
      username: 'admin',
      password: hashed,
      role: 'admin'
    });

    console.log('✅ Admin reset successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');

    const check = await User.findOne({ username: 'admin' });
    console.log('Verified in DB:', check ? '✅ Found!' : '❌ Not found!');

    process.exit();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

reset();