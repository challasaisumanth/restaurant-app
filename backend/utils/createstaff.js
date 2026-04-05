require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const createStaff = async () => {
  try {
    console.log('Connecting...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('Connected!');

    const db = mongoose.connection.db;

    const existing = await db.collection('users')
      .findOne({ username: 'staff1' });

    if (existing) {
      console.log('Staff already exists!');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('staff123', 10);

    await db.collection('users').insertOne({
      name: 'Staff One',
      username: 'staff1',
      password: hashedPassword,
      role: 'staff',
      createdAt: new Date()
    });

    console.log('✅ Staff created successfully!');
    console.log('Username: staff1');
    console.log('Password: staff123');
    process.exit();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

createStaff();