const mongoose = require('mongoose');

const generateBill = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { customer_name, table_number, items, total_amount, payment_method } = req.body;

    await db.collection('bills').insertOne({
      customer_name,
      table_number: parseInt(table_number),
      items,
      total_amount,
      payment_method,
      createdAt: new Date()
    });

    await db.collection('orders').deleteOne({
      table_number: parseInt(table_number)
    });

    await db.collection('tables').updateOne(
      { table_number: parseInt(table_number) },
      { $set: { status: 'available' } }
    );

    res.status(201).json({ success: true, message: 'Bill generated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getBillHistory = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const bills = await db.collection('bills')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, bills });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { generateBill, getBillHistory };