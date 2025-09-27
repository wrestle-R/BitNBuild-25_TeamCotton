const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../Models/Payment');
const ConsumerSubscription = require('../Models/ConsumerSubscription');
const Plan = require('../Models/Plan');
const Customer = require('../Models/Customer');
const Vendor = require('../Models/Vendor');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const paymentController = {
  // Create Razorpay order
  async createOrder(req, res) {
    try {
      const { plan_id, vendor_id } = req.body;
      
      // Get customer
      const customer = await Customer.findOne({ firebaseUid: req.user.firebaseUid });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Get plan details
      const plan = await Plan.findById(plan_id).populate('vendor_id');
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      // Convert price to paise (Razorpay expects amount in smallest currency unit)
      const amount = Math.round(plan.price * 100);

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          plan_id: plan_id,
          vendor_id: vendor_id,
          customer_id: customer._id.toString()
        }
      });

      // Create payment record
      const payment = new Payment({
        subscription_id: null, // Will be updated after subscription creation
        consumer_id: customer._id,
        vendor_id,
        plan_id,
        amount: plan.price,
        payment_method: 'card', // Will be updated after payment
        razorpay_order_id: order.id
      });
      await payment.save();

      res.json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        payment_id: payment._id,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_UKHiHLEpvJ8wdz'
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
  },

  // Verify payment and create subscription
  async verifyPayment(req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_id
      } = req.body;

      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        return res.status(400).json({ message: 'Payment verification failed' });
      }

      // Update payment record
      const payment = await Payment.findById(payment_id);
      if (!payment) {
        return res.status(404).json({ message: 'Payment record not found' });
      }

      payment.razorpay_payment_id = razorpay_payment_id;
      payment.razorpay_signature = razorpay_signature;
      payment.payment_status = 'success';
      payment.transaction_id = razorpay_payment_id;
      await payment.save();

      // Get plan to calculate end_date
      const plan = await Plan.findById(payment.plan_id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      // Calculate end_date
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + (plan.duration_days * 24 * 60 * 60 * 1000));

      // Create subscription with calculated end_date
      const subscription = new ConsumerSubscription({
        consumer_id: payment.consumer_id,
        plan_id: payment.plan_id,
        vendor_id: payment.vendor_id,
        start_date: startDate,
        end_date: endDate
      });
      await subscription.save();

      // Update payment with subscription ID
      payment.subscription_id = subscription._id;
      await payment.save();

      // Update vendor earnings - Get current vendor first
      const vendor = await Vendor.findById(payment.vendor_id);
      if (vendor) {
        let currentEarnings = 0;
        
        // Handle existing earnings (could be Decimal128 or number)
        if (vendor.earnings) {
          if (typeof vendor.earnings === 'object' && vendor.earnings.$numberDecimal) {
            currentEarnings = parseFloat(vendor.earnings.$numberDecimal);
          } else {
            currentEarnings = parseFloat(vendor.earnings) || 0;
          }
        }
        
        // Add new payment amount
        const newEarnings = currentEarnings + payment.amount;
        
        // Update vendor earnings
        await Vendor.findByIdAndUpdate(
          payment.vendor_id,
          { earnings: newEarnings }
        );
        
        console.log(`Updated vendor ${payment.vendor_id} earnings: ${currentEarnings} + ${payment.amount} = ${newEarnings}`);
      }

      res.json({
        message: 'Payment verified and subscription created successfully',
        subscription_id: subscription._id
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
  },

  // Get customer subscriptions
  async getSubscriptions(req, res) {
    try {
      const customer = await Customer.findOne({ firebaseUid: req.user.firebaseUid });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const subscriptions = await ConsumerSubscription.find({ consumer_id: customer._id })
        .populate({
          path: 'plan_id',
          populate: { path: 'vendor_id', select: 'name profileImage' }
        })
        .populate('vendor_id', 'name profileImage')
        .sort({ created_at: -1 });

      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ message: 'Failed to fetch subscriptions', error: error.message });
    }
  }
};

module.exports = paymentController;