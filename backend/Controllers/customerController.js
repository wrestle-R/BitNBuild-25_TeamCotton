const Customer = require('../Models/Customer');
const Vendor = require('../Models/Vendor');
const Plan = require('../Models/Plan');
const axios = require('axios');

const customerController = {
  // Get all verified vendors
  async getVerifiedVendors(req, res) {
    try {
      const vendors = await Vendor.find({ verified: true }).select('-firebaseUid -__v');
      
      // Get plan count for each vendor
      const vendorsWithPlanCount = await Promise.all(
        vendors.map(async (vendor) => {
          const planCount = await Plan.countDocuments({ vendor_id: vendor._id });
          
          // Generate a random but consistent specialty based on vendor ID
          const specialty = (vendor._id.toString().charCodeAt(0) % 2 === 0) ? 'veg' : 'nonveg';
          
          // Generate a consistent rating between 4.0 and 5.0
          const ratingSeed = vendor._id.toString().charCodeAt(vendor._id.toString().length - 1);
          const rating = Number((4.0 + (ratingSeed % 10) / 10).toFixed(1));
          
          return {
            ...vendor.toObject(),
            plans: planCount,
            specialty: specialty,
            rating: rating,
            description: `Delicious ${specialty === 'veg' ? 'vegetarian' : 'non-vegetarian'} meals prepared with care and quality ingredients.`
          };
        })
      );
      
      res.json(vendorsWithPlanCount);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get single vendor details
  async getVendorById(req, res) {
    try {
      const { vendorId } = req.params;
      const vendor = await Vendor.findById(vendorId).select('-firebaseUid -__v');
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      if (!vendor.verified) {
        return res.status(403).json({ message: 'Vendor is not verified' });
      }

      // Get plan count for the vendor
      const planCount = await Plan.countDocuments({ vendor_id: vendor._id });
      
      // Generate consistent specialty and rating
      const specialty = (vendor._id.toString().charCodeAt(0) % 2 === 0) ? 'veg' : 'nonveg';
      const ratingSeed = vendor._id.toString().charCodeAt(vendor._id.toString().length - 1);
      const rating = Number((4.0 + (ratingSeed % 10) / 10).toFixed(1));
      
      const vendorWithDetails = {
        ...vendor.toObject(),
        plans: planCount,
        specialty: specialty,
        rating: rating,
        description: `Delicious ${specialty === 'veg' ? 'vegetarian' : 'non-vegetarian'} meals prepared with care and quality ingredients.`
      };
      
      res.json(vendorWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get customer profile
  async getProfile(req, res) {
    try {
      const customer = await Customer.findOne({ firebaseUid: req.user.firebaseUid });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update customer profile
  async updateProfile(req, res) {
    try {
      const { name, contactNumber, address, photoUrl, preference } = req.body;
      
      let coordinates = null;
      if (address && address.street) {
        const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.pincode}`;
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
          );
          if (response.data && response.data.length > 0) {
            coordinates = {
              lat: parseFloat(response.data[0].lat),
              lng: parseFloat(response.data[0].lon)
            };
          }
        } catch (geocodeError) {
          console.log('Geocoding failed:', geocodeError.message);
        }
      }

      const updateData = {
        name,
        contactNumber,
        photoUrl,
        preference,
        address: {
          ...address,
          coordinates
        }
      };

      const updatedCustomer = await Customer.findOneAndUpdate(
        { firebaseUid: req.user.firebaseUid },
        updateData,
        { new: true }
      );

      if (!updatedCustomer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.json(updatedCustomer);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get customer preferences  
  async getPreferences(req, res) {
    try {
      const customer = await Customer.findOne(
        { firebaseUid: req.user.firebaseUid },
        { preference: 1, name: 1 }
      );
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.json({
        preference: customer.preference,
        name: customer.name
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get vendor meal plans
  async getVendorPlans(req, res) {
    try {
      const { vendorId } = req.params;
      
      // Verify vendor exists and is verified
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      if (!vendor.verified) {
        return res.status(403).json({ message: 'Vendor is not verified' });
      }

      // Get all plans for the vendor
      const plans = await Plan.find({ vendor_id: vendorId }).select('-__v');
      
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = customerController;
