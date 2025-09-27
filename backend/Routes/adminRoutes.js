const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllVendors,
  deleteUser,
  deleteVendor
} = require('../Controllers/adminControllers');

// Admin middleware (simple check for now)
const adminAuth = (req, res, next) => {
  // For now, just pass through - in production you'd verify admin token
  next();
};

// Get all users
router.get('/users', adminAuth, getAllUsers);

// Get all vendors
router.get('/vendors', adminAuth, getAllVendors);

// Delete user
router.delete('/users/:userId', adminAuth, deleteUser);

// Delete vendor
router.delete('/vendors/:vendorId', adminAuth, deleteVendor);

module.exports = router;