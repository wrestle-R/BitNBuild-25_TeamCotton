const mongoose = require('mongoose');

// Add selected_meals field to the schema
const planSchema = new mongoose.Schema({
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  name: {
    type: String,
    required: true,
    enum: ['One day', 'All week', 'All month'] // Updated enum values
  },
  price: {
    type: Number,
    required: true,
    min: 0
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
  },
  selected_meals: {
    type: [String],
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);