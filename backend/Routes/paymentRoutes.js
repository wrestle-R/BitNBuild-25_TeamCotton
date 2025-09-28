const express = require('express');
const router = express.Router();
const paymentController = require('../Controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create-order', authMiddleware, paymentController.createOrder);
router.post('/verify-payment', authMiddleware, paymentController.verifyPayment);
// External (hosted checkout) verification using Razorpay signature (no auth needed)
router.post('/verify-external', paymentController.verifyPaymentExternal);
router.get('/subscriptions', authMiddleware, paymentController.getSubscriptions);
// Hosted checkout fallback (no auth because order id alone not sensitive, but we still can enforce?)
router.get('/hosted-checkout/:orderId', paymentController.hostedCheckoutPage);

module.exports = router;