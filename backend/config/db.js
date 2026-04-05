const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    maxPoolSize: 10,
  });
  console.log(`MongoDB Connected: ${mongoose.connection.host}`);
};

module.exports = connectDB;