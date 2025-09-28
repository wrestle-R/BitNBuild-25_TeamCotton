const express = require('express');
const router = express.Router();
const goalController = require('../Controllers/goalControllers');

// Set or update customer goals
router.post('/set', goalController.setGoals);

// Get customer goals
router.get('/get', goalController.getGoals);

// Get AI nutrition analysis
router.get('/analysis', goalController.getNutritionAnalysis);

// Get nutrition tracking data
router.get('/tracking', goalController.getNutritionTracking);

module.exports = router;
