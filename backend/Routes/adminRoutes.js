const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllVendors,
  deleteUser,
  deleteVendor,
  toggleVendorVerification,
  getVendorDetails,
  createTestVendors,
  getDashboardStats
} = require('../Controllers/adminControllers');

// Admin middleware (simple check for now)
const adminAuth = (req, res, next) => {
  // For now, just pass through - in production you'd verify admin token
  next();
};

// Get dashboard statistics
router.get('/dashboard-stats', adminAuth, getDashboardStats);

// Get all users
router.get('/users', adminAuth, getAllUsers);

// Get all vendors
router.get('/vendors', adminAuth, getAllVendors);

// Get vendor details
router.get('/vendors/:vendorId', adminAuth, getVendorDetails);

// Toggle vendor verification
router.patch('/vendors/:vendorId/verification', adminAuth, toggleVendorVerification);

// Delete user
router.delete('/users/:userId', adminAuth, deleteUser);

// Delete vendor
router.delete('/vendors/:vendorId', adminAuth, deleteVendor);

// Create test vendors (for development)
router.post('/create-test-vendors', adminAuth, createTestVendors);

module.exports = router;