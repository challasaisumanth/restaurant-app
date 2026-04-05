require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const changePassword = async () => {
  try {
    console.log('Connecting...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('Connected!');

    const db = mongoose.connection.db;

    // ✅ Change this to your new password
    const newPassword = 'icemagic@harish5566';

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await db.collection('users').updateOne(
      { username: 'admin' },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      console.log('Admin user not found!');
    } else {
      console.log('✅ Password changed successfully!');
      console.log('Username: admin');
      console.log('New Password:', newPassword);
    }

    process.exit();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

changePassword();