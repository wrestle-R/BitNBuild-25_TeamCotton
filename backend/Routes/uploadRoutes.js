const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware'); // If you want to protect the route

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// POST /api/upload/image
router.post('/image', authMiddleware, upload.single('image'), uploadController.uploadImage);

module.exports = router;