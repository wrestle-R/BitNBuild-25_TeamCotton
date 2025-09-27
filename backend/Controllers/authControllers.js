const Vendor = require('../Models/Vendor');
const Customer = require('../Models/Customer');
const Driver = require('../Models/Driver');
const jwt = require('jsonwebtoken');

const generateToken = (userId, firebaseUid, role) => {
  return jwt.sign(
    { userId, firebaseUid, role },
    process.env.JWT_SECRET || 'nourishnet_secret_key_2024',
    { expiresIn: '7d' }
  );
};

const createUser = async (req, res) => {
  try {
    console.log('Received create user request:', req.body);

    const { firebaseUid, name, email, profilePicture, role } = req.body;

    if (!firebaseUid || !name || !email || !role) {
      console.log('Missing required fields:', {
        firebaseUid: !!firebaseUid,
        name: !!name,
        email: !!email,
        role: !!role,
      });
      return res.status(400).json({
        message: 'Missing required fields: firebaseUid, name, email, and role are required',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
      });
    }

    if (name.trim().length === 0) {
      return res.status(400).json({
        message: 'Name cannot be empty',
      });
    }

    // Check for existing user in all collections
    const existingVendor = await Vendor.findOne({ firebaseUid });
    const existingCustomer = await Customer.findOne({ firebaseUid });
    const existingDriver = await Driver.findOne({ firebaseUid });

    if (existingVendor || existingCustomer || existingDriver) {
      console.log('User already exists with Firebase ID:', firebaseUid);
      return res.status(409).json({
        message: 'User already exists with this Firebase ID',
      });
    }

    // Check for existing email in all collections
    const existingEmailVendor = await Vendor.findOne({ email });
    const existingEmailCustomer = await Customer.findOne({ email });
    const existingEmailDriver = await Driver.findOne({ email });

    if (existingEmailVendor || existingEmailCustomer || existingEmailDriver) {
      console.log('User already exists with email:', email);
      return res.status(409).json({
        message: 'User already exists with this email address',
      });
    }

    let user;
    if (role === 'vendor') {
      user = new Vendor({
        name: name.trim(),
        email: email.toLowerCase(),
        firebaseUid,
        contact_number: '',
        address: ''
      });
    } else if (role === 'customer') {
      user = new Customer({
        name: name.trim(),
        email: email.toLowerCase(),
        firebaseUid,
        contact_number: '',
        address: ''
      });
    } else if (role === 'driver') {
      user = new Driver({
        name: name.trim(),
        email: email.toLowerCase(),
        firebaseUid,
        contactNumber: '',
        address: '',
        vehicleType: 'bike',
        vehicleNumber: '',
        licenseNumber: ''
      });
    } else {
      return res.status(400).json({
        message: 'Invalid role. Must be either "vendor", "customer", or "driver"',
      });
    }

    console.log('Attempting to save user:', {
      firebaseUid: firebaseUid,
      name: name.trim(),
      email: email.toLowerCase(),
      role,
    });
    await user.save();
    console.log('User saved successfully');

    // Generate JWT token
    const token = generateToken(user._id, user.firebaseUid, role);

    // Send user data in response
    res.status(201).json({
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        contactNumber: user.contact_number,
        address: user.address,
        role: role
      },
      token,
    });
  } catch (error) {
    console.error('Error creating user:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      console.log('Duplicate key error for field:', field);
      return res.status(409).json({
        message: `User with this ${field} already exists`,
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        message: 'Validation failed: ' + validationErrors.join(', '),
      });
    }

    res.status(500).json({
      message: 'Failed to create user account. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Validate user role during login
const validateRole = async (req, res) => {
  try {
    const { firebaseUid, role } = req.body;

    // Validate required fields
    if (!firebaseUid || !role) {
      return res.status(400).json({
        message: 'Missing required fields: firebaseUid and role are required',
      });
    }

    let user;
    if (role === 'vendor') {
      user = await Vendor.findOne({ firebaseUid });
      if (!user) {
        return res.status(403).json({
          message: 'You are not registered as a vendor. Please register as a vendor first or login with the correct role.',
        });
      }
    } else if (role === 'customer') {
      user = await Customer.findOne({ firebaseUid });
      if (!user) {
        return res.status(403).json({
          message: 'You are not registered as a customer. Please register as a customer first or login with the correct role.',
        });
      }
    } else if (role === 'driver') {
      user = await Driver.findOne({ firebaseUid });
      if (!user) {
        return res.status(403).json({
          message: 'You are not registered as a driver. Please register as a driver first or login with the correct role.',
        });
      }
    } else {
      return res.status(400).json({
        message: 'Invalid role. Must be either "vendor", "customer", or "driver"',
      });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.firebaseUid, role);

    res.status(200).json({
      message: 'Role validated successfully',
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        contactNumber: user.contact_number,
        address: user.address,
        role: role
      },
      token,
    });
  } catch (error) {
    console.error('Error validating role:', error);
    res.status(500).json({
      message: 'Failed to validate user role. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get user by Firebase ID
const getUserByFirebaseUid = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    // Search in all collections
    let user = await Vendor.findOne({ firebaseUid });
    let role = 'vendor';
    
    if (!user) {
      user = await Customer.findOne({ firebaseUid });
      role = 'customer';
    }
    
    if (!user) {
      user = await Driver.findOne({ firebaseUid });
      role = 'driver';
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.firebaseUid, role);

    res.status(200).json({
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        contactNumber: user.contact_number,
        address: user.address,
        role: role
      },
      token,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createUser,
  validateRole,
  getUserByFirebaseUid,
};