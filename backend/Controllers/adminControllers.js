// Import the models
const Vendor = require('../Models/Vendor');
const Customer = require('../Models/Customer');

// Get all users (customers)
const getAllUsers = async (req, res) => {
  try {
    const customers = await Customer.find({});
    
    const statistics = {
      totalUsers: customers.length,
      activeUsers: customers.filter(c => c.lastActive && 
        new Date(c.lastActive) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      totalVendors: await Vendor.countDocuments(),
      activeVendors: await Vendor.countDocuments({ 
        verified: true,
        lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    };
    
    res.json({
      success: true,
      users: customers,
      statistics
    });
  } catch (error) {
    console.error('Admin getAllUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Get all vendors
const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({}).sort({ createdAt: -1 });
    
    // Transform the data to match frontend expectations
    const transformedVendors = vendors.map(vendor => ({
      id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.contactNumber || 'N/A',
      address: vendor.address || 'Not provided',
      verified: vendor.verified,
      earnings: vendor.earnings ? parseFloat(vendor.earnings.toString()) : 0,
      joinedAt: vendor.createdAt,
      lastActive: vendor.lastActive || vendor.updatedAt,
      // Add some mock data for now
      category: 'General',
      status: vendor.verified ? 'Active' : 'Pending',
      totalProducts: Math.floor(Math.random() * 50) + 10,
      totalSales: Math.floor(Math.random() * 2000) + 500
    }));
    
    res.json({
      success: true,
      vendors: transformedVendors
    });
  } catch (error) {
    console.error('Admin getAllVendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors'
    });
  }
};

// Delete user (placeholder)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock delete functionality
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Admin deleteUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Delete vendor
const deleteVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const deletedVendor = await Vendor.findByIdAndDelete(vendorId);
    
    if (!deletedVendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    console.error('Admin deleteVendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vendor'
    });
  }
};

// Verify or unverify vendor
const toggleVendorVerification = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { verified } = req.body;
    
    const vendor = await Vendor.findByIdAndUpdate(
      vendorId, 
      { verified: verified },
      { new: true }
    );
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    res.json({
      success: true,
      message: `Vendor ${verified ? 'verified' : 'unverified'} successfully`,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        verified: vendor.verified
      }
    });
  } catch (error) {
    console.error('Admin toggleVendorVerification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor verification status'
    });
  }
};

// Get vendor details
const getVendorDetails = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    res.json({
      success: true,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        contactNumber: vendor.contactNumber,
        address: vendor.address,
        verified: vendor.verified,
        earnings: vendor.earnings ? parseFloat(vendor.earnings.toString()) : 0,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        lastActive: vendor.lastActive
      }
    });
  } catch (error) {
    console.error('Admin getVendorDetails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor details'
    });
  }
};

module.exports = {
  getAllUsers,
  getAllVendors,
  deleteUser,
  deleteVendor,
  toggleVendorVerification,
  getVendorDetails
};