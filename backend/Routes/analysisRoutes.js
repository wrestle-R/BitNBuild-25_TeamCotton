const express = require('express');
const analysisController = require('../Controllers/analysisController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Analyze plan against user allergies
router.post('/allergies', authMiddleware, analysisController.analyzeAllergies);

// Analyze plan against user goals
router.post('/goals', authMiddleware, analysisController.analyzeGoals);

module.exports = router;