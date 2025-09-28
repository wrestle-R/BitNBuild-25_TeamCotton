const express = require('express');
const allergyController = require('../Controllers/allergyController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get customer allergies
router.get('/', authMiddleware, allergyController.getAllergies);

// Create or update customer allergies
router.post('/', authMiddleware, allergyController.updateAllergies);
router.put('/', authMiddleware, allergyController.updateAllergies);

// Delete customer allergies
router.delete('/', authMiddleware, allergyController.deleteAllergies);

module.exports = router;
