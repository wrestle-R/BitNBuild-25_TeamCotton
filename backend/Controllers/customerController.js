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
  },

  // Dashboard - Get comprehensive dashboard data
  async getDashboardData(req, res) {
    try {
      const customerId = req.user.firebaseUid;
      
      // Get customer details
      const customer = await Customer.findOne({ firebaseUid: customerId }).lean();
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const Payment = require('../Models/Payment');
      const ConsumerSubscription = require('../Models/ConsumerSubscription');

      // Get active subscriptions with populated vendor and plan data
      const activeSubscriptions = await ConsumerSubscription.find({
        consumer_id: customer._id,
        status: 'active'
      })
      .populate('vendor_id', 'name profileImage address contactNumber')
      .populate('plan_id', 'name price duration_days selected_meals')
      .lean();

      // Get recent orders/payments
      const recentPayments = await Payment.find({
        customer_id: customer._id
      })
      .populate('plan_id', 'name')
      .populate('vendor_id', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

      // Get subscription stats
      const totalSubscriptions = await ConsumerSubscription.countDocuments({
        consumer_id: customer._id
      });

      const completedSubscriptions = await ConsumerSubscription.countDocuments({
        consumer_id: customer._id,
        status: 'completed'
      });

      // Calculate total spent
      const totalSpentResult = await Payment.aggregate([
        { $match: { customer_id: customer._id, status: 'success' } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
      ]);
      const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].total : 0;

      // Get nearby vendors (if customer has location)
      let nearbyVendors = [];
      if (customer.address && customer.address.coordinates) {
        const vendorsWithLocation = await Vendor.find({
          verified: true,
          'address.coordinates': { $exists: true }
        }).lean();

        // Calculate distances and get top 5 nearest
        const vendorsWithDistance = vendorsWithLocation.map(vendor => {
          const distance = calculateDistance(
            customer.address.coordinates.lat,
            customer.address.coordinates.lng,
            vendor.address.coordinates.lat,
            vendor.address.coordinates.lng
          );
          return { ...vendor, distance };
        });

        nearbyVendors = vendorsWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5);
      }

      // Generate notifications based on data
      const notifications = [];
      
      // Active subscription notifications
      activeSubscriptions.forEach(sub => {
        const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3 && daysLeft > 0) {
          notifications.push({
            id: `expiring-${sub._id}`,
            type: 'warning',
            title: 'Subscription Expiring Soon',
            message: `Your subscription with ${sub.vendor_id.name} expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
            timestamp: new Date(),
            priority: 'high'
          });
        }
      });

      // New vendor notification
      const recentVendors = await Vendor.find({
        verified: true,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).limit(3).lean();

      if (recentVendors.length > 0) {
        notifications.push({
          id: 'new-vendors',
          type: 'info',
          title: 'New Vendors Available',
          message: `${recentVendors.length} new vendor${recentVendors.length > 1 ? 's' : ''} joined this week`,
          timestamp: new Date(),
          priority: 'medium'
        });
      }

      // Welcome notification for new users
      if (!totalSubscriptions) {
        notifications.push({
          id: 'welcome',
          type: 'success',
          title: 'Welcome to NourishNet!',
          message: 'Explore our verified vendors and find your perfect meal plan',
          timestamp: new Date(),
          priority: 'medium'
        });
      }

      // Payment reminder
      if (recentPayments.length === 0) {
        notifications.push({
          id: 'first-subscription',
          type: 'info',
          title: 'Start Your Food Journey',
          message: 'Subscribe to your first meal plan and enjoy delicious home-cooked meals',
          timestamp: new Date(),
          priority: 'medium'
        });
      }

      const dashboardData = {
        customer: {
          name: customer.name,
          email: customer.email,
          profileImage: customer.photoUrl,
          memberSince: customer.createdAt,
          preference: customer.preference
        },
        stats: {
          activeSubscriptions: activeSubscriptions.length,
          totalSubscriptions,
          completedSubscriptions,
          totalSpent: totalSpent.toFixed(2)
        },
        activeSubscriptions: activeSubscriptions.map(sub => ({
          id: sub._id,
          planName: sub.plan_id.name,
          vendorName: sub.vendor_id.name,
          vendorImage: sub.vendor_id.profileImage,
          startDate: sub.start_date,
          endDate: sub.end_date,
          status: sub.status,
          meals: sub.plan_id.selected_meals,
          daysLeft: Math.max(0, Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
        })),
        recentOrders: recentPayments.map(payment => ({
          id: payment._id,
          planName: payment.plan_id?.name || 'Unknown Plan',
          vendorName: payment.vendor_id?.name || 'Unknown Vendor',
          amount: parseFloat(payment.amount),
          date: payment.createdAt,
          status: payment.status
        })),
        nearbyVendors: nearbyVendors.slice(0, 5).map(vendor => ({
          id: vendor._id,
          name: vendor.name,
          image: vendor.profileImage,
          distance: vendor.distance?.toFixed(1) || 'N/A',
          address: vendor.address
        })),
        notifications: notifications.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }).slice(0, 10)
      };

      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get recent activity
  async getRecentActivity(req, res) {
    try {
      const customerId = req.user.firebaseUid;
      const customer = await Customer.findOne({ firebaseUid: customerId });
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const Payment = require('../Models/Payment');
      const ConsumerSubscription = require('../Models/ConsumerSubscription');

      // Get recent activities (payments, subscriptions)
      const recentPayments = await Payment.find({
        customer_id: customer._id
      })
      .populate('plan_id', 'name')
      .populate('vendor_id', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

      const recentSubscriptions = await ConsumerSubscription.find({
        consumer_id: customer._id
      })
      .populate('plan_id', 'name')
      .populate('vendor_id', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

      // Combine and format activities
      const activities = [
        ...recentPayments.map(payment => ({
          id: payment._id,
          type: 'payment',
          title: `Payment for ${payment.plan_id?.name || 'meal plan'}`,
          description: `₹${parseFloat(payment.amount).toFixed(2)} paid to ${payment.vendor_id?.name || 'vendor'}`,
          timestamp: payment.createdAt,
          status: payment.status,
          icon: 'payment'
        })),
        ...recentSubscriptions.map(sub => ({
          id: sub._id,
          type: 'subscription',
          title: `Subscription ${sub.status}`,
          description: `${sub.plan_id?.name || 'Meal plan'} from ${sub.vendor_id?.name || 'vendor'}`,
          timestamp: sub.createdAt,
          status: sub.status,
          icon: 'subscription'
        }))
      ];

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      res.json(activities.slice(0, 15));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
};

module.exports = customerController;
