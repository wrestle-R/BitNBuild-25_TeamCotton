const Allergy = require('../Models/Allergy');
const Goals = require('../Models/Goals');
const Customer = require('../Models/Customer');

const analysisController = {
  // Analyze plan against user allergies
  async analyzeAllergies(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const { planDetails } = req.body;

      console.log('Analyzing allergies for user:', firebaseUid);
      console.log('Plan details:', planDetails);

      // Get user's allergies
      const userAllergies = await Allergy.findOne({ firebaseUid });
      
      if (!userAllergies || !userAllergies.allergies.length) {
        return res.json({
          success: true,
          analysis: "Good news! No specific allergies found in your profile, so this plan should be safe for you."
        });
      }

      // Extract plan information for analysis
      const planInfo = {
        name: planDetails.name,
        meals: planDetails.selected_meals || [],
        menus: planDetails.menus || []
      };

      // Check if API key is available
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('Google API key not configured');
      }

      // Use Google Gemini AI to analyze
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // Extract detailed menu information
      const menuDetails = planInfo.menus && planInfo.menus.length > 0 
        ? planInfo.menus.map(menu => {
            const items = menu.items ? menu.items.map(item => item.name).join(', ') : 'No specific items listed';
            return `${menu.meal_type} (${menu.non_veg ? 'Non-Veg' : 'Veg'}): ${items}`;
          }).join('\n        ')
        : 'No menu details available';

      const prompt = `
        You are a nutrition expert analyzing meal plan safety for someone with allergies.
        
        User's Allergies: ${userAllergies.allergies.map(a => `${a.name} (${a.severity})`).join(', ')}
        Dietary Restrictions: ${userAllergies.dietaryRestrictions.join(', ')}
        ${userAllergies.additionalNotes ? `Additional Notes: ${userAllergies.additionalNotes}` : ''}
        
        Meal Plan: ${planInfo.name}
        Meals Included: ${planInfo.meals.join(', ')}
        
        Sample Menu Items:
        ${menuDetails || 'No specific menu items provided'}
        
        Provide a brief, clear 1-2 sentence assessment: Is this meal plan safe or potentially risky for their allergies? Be specific about any concerning ingredients if found.
      `;

      console.log('Sending prompt to Gemini AI...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();

      res.json({
        success: true,
        analysis: analysis
      });

    } catch (error) {
      console.error('Allergy analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Error analyzing allergies',
        analysis: 'Unable to analyze allergies at this time. Please consult with the vendor directly about ingredients.'
      });
    }
  },

  // Analyze plan against user goals
  async analyzeGoals(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const { planDetails } = req.body;

      console.log('Analyzing goals for user:', firebaseUid);
      console.log('Plan details:', planDetails);

      // First get the customer to find their MongoDB _id
      const customer = await Customer.findOne({ firebaseUid });
      if (!customer) {
        return res.json({
          success: true,
          analysis: "Please set up your customer profile first to get personalized goal analysis."
        });
      }

      // Get user's goals using customer_id
      const userGoals = await Goals.findOne({ customer_id: customer._id });
      
      if (!userGoals) {
        return res.json({
          success: true,
          analysis: "No specific goals found in your profile. This plan could be a great start to building healthy eating habits!"
        });
      }

      // Extract plan information for analysis
      const planInfo = {
        name: planDetails.name,
        duration: planDetails.duration_days,
        mealsPerDay: planDetails.meals_per_day,
        meals: planDetails.selected_meals || [],
        menus: planDetails.menus || [],
        price: planDetails.price
      };

      // Check if API key is available
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('Google API key not configured');
      }

      // Use Google Gemini AI to analyze
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // Extract detailed menu information for goals analysis
      const menuDetails = planInfo.menus && planInfo.menus.length > 0 
        ? planInfo.menus.map(menu => {
            const items = menu.items ? menu.items.map(item => item.name).join(', ') : 'No specific items listed';
            return `${menu.meal_type} (${menu.non_veg ? 'Non-Veg' : 'Veg'}): ${items}`;
          }).join('\n        ')
        : 'No menu details available';

      const prompt = `
        You are a nutrition expert helping someone achieve their health goals.
        
        User's Health Goals:
        ${userGoals.healthGoal ? `- Main Goal: ${userGoals.healthGoal}` : ''}
        ${userGoals.dailyCalories ? `- Daily Calories Target: ${userGoals.dailyCalories}` : ''}
        ${userGoals.protein ? `- Protein Target: ${userGoals.protein}g` : ''}
        ${userGoals.carbs ? `- Carbs Target: ${userGoals.carbs}g` : ''}
        ${userGoals.fats ? `- Fats Target: ${userGoals.fats}g` : ''}
        
        Meal Plan: "${planInfo.name}" - ${planInfo.duration} days, ${planInfo.mealsPerDay} meal(s)/day
        Includes: ${planInfo.meals.join(', ')}
        
        Sample Menu Items:
        ${menuDetails || 'No specific menu items provided'}
        
        Provide 1-2 sentences: How well does this meal plan support their health goals? Be encouraging and specific about the food types and variety.
      `;

      console.log('Sending prompt to Gemini AI...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();

      res.json({
        success: true,
        analysis: analysis
      });

    } catch (error) {
      console.error('Goals analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Error analyzing goals',
        analysis: 'Unable to analyze how this plan fits your goals at this time. Consider the meal variety and duration when making your choice.'
      });
    }
  }
};

module.exports = analysisController;