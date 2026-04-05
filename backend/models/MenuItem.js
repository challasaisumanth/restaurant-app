const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Starters', 'Main Course', 'Ice Creams', 'Beverages']
  },
  price: {
    type: Number,
    required: true
  },
  image_url: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  availability: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);