require('dotenv').config();
const mongoose = require('mongoose');

const fixCategories = async () => {
  try {
    console.log('Connecting...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('Connected!');

    const db = mongoose.connection.db;

    // Check current categories in DB
    const setting = await db.collection('settings')
      .findOne({ key: 'menu_categories' });

    console.log('Current categories in DB:', setting?.value);

    // ✅ Remove all menu items
    const deleteResult = await db.collection('menuitems').deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} menu items`);

    // ✅ Reset categories to empty (or default if you want)
    const correctCategories = []; // Empty to start fresh

    await db.collection('settings').updateOne(
      { key: 'menu_categories' },
      { $set: { value: correctCategories } },
      { upsert: true }
    );

    console.log('✅ Categories reset to:', correctCategories);

    // Also check what's in settings collection
    const allSettings = await db.collection('settings').find({}).toArray();
    console.log('All settings:', JSON.stringify(allSettings, null, 2));

    process.exit();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

fixCategories();