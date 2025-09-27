const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create-order', authMiddleware, paymentController.createOrder);
router.post('/verify', authMiddleware, paymentController.verifyPayment);
router.get('/subscriptions', authMiddleware, paymentController.getSubscriptions);

module.exports = router;