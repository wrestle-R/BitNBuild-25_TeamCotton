const mongoose = require('mongoose');

const vendorUserSchema = new mongoose.Schema({
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
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  earnings: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
    required: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  profileImage: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Update lastActive on save
vendorUserSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model('Vendor', vendorUserSchema, 'vendors');