const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getCategories,
  addCategory,
  deleteCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability
} = require('../controllers/menuController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/categories', getCategories);
router.post('/categories', protect, adminOnly, addCategory);
router.delete('/categories/:category', protect, adminOnly, deleteCategory);
router.get('/', getMenuItems);
router.post('/', protect, adminOnly, addMenuItem);
router.put('/:id', protect, adminOnly, updateMenuItem);
router.delete('/:id', protect, adminOnly, deleteMenuItem);
router.patch('/:id/toggle', protect, adminOnly, toggleAvailability);

module.exports = router;