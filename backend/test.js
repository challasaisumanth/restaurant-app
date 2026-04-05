require('dotenv').config();
const mongoose = require('mongoose');

console.log('MONGO_URI:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 })
  .then(() => { 
    console.log('SUCCESS - DB works!'); 
    process.exit(); 
  })
  .catch(err => { 
    console.log('FAILED:', err.message); 
    process.exit(); 
  });