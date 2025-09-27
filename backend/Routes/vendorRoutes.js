const express = require('express');
const router = express.Router();
const vendorController = require('../Controllers/vendorController');
const uploadController = require('../Controllers/uploadController');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware'); // <-- Add this

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Profile routes
router.get('/profile', authMiddleware, vendorController.getProfile);
router.put('/profile', authMiddleware, vendorController.updateProfile);

// Stats route
router.get('/stats', authMiddleware, vendorController.getStats);

// Menu routes
router.get('/menus', authMiddleware, vendorController.getMenus);
router.post('/menus', authMiddleware, vendorController.createMenu);
router.put('/menus/:id', authMiddleware, vendorController.updateMenu);
router.delete('/menus/:id', authMiddleware, vendorController.deleteMenu);

// Plan routes
router.get('/plans', authMiddleware, vendorController.getPlans);
router.post('/plans', authMiddleware, vendorController.createPlan);
router.put('/plans/:id', authMiddleware, vendorController.updatePlan);
router.delete('/plans/:id', authMiddleware, vendorController.deletePlan);
router.get('/plans/:planId/menus', authMiddleware, vendorController.getPlanMenus);

// Upload route
router.post('/upload/image', authMiddleware, upload.single('image'), uploadController.uploadImage);

module.exports = router;