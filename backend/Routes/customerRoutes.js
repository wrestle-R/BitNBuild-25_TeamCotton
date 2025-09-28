const express = require('express');
const multer = require('multer');
const customerController = require('../controllers/customerController'); // Note: lowercase 'controllers'

const authMiddleware = require('../middleware/authMiddleware');
const uploadController = require('../controllers/uploadController'); // Note: lowercase 'controllers'

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

// Get vendor menus
router.get('/vendors/:vendorId/menus', authMiddleware, customerController.getVendorMenus);

// Get customer profile
router.get('/profile', authMiddleware, customerController.getProfile);

// Update customer profile
router.put('/profile', authMiddleware, customerController.updateProfile);

// Update only location (address + coordinates)
router.patch('/location', authMiddleware, customerController.updateLocation);

// Get customer preferences
router.get('/preferences', authMiddleware, customerController.getPreferences);

// Upload customer profile image
router.post('/upload/image', authMiddleware, upload.single('image'), uploadController.uploadImage);

// Get single vendor details (duplicate route - you can remove this)
// router.get('/vendor/:vendorId', authMiddleware, customerController.getVendorById);

// Get vendor plans (duplicate route - you can remove this)
// router.get('/vendor/:vendorId/plans', authMiddleware, customerController.getVendorPlans);

// Dashboard routes - Fix the function names to match what exists in customerController.js
router.get('/dashboard', authMiddleware, customerController.getDashboardData);
router.get('/dashboard/activity', authMiddleware, customerController.getRecentActivity);

module.exports = router;
