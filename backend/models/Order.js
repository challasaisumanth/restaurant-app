const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  table_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  items: [
    {
      menuItem_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
      },
      name: String,
      price: Number,
      quantity: {
        type: Number,
        default: 1
      }
    }
  ],
  notes: {
    type: String,
    default: ''
  },
  total_price: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30
  }
});

module.exports = mongoose.model('Order', orderSchema);