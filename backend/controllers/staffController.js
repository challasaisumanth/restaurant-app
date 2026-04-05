const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

const getStaff = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const staff = await db.collection('users')
      .find({ role: 'staff' })
      .project({ password: 0 })
      .toArray();
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createStaff = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { name, username, password } = req.body;

    const existing = await db.collection('users')
      .findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('users').insertOne({
      name,
      username: username.toLowerCase(),
      password: hashedPassword,
      role: 'staff',
      createdAt: new Date()
    });

    res.status(201).json({ success: true, message: 'Staff created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;

    await db.collection('users').deleteOne({
      _id: new ObjectId(id),
      role: 'staff'
    });

    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getStaff, createStaff, deleteStaff };