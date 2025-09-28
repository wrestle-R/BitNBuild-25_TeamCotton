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

  // Hosted checkout fallback page (served if in-app WebView JS blocked)
  hostedCheckoutPage(req, res) {
    const { orderId } = req.params;
    const publicKey = process.env.RAZORPAY_KEY_ID;
    if(!orderId || !publicKey){
      return res.status(400).send('Missing orderId or key');
    }
    // Minimal HTML that just opens Razorpay
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Processing Payment</title>
    <style>body{font-family:system-ui,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f7fb;color:#222}#box{background:#fff;padding:32px;border-radius:16px;box-shadow:0 10px 30px -5px rgba(0,0,0,.1);text-align:center;max-width:480px;width:100%}h1{font-size:22px;margin:0 0 12px}p{margin:4px 0 18px;font-size:14px;opacity:.75}button{background:#2563eb;color:#fff;border:none;padding:14px 26px;font-size:15px;font-weight:600;border-radius:8px;cursor:pointer}button:hover{background:#1d4ed8}.success{color:#16a34a}.error{color:#dc2626}</style>
    </head><body><div id="box"><h1 id="title">Launching Secure Payment</h1><p id="status">Please wait while we open Razorpay...</p><div id="result"></div><button id="retry" style="display:none" onclick="openRzp()">Retry</button></div>
    <script>
      const orderId='${orderId}';
      let opened=false;
      function setStatus(msg){ document.getElementById('status').textContent=msg; }
      function verify(resp){
        setStatus('Verifying payment...');
        fetch('/api/payment/verify-external',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ razorpay_order_id:resp.razorpay_order_id, razorpay_payment_id:resp.razorpay_payment_id, razorpay_signature:resp.razorpay_signature, payment_id: new URLSearchParams(window.location.search).get('pid') })})
          .then(r=>r.json()).then(j=>{ if(j.subscription_id){ document.getElementById('title').textContent='Payment Successful'; setStatus('Subscription Activated'); document.getElementById('result').innerHTML='<p class="success">Subscription ID: '+j.subscription_id+'</p>'; } else { throw new Error(j.message||'Verification failed'); } })
          .catch(e=>{ document.getElementById('result').innerHTML='<p class="error">'+e.message+'</p>'; });
      }
      function openRzp(){ try{ if(!window.Razorpay) throw new Error('Gateway not loaded'); var rzp=new Razorpay({key:'${publicKey}',order_id:orderId,handler:verify,modal:{ondismiss:function(){ setStatus('Payment cancelled'); }},theme:{color:'#2563eb'}}); opened=true; rzp.open(); }catch(e){ console.log(e); document.getElementById('retry').style.display='inline-block'; setStatus('Failed to open. Tap Retry.'); }}
      (function load(){ var s=document.createElement('script'); s.src='https://checkout.razorpay.com/v1/checkout.js'; s.onload=openRzp; s.onerror=function(){ setStatus('Failed to load payment script'); document.getElementById('retry').style.display='inline-block';}; document.head.appendChild(s); })();
      setTimeout(()=>{ if(!opened){ document.getElementById('retry').style.display='inline-block'; setStatus('Taking longer than expected... tap Retry'); } },8000);
    </script></body></html>`);
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

  // Public verification endpoint (used by hosted checkout page). Expects same payload.
  async verifyPaymentExternal(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !payment_id) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Reuse internal logic by mimicking req/res? Simpler: duplicate core steps.
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed' });
      }

      const payment = await Payment.findById(payment_id);
      if (!payment) return res.status(404).json({ message: 'Payment record not found' });
      if (payment.payment_status === 'success') {
        return res.json({ message: 'Already verified', subscription_id: payment.subscription_id });
      }

      payment.razorpay_payment_id = razorpay_payment_id;
      payment.razorpay_signature = razorpay_signature;
      payment.payment_status = 'success';
      payment.transaction_id = razorpay_payment_id;
      await payment.save();

      const plan = await Plan.findById(payment.plan_id);
      if (!plan) return res.status(404).json({ message: 'Plan not found' });
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + (plan.duration_days * 24 * 60 * 60 * 1000));
      const subscription = new ConsumerSubscription({
        consumer_id: payment.consumer_id,
        plan_id: payment.plan_id,
        vendor_id: payment.vendor_id,
        start_date: startDate,
        end_date: endDate
      });
      await subscription.save();
      payment.subscription_id = subscription._id;
      await payment.save();

      const vendor = await Vendor.findById(payment.vendor_id);
      if (vendor) {
        let currentEarnings = 0;
        if (vendor.earnings) {
          if (typeof vendor.earnings === 'object' && vendor.earnings.$numberDecimal) {
            currentEarnings = parseFloat(vendor.earnings.$numberDecimal);
          } else {
            currentEarnings = parseFloat(vendor.earnings) || 0;
          }
        }
        const newEarnings = currentEarnings + payment.amount;
        await Vendor.findByIdAndUpdate(payment.vendor_id, { earnings: newEarnings });
      }

      res.json({ message: 'Payment verified', subscription_id: subscription._id });
    } catch (error) {
      console.error('Error external verify:', error);
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