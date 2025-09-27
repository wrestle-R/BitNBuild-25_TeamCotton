const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  duration_days: {
    type: Number,
    required: true,
    enum: [1, 7, 30]
  },
  meals_per_day: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);