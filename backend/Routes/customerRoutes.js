const express = require('express');
const multer = require('multer');
const customerController = require('../Controllers/customerController');
const uploadController = require('../Controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Get all verified vendors
router.get('/vendors', authMiddleware, customerController.getVerifiedVendors);

// Get single vendor by ID
router.get('/vendors/:vendorId', authMiddleware, customerController.getVendorById);

// Get vendor meal plans
router.get('/vendors/:vendorId/plans', authMiddleware, customerController.getVendorPlans);

// Get customer profile
router.get('/profile', authMiddleware, customerController.getProfile);

// Update customer profile
router.put('/profile', authMiddleware, customerController.updateProfile);

// Get customer preferences
router.get('/preferences', authMiddleware, customerController.getPreferences);

// Upload customer profile image
router.post('/upload/image', authMiddleware, upload.single('image'), uploadController.uploadImage);

// Debug upload route to inspect multer file object during development
router.post('/debug-upload', authMiddleware, upload.single('image'), uploadController.debugUpload);

module.exports = router;
