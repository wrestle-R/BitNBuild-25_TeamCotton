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

// Import Plan model
const Plan = require('../Models/Plan');

// Create test verified vendors
const createTestVendors = async (req, res) => {
  try {
    const testVendors = [
      {
        name: "Green Garden Kitchen",
        email: "greengarden@test.com",
        firebaseUid: "test-vendor-1",
        contactNumber: "+1234567890",
        address: {
          street: "123 Garden Street",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          coordinates: {
            lat: 19.0760,
            lng: 72.8777
          }
        },
        verified: true,
        profileImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=150"
      },
      {
        name: "Spice Route Delights", 
        email: "spiceroute@test.com",
        firebaseUid: "test-vendor-2",
        contactNumber: "+1234567891",
        address: {
          street: "456 Spice Lane",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
          coordinates: {
            lat: 28.6139,
            lng: 77.2090
          }
        },
        verified: true,
        profileImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=150"
      },
      {
        name: "Healthy Bites Co.",
        email: "healthybites@test.com", 
        firebaseUid: "test-vendor-3",
        contactNumber: "+1234567892",
        address: {
          street: "789 Health Avenue",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001",
          coordinates: {
            lat: 12.9716,
            lng: 77.5946
          }
        },
        verified: true,
        profileImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=150"
      }
    ];

    // Check if vendors already exist and create them
    const createdVendors = [];
    for (const vendorData of testVendors) {
      let vendor = await Vendor.findOne({ firebaseUid: vendorData.firebaseUid });
      if (!vendor) {
        vendor = new Vendor(vendorData);
        await vendor.save();
      }
      createdVendors.push(vendor);
    }

    // Create test plans for each vendor
    const testPlans = [
      { name: "Daily Fresh", price: 299, duration_days: 1, meals_per_day: 2 },
      { name: "Weekly Combo", price: 1599, duration_days: 7, meals_per_day: 2 },
      { name: "Monthly Special", price: 5999, duration_days: 30, meals_per_day: 2 },
      { name: "Premium Daily", price: 399, duration_days: 1, meals_per_day: 3 },
      { name: "Weekly Premium", price: 2399, duration_days: 7, meals_per_day: 3 }
    ];

    for (const vendor of createdVendors) {
      // Create 3-4 random plans for each vendor
      const plansForVendor = testPlans.slice(0, Math.floor(Math.random() * 2) + 3);
      
      for (const planData of plansForVendor) {
        const existingPlan = await Plan.findOne({ 
          vendor_id: vendor._id, 
          name: planData.name 
        });
        
        if (!existingPlan) {
          const plan = new Plan({
            vendor_id: vendor._id,
            ...planData
          });
          await plan.save();
        }
      }
    }

    res.json({
      success: true,
      message: 'Test vendors and meal plans created successfully',
      vendorsCount: testVendors.length,
      note: 'You can now view verified vendors in the Customer Market page'
    });
  } catch (error) {
    console.error('Error creating test vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test vendors',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getAllVendors,
  deleteUser,
  deleteVendor,
  toggleVendorVerification,
  getVendorDetails,
  createTestVendors
};