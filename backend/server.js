require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const startCleanupJob = require('./utils/cleanupOrders');
const keepAlive = require('./utils/keepAlive');

const app = express();
app.use(cors({
  origin: [
    'https://ice-magic.netlify.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Restaurant App API Running!' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  maxPoolSize: 10,
})
.then(() => {
  console.log('MongoDB Connected:', mongoose.connection.host);
  startCleanupJob();
  keepAlive();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
});