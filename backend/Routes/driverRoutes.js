const express = require('express');
const router = express.Router();
const {
  getAllDrivers,
  getAvailableDrivers,
  getDriverById,
  getVendorSubscribersWithLocations,
  assignDriverToVendor,
  createDelivery,
  checkDriverVendorProximity,
  startDelivery,
  updateDriverLocationInDelivery,
  getActiveDelivery,
  getDeliveryTracking
} = require('../controllers/driverController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all drivers
router.get('/all', getAllDrivers);

// Get available drivers only  
router.get('/available', getAvailableDrivers);

// Get driver by ID
router.get('/:driverId', authMiddleware, getDriverById);

// Get vendor subscribers with locations
router.get('/vendor/:vendorId/subscribers', authMiddleware, getVendorSubscribersWithLocations);

// Assign driver to vendor
router.post('/assign', authMiddleware, assignDriverToVendor);

// Delivery management routes
router.post('/delivery/create', authMiddleware, createDelivery);
router.get('/delivery/proximity/:driverId/:vendorId', authMiddleware, checkDriverVendorProximity);
router.post('/delivery/:deliveryId/start', authMiddleware, startDelivery);
router.put('/delivery/:deliveryId/location', authMiddleware, updateDriverLocationInDelivery);
router.get('/delivery/active/:driverId', authMiddleware, getActiveDelivery);
router.get('/delivery/tracking/:customerId', getDeliveryTracking);

module.exports = router;