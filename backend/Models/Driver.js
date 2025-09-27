const mongoose = require('mongoose');

const driverUserSchema = new mongoose.Schema({
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
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: {
      type: String,
      default: ''
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  vehicleType: {
    type: String,
    required: false,
    enum: ['bike', 'car', 'truck', 'van'],
    default: 'bike'
  },
  vehicleNumber: {
    type: String,
    required: false
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
  available: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Update lastActive on save
driverUserSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

// Create geospatial index for location queries
driverUserSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Driver', driverUserSchema, 'drivers');