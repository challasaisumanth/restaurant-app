const express = require('express');
const router = express.Router();
const { getTables, createTable, updateTableStatus, deleteTable } = require('../controllers/tableController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ✅ Public route for customer
router.get('/public/:table_number', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const table = await db.collection('tables')
      .findOne({ table_number: parseInt(req.params.table_number) });
    res.json({ success: true, type: table?.type || 'non-ac' });
  } catch (error) {
    res.json({ success: true, type: 'non-ac' });
  }
});

router.get('/', protect, getTables);
router.post('/', protect, adminOnly, createTable);
router.put('/:table_number', protect, updateTableStatus);
router.delete('/:table_number', protect, adminOnly, deleteTable);

module.exports = router;