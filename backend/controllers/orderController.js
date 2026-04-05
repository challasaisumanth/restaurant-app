const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const getOrder = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { table_number } = req.params;

    const order = await db.collection('orders')
      .findOne({ table_number: parseInt(table_number) });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const saveOrder = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { table_number, items, notes } = req.body;

    const total_price = items.reduce((sum, item) =>
      sum + (item.price * item.quantity), 0);

    const existing = await db.collection('orders')
      .findOne({ table_number: parseInt(table_number) });

    if (existing) {
      await db.collection('orders').updateOne(
        { table_number: parseInt(table_number) },
        { $set: { items, notes, total_price, updatedAt: new Date() } }
      );
    } else {
      await db.collection('orders').insertOne({
        table_number: parseInt(table_number),
        items,
        notes: notes || '',
        total_price,
        created_at: new Date(),
        updatedAt: new Date()
      });

      await db.collection('tables').updateOne(
        { table_number: parseInt(table_number) },
        { $set: { status: 'occupied' } }
      );
    }

    res.json({ success: true, total_price });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { table_number } = req.params;

    await db.collection('orders').deleteOne({
      table_number: parseInt(table_number)
    });

    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getOrder, saveOrder, deleteOrder };