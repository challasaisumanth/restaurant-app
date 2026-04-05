const express = require('express');
const router = express.Router();
const { generateBill, getBillHistory } = require('../controllers/billController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, generateBill);
router.get('/history', protect, adminOnly, getBillHistory);

module.exports = router;