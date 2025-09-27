const mongoose = require('mongoose');

const customerUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  contactNumber: {
    type: String,
    required: false
  },
  address: {
    type: String,
    required: false
  },
}, {
  timestamps: true
});

// Update lastActive on save
customerUserSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model('Customer', customerUserSchema, 'customers');