const mongoose = require('mongoose');

const goalsSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  dailyCalories: Number,
  protein: Number,
  carbs: Number,
  fats: Number,
  healthGoal: String,
  time: String
});

module.exports = mongoose.model('Goals', goalsSchema);
