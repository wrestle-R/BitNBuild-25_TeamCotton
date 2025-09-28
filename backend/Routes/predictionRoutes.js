const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { getProfitPrediction, getBusinessAnalytics } = require('../Controllers/predictionController');

// Get profit prediction for a specific plan
router.get('/profit/:planId', authMiddleware, getProfitPrediction);

// Get overall business analytics
router.get('/analytics', authMiddleware, getBusinessAnalytics);

module.exports = router;