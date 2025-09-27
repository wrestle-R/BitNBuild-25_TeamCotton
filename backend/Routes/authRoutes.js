const express = require('express');
const { 
  createUser,
  validateRole,
  getUserByFirebaseUid,
  updateDriverProfile
} = require('../Controllers/authControllers');

const router = express.Router();

// Public routes for dual user authentication
router.post('/create-user', createUser);
router.post('/validate-role', validateRole);
router.get('/user/:firebaseUid', getUserByFirebaseUid);
router.put('/update-driver', updateDriverProfile);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'NourishNet API is running!', 
    timestamp: new Date().toISOString(),
    status: 'connected'
  });
});

module.exports = router;