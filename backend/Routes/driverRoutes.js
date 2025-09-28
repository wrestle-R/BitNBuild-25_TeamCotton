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
  getAllDriverDeliveries,
  getDeliveryTracking
} = require('../Controllers/driverController');
const authMiddleware = require('../middleware/authMiddleware');
const hybridAuthMiddleware = require('../middleware/hybridAuthMiddleware');

// Get all drivers
router.get('/all', getAllDrivers);

// Get available drivers only  
router.get('/available', getAvailableDrivers);

// Debug endpoint to check database contents
router.get('/debug/database', hybridAuthMiddleware, async (req, res) => {
  try {
    const Driver = require('../Models/Driver');
    const Delivery = require('../Models/Delivery');
    const Vendor = require('../Models/Vendor');
    
    const drivers = await Driver.find({}, { _id: 1, name: 1, email: 1 });
    const deliveries = await Delivery.find({}).populate('vendorId', 'name').populate('driverId', 'name');
    const vendors = await Vendor.find({}, { _id: 1, name: 1, email: 1 });
    
    res.json({
      success: true,
      data: {
        drivers: drivers.map(d => ({ id: d._id.toString(), name: d.name, email: d.email })),
        vendors: vendors.map(v => ({ id: v._id.toString(), name: v.name, email: v.email })),
        deliveries: deliveries.map(d => ({ 
          id: d._id.toString(), 
          driverId: d.driverId?._id?.toString(), 
          driverName: d.driverId?.name,
          vendorId: d.vendorId?._id?.toString(), 
          vendorName: d.vendorId?.name,
          status: d.status,
          customersCount: d.customers?.length || 0
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delivery management routes (put these BEFORE the generic /:driverId route)
router.post('/delivery/create', authMiddleware, createDelivery);
router.get('/delivery/proximity/:driverId/:vendorId', hybridAuthMiddleware, checkDriverVendorProximity);
router.post('/delivery/:deliveryId/start', hybridAuthMiddleware, startDelivery);
router.put('/delivery/:deliveryId/location', hybridAuthMiddleware, updateDriverLocationInDelivery);
router.get('/delivery/active/:driverId', hybridAuthMiddleware, getActiveDelivery);
router.get('/delivery/tracking/:customerId', getDeliveryTracking);
router.get('/deliveries/:driverId', hybridAuthMiddleware, getAllDriverDeliveries);

// Get vendor subscribers with locations
router.get('/vendor/:vendorId/subscribers', authMiddleware, getVendorSubscribersWithLocations);

// Assign driver to vendor
router.post('/assign', authMiddleware, assignDriverToVendor);

// Get driver by ID (put this LAST as it's a catch-all route)
router.get('/:driverId', authMiddleware, getDriverById);

module.exports = router;