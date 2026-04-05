const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const getMenuItems = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { category, search } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const items = await db.collection('menuitems')
      .find(filter).sort({ category: 1, name: 1 }).toArray();
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const setting = await db.collection('settings')
      .findOne({ key: 'menu_categories' });
    if (setting) {
      res.json({ success: true, categories: setting.value });
    } else {
      const defaultCategories = ['Starters', 'Main Course', 'Ice Creams', 'Beverages'];
      await db.collection('settings').insertOne({
        key: 'menu_categories',
        value: defaultCategories
      });
      res.json({ success: true, categories: defaultCategories });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addCategory = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { category } = req.body;
    if (!category) return res.status(400).json({ message: 'Category required' });
    const setting = await db.collection('settings')
      .findOne({ key: 'menu_categories' });
    let categories = setting ? setting.value : ['Starters', 'Main Course', 'Ice Creams', 'Beverages'];
    if (categories.includes(category)) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    categories.push(category);
    await db.collection('settings').updateOne(
      { key: 'menu_categories' },
      { $set: { value: categories } },
      { upsert: true }
    );
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { category } = req.params;
    const setting = await db.collection('settings')
      .findOne({ key: 'menu_categories' });
    let categories = setting ? setting.value : [];
    categories = categories.filter(c => c !== category);
    await db.collection('settings').updateOne(
      { key: 'menu_categories' },
      { $set: { value: categories } },
      { upsert: true }
    );
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const addMenuItem = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { name, category, ac_price, non_ac_price, image_url, description, availability } = req.body;

    if (!ac_price || !non_ac_price) {
      return res.status(400).json({ message: 'Both AC and Non-AC prices are required' });
    }

    await db.collection('menuitems').insertOne({
      name,
      category,
      ac_price: parseFloat(ac_price),
      non_ac_price: parseFloat(non_ac_price),
      image_url: image_url || '',
      description: description || '',
      availability: availability !== undefined ? availability : true,
      createdAt: new Date()
    });
    res.status(201).json({ success: true, message: 'Item added' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.ac_price) updates.ac_price = parseFloat(updates.ac_price);
    if (updates.non_ac_price) updates.non_ac_price = parseFloat(updates.non_ac_price);
    // Remove old price field if accidentally sent
    delete updates.price;

    await db.collection('menuitems').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    res.json({ success: true, message: 'Item updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;
    await db.collection('menuitems').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;
    const item = await db.collection('menuitems')
      .findOne({ _id: new ObjectId(id) });
    await db.collection('menuitems').updateOne(
      { _id: new ObjectId(id) },
      { $set: { availability: !item.availability } }
    );
    res.json({ success: true, availability: !item.availability });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMenuItems,
  getCategories,
  addCategory,
  deleteCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability
};