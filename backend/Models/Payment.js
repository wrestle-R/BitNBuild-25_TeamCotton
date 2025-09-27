const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConsumerSubscription',
    required: false // Change this from true to false
  },
  consumer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_method: {
    type: String,
    enum: ['upi', 'card', 'wallet', 'netbanking'],
    required: true
  },
  payment_status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  razorpay_order_id: {
    type: String,
    required: true
  },
  razorpay_payment_id: {
    type: String
  },
  razorpay_signature: {
    type: String
  },
  transaction_id: {
    type: String
  },
  payment_date: {
    type: Date,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);