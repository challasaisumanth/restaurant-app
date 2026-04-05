require('dotenv').config();
const mongoose = require('mongoose');

const test = async () => {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    
    console.log('Connected to:', conn.connection.host);
    console.log('DB Name:', conn.connection.name);
    
    // List all collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Count users
    const count = await conn.connection.db
      .collection('users')
      .countDocuments();
    console.log('Total users in DB:', count);
    
    // Find admin
    const admin = await conn.connection.db
      .collection('users')
      .findOne({ username: 'admin' });
    console.log('Admin found:', admin ? '✅ YES' : '❌ NO');
    if(admin) {
      console.log('Admin role:', admin.role);
    }
    
    process.exit();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

test();