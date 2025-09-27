const mongoose = require('mongoose');

const planMenuSchema = new mongoose.Schema({
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  menu_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  },
  day_number: {
    type: Number,
    required: true,
    min: 1
  },
  meal_number: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PlanMenu', planMenuSchema);