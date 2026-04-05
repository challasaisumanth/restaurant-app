const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  customer_name: {
    type: String,
    required: true,
    trim: true
  },
  table_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  table_number: {
    type: Number,
    required: true
  },
  items: [
    {
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  total_amount: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    enum: ['Cash', 'UPI', 'Card'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);