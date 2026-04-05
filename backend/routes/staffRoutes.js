const express = require('express');
const router = express.Router();
const { getStaff, createStaff, deleteStaff } = require('../controllers/staffController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, getStaff);
router.post('/', protect, adminOnly, createStaff);
router.delete('/:id', protect, adminOnly, deleteStaff);

module.exports = router;