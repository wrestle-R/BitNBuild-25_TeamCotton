const Vendor = require('../Models/Vendor');
const Menu = require('../Models/Menu');
const Plan = require('../Models/Plan');
const PlanMenu = require('../Models/PlanMenu');
const Customer = require('../Models/Customer');
const axios = require('axios');
const ConsumerSubscription = require('../Models/ConsumerSubscription');
const Payment = require('../Models/Payment');

const vendorController = {
  // Get vendor profile
  async getProfile(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get vendor stats - ADD THIS
  async getStats(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const menuCount = await Menu.countDocuments({ vendor_id: vendor._id });
      const planCount = await Plan.countDocuments({ vendor_id: vendor._id });
      const activeSubscribers = await ConsumerSubscription.countDocuments({ 
        vendor_id: vendor._id,
        active: true 
      });

      // Get earnings - handle Decimal128
      let earnings = 0;
      if (vendor.earnings) {
        if (typeof vendor.earnings === 'object' && vendor.earnings.$numberDecimal) {
          earnings = parseFloat(vendor.earnings.$numberDecimal);
        } else {
          earnings = parseFloat(vendor.earnings) || 0;
        }
      }

      res.json({
        activeSubscribers,
        menuItems: menuCount,
        plans: planCount,
        earnings,
        accountStatus: vendor.verified ? 'Verified' : 'Active'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update vendor profile
  async updateProfile(req, res) {
    try {
      const { name, contactNumber, address, profileImage } = req.body;
      
      let coordinates = null;
      if (address && address.street) {
        const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.pincode}`;
        coordinates = await getCoordinates(fullAddress);
      }

      const updateData = {
        name,
        contactNumber,
        profileImage,
        address: {
          ...address,
          coordinates
        }
      };

      const vendor = await Vendor.findOneAndUpdate(
        { firebaseUid: req.user.firebaseUid },
        updateData,
        { new: true }
      );

      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get vendor menus
  async getMenus(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const menus = await Menu.find({ vendor_id: vendor._id }).sort({ created_at: -1 });
      res.json(menus);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create menu
  async createMenu(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const menu = new Menu({
        vendor_id: vendor._id,
        ...req.body
      });

      await menu.save();
      res.status(201).json(menu);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update menu
  async updateMenu(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const menu = await Menu.findOneAndUpdate(
        { _id: req.params.id, vendor_id: vendor._id },
        req.body,
        { new: true }
      );

      if (!menu) {
        return res.status(404).json({ message: 'Menu not found' });
      }

      res.json(menu);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete menu
  async deleteMenu(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const menu = await Menu.findOneAndDelete({
        _id: req.params.id,
        vendor_id: vendor._id
      });

      if (!menu) {
        return res.status(404).json({ message: 'Menu not found' });
      }

      await PlanMenu.deleteMany({ menu_id: req.params.id });

      res.json({ message: 'Menu deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get vendor plans
  async getPlans(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const plans = await Plan.find({ vendor_id: vendor._id }).lean();
      
      // Convert Decimal128 to number
      plans.forEach(plan => {
        if (plan.price && plan.price.$numberDecimal) {
          plan.price = parseFloat(plan.price.$numberDecimal);
        }
      });
      
      res.json(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Create plan
  // Update createPlan to handle selected_meals and new planMenus structure
  async createPlan(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const { name, price, duration_days, meals_per_day, selected_meals, planMenus } = req.body;

      const plan = new Plan({
        vendor_id: vendor._id,
        name,
        price,
        duration_days,
        meals_per_day,
        selected_meals
      });
      await plan.save();

      // Create PlanMenu entries with new structure
      if (planMenus) {
        for (const key in planMenus) {
          const [day_number, meal_type] = key.split('-');
          const mealIndex = selected_meals.indexOf(meal_type) + 1;
          await PlanMenu.create({
            plan_id: plan._id,
            menu_id: planMenus[key],
            day_number: parseInt(day_number),
            meal_number: mealIndex
          });
        }
      }

      // Convert price for response
      const responseData = plan.toObject();
      if (responseData.price && responseData.price.$numberDecimal) {
        responseData.price = parseFloat(responseData.price.$numberDecimal);
      }

      res.status(201).json(responseData);
    } catch (error) {
      console.error('Error creating plan:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update plan
  async updatePlan(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const plan = await Plan.findOneAndUpdate(
        { _id: req.params.id, vendor_id: vendor._id },
        {
          name: req.body.name,
          price: req.body.price,
          duration_days: req.body.duration_days,
          meals_per_day: req.body.meals_per_day
        },
        { new: true }
      );

      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      // Convert price for response
      const responseData = plan.toObject();
      if (responseData.price && responseData.price.$numberDecimal) {
        responseData.price = parseFloat(responseData.price.$numberDecimal);
      }

      res.json(responseData);
    } catch (error) {
      console.error('Error updating plan:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete plan
  async deletePlan(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const plan = await Plan.findOneAndDelete({ _id: req.params.id, vendor_id: vendor._id });
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      // Also delete associated plan menus
      await PlanMenu.deleteMany({ plan_id: req.params.id });

      res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
      console.error('Error deleting plan:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get plan menus
  async getPlanMenus(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const plan = await Plan.findOne({ _id: req.params.planId, vendor_id: vendor._id });
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      const planMenus = await PlanMenu.find({ plan_id: req.params.planId })
        .populate('menu_id')
        .lean();

      // Convert populated menu_id to menu for frontend compatibility
      const formattedPlanMenus = planMenus.map(pm => ({
        ...pm,
        menu: pm.menu_id
      }));

      res.json(formattedPlanMenus);
    } catch (error) {
      console.error('Error fetching plan menus:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get subscription stats
  async getSubscriptionStats(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const totalSubscribers = await ConsumerSubscription.countDocuments({ 
        vendor_id: vendor._id,
        active: true 
      });

      // Get earnings from vendor document
      let totalRevenue = 0;
      if (vendor.earnings) {
        if (typeof vendor.earnings === 'object' && vendor.earnings.$numberDecimal) {
          totalRevenue = parseFloat(vendor.earnings.$numberDecimal);
        } else {
          totalRevenue = parseFloat(vendor.earnings) || 0;
        }
      }

      const recentPayments = await Payment.find({ 
        vendor_id: vendor._id,
        payment_status: 'success' 
      })
      .populate('consumer_id', 'name')
      .populate('plan_id', 'name')
      .sort({ payment_date: -1 })
      .limit(10);

      res.json({
        totalSubscribers,
        totalRevenue,
        recentPayments
      });
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get subscribers
  async getSubscribers(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const subscriptions = await ConsumerSubscription.find({ 
        vendor_id: vendor._id 
      })
      .populate('consumer_id', 'name email photoUrl address')
      .populate('plan_id', 'name price selected_meals')
      .sort({ start_date: -1 });

      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get dashboard data
  async getDashboard(req, res) {
    try {
      const vendor = await Vendor.findOne({ firebaseUid: req.user.firebaseUid });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      // Get basic stats
      const [activeSubscribers, totalSubscribers, menuCount, planCount, recentPayments] = await Promise.all([
        ConsumerSubscription.countDocuments({ vendor_id: vendor._id, active: true }),
        ConsumerSubscription.countDocuments({ vendor_id: vendor._id }),
        Menu.countDocuments({ vendor_id: vendor._id }),
        Plan.countDocuments({ vendor_id: vendor._id }),
        Payment.find({ vendor_id: vendor._id, payment_status: 'success' })
          .populate('consumer_id', 'name')
          .populate('plan_id', 'name')
          .sort({ payment_date: -1 })
          .limit(5)
      ]);

      // Calculate earnings
      let totalEarnings = 0;
      if (vendor.earnings) {
        if (typeof vendor.earnings === 'object' && vendor.earnings.$numberDecimal) {
          totalEarnings = parseFloat(vendor.earnings.$numberDecimal);
        } else {
          totalEarnings = parseFloat(vendor.earnings) || 0;
        }
      }

      // Get recent plans
      const recentPlans = await Plan.find({ vendor_id: vendor._id })
        .sort({ created_at: -1 })
        .limit(5);

      // Convert Decimal128 to number for recent plans
      recentPlans.forEach(plan => {
        if (plan.price && plan.price.$numberDecimal) {
          plan.price = parseFloat(plan.price.$numberDecimal);
        }
      });

      // Get notifications
      const notifications = await vendorController.getNotifications(vendor._id);

      res.json({
        stats: {
          activeSubscribers,
          totalSubscribers,
          menuItems: menuCount,
          plans: planCount,
          totalEarnings,
          accountStatus: vendor.verified ? 'Verified' : 'Pending Verification'
        },
        recentPayments,
        recentPlans,
        notifications,
        vendor: {
          name: vendor.name,
          email: vendor.email,
          profileImage: vendor.profileImage,
          verified: vendor.verified,
          address: vendor.address
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get notifications for vendor
  async getNotifications(vendorId) {
    try {
      const notifications = [];

      // Check for expiring subscriptions
      const expiringSubscriptions = await ConsumerSubscription.find({
        vendor_id: vendorId,
        active: true,
        end_date: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      }).populate('consumer_id', 'name').populate('plan_id', 'name');

      expiringSubscriptions.forEach(sub => {
        const daysLeft = Math.ceil((sub.end_date - new Date()) / (1000 * 60 * 60 * 24));
        notifications.push({
          id: `expiring-${sub._id}`,
          type: 'warning',
          title: 'Subscription Expiring Soon',
          message: `${sub.consumer_id?.name}'s ${sub.plan_id?.name} expires in ${daysLeft} day(s)`,
          timestamp: new Date(),
          priority: daysLeft <= 2 ? 'high' : 'medium'
        });
      });

      // Check for new subscriptions today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const newSubscriptionsToday = await ConsumerSubscription.countDocuments({
        vendor_id: vendorId,
        start_date: { $gte: todayStart, $lte: todayEnd }
      });

      if (newSubscriptionsToday > 0) {
        notifications.push({
          id: 'new-subs-today',
          type: 'success',
          title: 'New Subscriptions Today',
          message: `You got ${newSubscriptionsToday} new subscription(s) today!`,
          timestamp: new Date(),
          priority: 'medium'
        });
      }

      // Check for recent payments
      const recentPayments = await Payment.countDocuments({
        vendor_id: vendorId,
        payment_status: 'success',
        payment_date: { $gte: todayStart, $lte: todayEnd }
      });

      if (recentPayments > 0) {
        notifications.push({
          id: 'payments-today',
          type: 'success',
          title: 'Payments Received',
          message: `You received ${recentPayments} payment(s) today`,
          timestamp: new Date(),
          priority: 'medium'
        });
      }

      // Check if vendor profile is incomplete
      const vendor = await Vendor.findById(vendorId);
      if (!vendor.address || !vendor.address.street || !vendor.contactNumber) {
        notifications.push({
          id: 'incomplete-profile',
          type: 'info',
          title: 'Complete Your Profile',
          message: 'Add your address and contact details to attract more customers',
          timestamp: new Date(),
          priority: 'high'
        });
      }

      // Check for low menu items
      const menuCount = await Menu.countDocuments({ vendor_id: vendorId });
      if (menuCount < 3) {
        notifications.push({
          id: 'low-menu-items',
          type: 'info',
          title: 'Add More Menu Items',
          message: 'Create more menu items to offer variety to your customers',
          timestamp: new Date(),
          priority: 'medium'
        });
      }

      return notifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }
};

// Helper function to get coordinates from address
async function getCoordinates(address) {
  try {
    const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        q: address,
        key: process.env.GEOCODING_API_KEY,
        limit: 1
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

module.exports = vendorController;