const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const getTables = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const tables = await db.collection('tables')
      .find({}).sort({ table_number: 1 }).toArray();
    res.json({ success: true, tables });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createTable = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { table_number, type } = req.body;

    if (!table_number) return res.status(400).json({ message: 'Table number required' });

    const existing = await db.collection('tables').findOne({ table_number: parseInt(table_number) });
    if (existing) return res.status(400).json({ message: 'Table number already exists' });

    await db.collection('tables').insertOne({
      table_number: parseInt(table_number),
      table_name: `Table ${table_number}`,
      type: type || 'non-ac',   // 'ac' or 'non-ac'
      status: 'available',
      createdAt: new Date()
    });

    res.status(201).json({ success: true, message: 'Table created' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateTableStatus = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { table_number } = req.params;
    const { status, table_name, type } = req.body;

    const table = await db.collection('tables')
      .findOne({ table_number: parseInt(table_number) });

    if (!table) return res.status(404).json({ message: 'Table not found' });

    const updates = {};
    if (status) updates.status = status;
    if (table_name) updates.table_name = table_name;
    if (type) updates.type = type;

    await db.collection('tables').updateOne(
      { table_number: parseInt(table_number) },
      { $set: updates }
    );

    res.json({ success: true, message: 'Table updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteTable = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { table_number } = req.params;

    const result = await db.collection('tables')
      .deleteOne({ table_number: parseInt(table_number) });

    if (result.deletedCount === 0)
      return res.status(404).json({ message: 'Table not found' });

    res.json({ success: true, message: 'Table deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getTables, createTable, updateTableStatus, deleteTable };