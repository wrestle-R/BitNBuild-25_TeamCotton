const Vendor = require('../Models/Vendor');
const Menu = require('../Models/Menu');
const Plan = require('../Models/Plan');
const PlanMenu = require('../Models/PlanMenu');
const axios = require('axios');

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

      res.json({
        activeSubscribers: 0,
        menuItems: menuCount,
        plans: planCount,
        earnings: vendor.earnings || 0,
        accountStatus: vendor.verified ? 'Verified' : 'Pending'
      });
    } catch (error) {
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