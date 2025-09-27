const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  non_veg: {
    type: Boolean,
    required: true,
    default: false
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    image_url: {
      type: String,
      required: false
    }
  }],
  meal_type: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Menu', menuSchema);