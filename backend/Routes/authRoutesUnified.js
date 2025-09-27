const express = require('express');
const { 
  createUser,
  validateRole,
  getUserByFirebaseUid
} = require('../Controllers/authControllersUnified');

const router = express.Router();

// Public routes for dual user authentication
router.post('/create-user', createUser);
router.post('/validate-role', validateRole);
router.get('/user/:firebaseUid', getUserByFirebaseUid);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'NourishNet API is running!', 
    timestamp: new Date().toISOString(),
    status: 'connected'
  });
});

module.exports = router;