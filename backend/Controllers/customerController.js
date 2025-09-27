const Customer = require('../Models/Customer');
const Vendor = require('../Models/Vendor');
const Plan = require('../Models/Plan');
const Menu = require('../Models/Menu');
const axios = require('axios');

const customerController = {
  // Get all verified vendors
  async getVerifiedVendors(req, res) {
    try {
      const vendors = await Vendor.find({ verified: true }).select('-firebaseUid -__v');
      const Menu = require('../Models/Menu');
      
      // Get plan count and food types for each vendor
      const vendorsWithDetails = await Promise.all(
        vendors.map(async (vendor) => {
          const planCount = await Plan.countDocuments({ vendor_id: vendor._id });
          
          // Only return vendors with at least one meal plan
          if (planCount === 0) {
            return null;
          }
          
          // Get menu information to determine food types
          const menus = await Menu.find({ vendor_id: vendor._id });
          
          // Determine food types based on actual menus
          const hasVeg = menus.some(menu => !menu.non_veg);
          const hasNonVeg = menus.some(menu => menu.non_veg);
          
          let foodTypes = [];
          if (hasVeg) foodTypes.push('Vegetarian');
          if (hasNonVeg) foodTypes.push('Non-Vegetarian');
          
          // Get meal types offered
          const mealTypes = [...new Set(menus.map(menu => menu.meal_type))];
          
          // Determine specialty for description
          let specialty = 'mixed';
          if (hasVeg && !hasNonVeg) specialty = 'veg';
          else if (hasNonVeg && !hasVeg) specialty = 'nonveg';
          
          // Generate a consistent rating between 4.0 and 5.0
          const ratingSeed = vendor._id.toString().charCodeAt(vendor._id.toString().length - 1);
          const rating = Number((4.0 + (ratingSeed % 10) / 10).toFixed(1));
          
          return {
            ...vendor.toObject(),
            plans: planCount,
            foodTypes: foodTypes,
            mealTypes: mealTypes,
            specialty: specialty,
            rating: rating,
            description: `Delicious ${foodTypes.join(' & ').toLowerCase()} meals prepared with care and quality ingredients.`
          };
        })
      );
      
      // Filter out null values (vendors with no meal plans)
      const filteredVendors = vendorsWithDetails.filter(vendor => vendor !== null);
      
      res.json(filteredVendors);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get single vendor details
  async getVendorById(req, res) {
    try {
      const { vendorId } = req.params;
      
      const vendor = await Vendor.findById(vendorId)
        .select('name profileImage address contactNumber verified createdAt');
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      res.json(vendor);
    } catch (error) {
      console.error('Error fetching vendor:', error);
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

  // Update only customer location (address + coordinates)
  async updateLocation(req, res) {
    try {
      const { address, coordinates } = req.body;

      if (!address && !coordinates) {
        return res.status(400).json({ message: 'Address or coordinates required' });
      }

      let coords = coordinates || null;

      // If coordinates not provided but address is provided, attempt geocoding
      if (!coords && address && address.street) {
        const fullAddress = `${address.street}, ${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`;
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
          );
          if (response.data && response.data.length > 0) {
            coords = {
              lat: parseFloat(response.data[0].lat),
              lng: parseFloat(response.data[0].lon),
            };
          }
        } catch (geocodeError) {
          console.log('Geocoding failed:', geocodeError.message);
        }
      }

      const updateData = {
        address: {
          ...(address || {}),
          coordinates: coords,
        },
      };

      const updatedCustomer = await Customer.findOneAndUpdate(
        { firebaseUid: req.user.firebaseUid },
        { $set: updateData },
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
        return res.status(403).json({ message: 'Vendor not verified' });
      }

      // Get plans for this vendor
      const plans = await Plan.find({ vendor_id: vendorId }).lean();
      
      // Convert Decimal128 to number for frontend
      plans.forEach(plan => {
        if (plan.price && plan.price.$numberDecimal) {
          plan.price = parseFloat(plan.price.$numberDecimal);
        }
      });

      res.json(plans);
    } catch (error) {
      console.error('Error fetching vendor plans:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get vendor menus for customers
  async getVendorMenus(req, res) {
    try {
      const { vendorId } = req.params;
      
      // Verify vendor exists and is verified
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      if (!vendor.verified) {
        return res.status(403).json({ message: 'Vendor not verified' });
      }

      // Get menus for this vendor
      const Menu = require('../Models/Menu');
      const menus = await Menu.find({ vendor_id: vendorId }).lean();

      res.json(menus);
    } catch (error) {
      console.error('Error fetching vendor menus:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = customerController;
