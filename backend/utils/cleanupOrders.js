const cron = require('node-cron');
const mongoose = require('mongoose');

const startCleanupJob = () => {
  // Runs every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const db = mongoose.connection.db;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await db.collection('orders').deleteMany({
        created_at: { $lt: thirtyDaysAgo }
      });

      console.log(`Cleanup job ran — deleted ${result.deletedCount} old orders`);
    } catch (err) {
      console.error('Cleanup job error:', err.message);
    }
  });

  console.log('Order cleanup job scheduled — runs daily at midnight');
};

module.exports = startCleanupJob;