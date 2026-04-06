const express = require('express');
const router = express.Router();
const {
  getTables,
  getTableByNumber,
  createTable,
  updateTableStatus,
  deleteTable
} = require('../controllers/tableController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/public/:table_number', getTableByNumber);
router.get('/', protect, getTables);
router.post('/', protect, adminOnly, createTable);
router.put('/:table_number', protect, updateTableStatus);
router.delete('/:table_number', protect, adminOnly, deleteTable);

module.exports = router;