const mongoose = require('mongoose');

const consumerSubscriptionSchema = new mongoose.Schema({
  consumer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  start_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  end_date: {
    type: Date,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Calculate end_date before saving
consumerSubscriptionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('start_date')) {
    const plan = await mongoose.model('Plan').findById(this.plan_id);
    if (plan) {
      this.end_date = new Date(this.start_date.getTime() + (plan.duration_days * 24 * 60 * 60 * 1000));
    }
  }
  next();
});

module.exports = mongoose.model('ConsumerSubscription', consumerSubscriptionSchema);