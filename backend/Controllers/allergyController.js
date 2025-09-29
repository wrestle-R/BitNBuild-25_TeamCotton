const Allergy = require('../Models/Allergy');
const Customer = require('../Models/Customer');

const allergyController = {
  // Get customer allergies
  async getAllergies(req, res) {
    try {
      console.log('📥 GET /api/allergies called');
      const firebaseUid = req.user.uid;
      console.log('🔍 Getting allergies for user:', firebaseUid);
      
      const allergy = await Allergy.findOne({ firebaseUid }).populate('customerId', 'name email');
      
      if (!allergy) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'No allergies found for this customer'
        });
      }

      res.status(200).json({
        success: true,
        data: allergy
      });
    } catch (error) {
      console.error('Get allergies error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving allergies',
        error: error.message
      });
    }
  },

  // Create or update customer allergies
  async updateAllergies(req, res) {
    try {
      console.log('📥 POST /api/allergies called');
      const firebaseUid = req.user.uid;
      const { allergies, dietaryRestrictions, additionalNotes } = req.body;
      console.log('💾 Updating allergies for user:', firebaseUid, { allergies, dietaryRestrictions, additionalNotes });

      // Find the customer
      const customer = await Customer.findOne({ firebaseUid });
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Validate allergies array
      if (allergies && !Array.isArray(allergies)) {
        return res.status(400).json({
          success: false,
          message: 'Allergies must be an array'
        });
      }

      // Validate dietary restrictions
      if (dietaryRestrictions && !Array.isArray(dietaryRestrictions)) {
        return res.status(400).json({
          success: false,
          message: 'Dietary restrictions must be an array'
        });
      }

      const allergyData = {
        customerId: customer._id,
        firebaseUid,
        allergies: allergies || [],
        dietaryRestrictions: dietaryRestrictions || [],
        additionalNotes: additionalNotes || ''
      };

      // Use findOneAndUpdate with upsert to create or update
      const updatedAllergy = await Allergy.findOneAndUpdate(
        { firebaseUid },
        allergyData,
        { 
          new: true, 
          upsert: true,
          runValidators: true
        }
      ).populate('customerId', 'name email');

      res.status(200).json({
        success: true,
        data: updatedAllergy,
        message: 'Allergies updated successfully'
      });
    } catch (error) {
      console.error('Update allergies error:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Allergy record already exists for this customer'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error updating allergies',
        error: error.message
      });
    }
  },

  // Delete customer allergies
  async deleteAllergies(req, res) {
    try {
      const firebaseUid = req.user.uid;
      
      const deletedAllergy = await Allergy.findOneAndDelete({ firebaseUid });
      
      if (!deletedAllergy) {
        return res.status(404).json({
          success: false,
          message: 'No allergy record found to delete'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Allergies deleted successfully'
      });
    } catch (error) {
      console.error('Delete allergies error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting allergies',
        error: error.message
      });
    }
  }
};

module.exports = allergyController;