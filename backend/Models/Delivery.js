const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  customers: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    address: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number] // [longitude, latitude]
    },
    estimatedArrival: Date,
    deliveryOrder: Number,
    status: {
      type: String,
      enum: ['pending', 'out_for_delivery', 'delivered', 'failed'],
      default: 'pending'
    },
    deliveredAt: Date
  }],
  status: {
    type: String,
    enum: ['assigned', 'started', 'in_progress', 'completed', 'cancelled'],
    default: 'assigned'
  },
  startedAt: Date,
  completedAt: Date,
  totalDistance: Number,
  estimatedTotalTime: Number, // in minutes
  driverLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

deliverySchema.index({ driverLocation: '2dsphere' });
deliverySchema.index({ vendorId: 1, status: 1 });
deliverySchema.index({ driverId: 1, status: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);