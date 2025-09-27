const express = require('express');
const { 
  verifyToken, 
  getProfile, 
  updateProfile, 
  getPreferences 
} = require('../Controllers/customerController');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get customer profile
router.get('/profile', getProfile);

// Update customer profile
router.put('/profile', updateProfile);

// Get customer preferences
router.get('/preferences', getPreferences);

module.exports = router;
