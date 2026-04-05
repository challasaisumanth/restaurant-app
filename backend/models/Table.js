const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  table_number: {
    type: Number,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'billing_pending'],
    default: 'available'
  },
  qr_code_url: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);