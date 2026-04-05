const express = require('express');
const router = express.Router();
const { getOrder, saveOrder, deleteOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:table_number', protect, getOrder);
router.post('/', protect, saveOrder);
router.delete('/:table_number', protect, deleteOrder);

module.exports = router;