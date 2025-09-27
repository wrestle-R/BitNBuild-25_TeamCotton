const Customer = require('../Models/Customer');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nourishnet_secret_key_2024');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Get customer profile
const getProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ firebaseUid: req.user.firebaseUid });
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({
      id: customer._id,
      name: customer.name,
      email: customer.email,
      firebaseUid: customer.firebaseUid,
      contactNumber: customer.contactNumber,
      address: customer.address,
      photoUrl: customer.photoUrl,
      preference: customer.preference,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update customer profile
const updateProfile = async (req, res) => {
  try {
    const { name, contactNumber, address, photoUrl, preference } = req.body;
    
    // Find customer by firebaseUid from token
    const customer = await Customer.findOne({ firebaseUid: req.user.firebaseUid });
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate input data
    if (name && name.trim().length === 0) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }

    if (preference && !['veg', 'nonveg'].includes(preference)) {
      return res.status(400).json({ message: 'Preference must be either "veg" or "nonveg"' });
    }

    // Update only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (address !== undefined) updateData.address = address;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (preference !== undefined) updateData.preference = preference;

    const updatedCustomer = await Customer.findOneAndUpdate(
      { firebaseUid: req.user.firebaseUid },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      customer: {
        id: updatedCustomer._id,
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        firebaseUid: updatedCustomer.firebaseUid,
        contactNumber: updatedCustomer.contactNumber,
        address: updatedCustomer.address,
        photoUrl: updatedCustomer.photoUrl,
        preference: updatedCustomer.preference,
        createdAt: updatedCustomer.createdAt,
        updatedAt: updatedCustomer.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed: ' + validationErrors.join(', ')
      });
    }

    res.status(500).json({ 
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get customer preferences
const getPreferences = async (req, res) => {
  try {
    const customer = await Customer.findOne(
      { firebaseUid: req.user.firebaseUid },
      { preference: 1, name: 1 }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({
      preference: customer.preference,
      name: customer.name
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ 
      message: 'Failed to fetch preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  verifyToken,
  getProfile,
  updateProfile,
  getPreferences
};
