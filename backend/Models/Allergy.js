const mongoose = require('mongoose');

const allergySchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  firebaseUid: {
    type: String,
    required: true
  },
  allergies: [{
    name: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild'
    }
  }],
  dietaryRestrictions: [{
    type: String,
    enum: ['gluten-free', 'dairy-free', 'nut-free', 'soy-free', 'egg-free', 'shellfish-free', 'vegan', 'vegetarian', 'other']
  }],
  additionalNotes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Ensure one allergy record per customer
allergySchema.index({ customerId: 1 }, { unique: true });
allergySchema.index({ firebaseUid: 1 }, { unique: true });

module.exports = mongoose.model('Allergy', allergySchema, 'allergies');
