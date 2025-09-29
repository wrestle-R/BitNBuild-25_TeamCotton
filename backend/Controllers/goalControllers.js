const Goals = require('../Models/Goals');
const Customer = require('../Models/Customer');
const ConsumerSubscription = require('../Models/ConsumerSubscription');
const Menu = require('../Models/Menu');
const Plan = require('../Models/Plan');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

const goalController = {
  // Create or update customer goals
  async setGoals(req, res) {
    try {
      const { dailyCalories, protein, carbs, fats, healthGoal, time, customerId } = req.body;
      
      // Find customer by Firebase UID (passed in request body)
      const customer = await Customer.findOne({ firebaseUid: customerId });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Check if goals already exist for this customer
      let goals = await Goals.findOne({ customer_id: customer._id });

      if (goals) {
        // Update existing goals
        goals.dailyCalories = dailyCalories;
        goals.protein = protein;
        goals.carbs = carbs;
        goals.fats = fats;
        goals.healthGoal = healthGoal;
        goals.time = time;
        await goals.save();
      } else {
        // Create new goals
        goals = new Goals({
          customer_id: customer._id,
          dailyCalories,
          protein,
          carbs,
          fats,
          healthGoal,
          time
        });
        await goals.save();
      }

      res.status(201).json({
        message: 'Goals saved successfully',
        goals
      });
    } catch (error) {
      console.error('Error setting goals:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get customer goals
  async getGoals(req, res) {
    try {
      const { customerId } = req.query;
      
      // Find customer by Firebase UID
      const customer = await Customer.findOne({ firebaseUid: customerId });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const goals = await Goals.findOne({ customer_id: customer._id });
      
      if (!goals) {
        return res.status(404).json({ message: 'No goals found for this customer' });
      }

      res.json(goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get nutrition analysis using AI
  async getNutritionAnalysis(req, res) {
    try {
      const { customerId } = req.query;
      
      // Find customer by Firebase UID
      const customer = await Customer.findOne({ firebaseUid: customerId });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      console.log('Found customer:', customer._id, customer.name);

      // Get customer goals or use hardcoded defaults
      let goals = await Goals.findOne({ customer_id: customer._id });
      if (!goals) {
        console.log('No goals found, using hardcoded defaults');
        // Use hardcoded default values
        goals = {
          dailyCalories: 2000,
          fats: 500,
          protein: 200,
          carbs: 254,
          healthGoal: 'general_health',
          time: 'flexible'
        };
      }

      console.log('Using goals for customer:', goals.dailyCalories, 'calories');

      // Get ALL subscriptions for debugging
      const allSubscriptions = await ConsumerSubscription.find({
        consumer_id: customer._id
      }).populate('plan_id');
      
      console.log(`Total subscriptions for customer: ${allSubscriptions.length}`);
      
      // Get active subscriptions
      const activeSubscriptions = await ConsumerSubscription.find({
        consumer_id: customer._id,
        active: true,
        end_date: { $gt: new Date() }
      }).populate('plan_id');

      console.log(`Active subscriptions: ${activeSubscriptions.length}`);
      
      // If no active subscriptions, let's check if there are any inactive ones
      if (activeSubscriptions.length === 0) {
        // Let's try to find ANY subscriptions and create sample data for demo
        if (allSubscriptions.length === 0) {
          console.log('No subscriptions found at all - creating demo data');
          // Create some demo nutrition data for testing
          const demoNutrition = {
            calories: Math.floor(goals.dailyCalories * 0.8), // 80% of goal
            protein: Math.floor(goals.protein * 0.9), // 90% of goal  
            carbs: Math.floor(goals.carbs * 0.75), // 75% of goal
            fats: Math.floor(goals.fats * 1.1), // 110% of goal
            meals: [
              {
                name: "Sample Breakfast",
                calories: 400,
                protein: 20,
                carbs: 45,
                fats: 15
              },
              {
                name: "Sample Lunch", 
                calories: 600,
                protein: 35,
                carbs: 65,
                fats: 20
              },
              {
                name: "Sample Dinner",
                calories: 500,
                protein: 30,
                carbs: 50,
                fats: 18
              }
            ]
          };
          
          // Continue with demo data instead of returning error
          var totalNutrition = demoNutrition;
        } else {
          return res.status(404).json({ message: 'No active subscriptions found. Please subscribe to a meal plan.' });
        }
      }

      // Calculate total nutrition from all active meal plans
      if (!totalNutrition) {
        totalNutrition = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          meals: []
        };

        for (const subscription of activeSubscriptions) {
        const plan = subscription.plan_id;
        if (plan && plan.selected_meals) {
          for (const mealId of plan.selected_meals) {
            // Check if mealId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(mealId)) {
              console.log(`Skipping invalid meal ID: ${mealId}`);
              continue;
            }
            
            try {
              const menu = await Menu.findById(mealId);
              if (menu) {
                totalNutrition.calories += menu.calories || 0;
                totalNutrition.protein += menu.protein || 0;
                totalNutrition.carbs += menu.carbohydrate || 0;
                totalNutrition.fats += menu.fat || 0;
                totalNutrition.meals.push({
                  name: menu.dish_name,
                  calories: menu.calories || 0,
                  protein: menu.protein || 0,
                  carbs: menu.carbohydrate || 0,
                  fats: menu.fat || 0
                });
              } else {
                console.log(`Menu not found for ID: ${mealId}`);
              }
            } catch (error) {
              console.error(`Error finding menu for ID ${mealId}:`, error.message);
            }
          }
        }
      }
      }

      // If no valid meals found, provide a basic response
      if (totalNutrition.meals.length === 0) {
        return res.json({
          goals: {
            dailyCalories: goals.dailyCalories,
            protein: goals.protein,
            carbs: goals.carbs,
            fats: goals.fats,
            healthGoal: goals.healthGoal,
            time: goals.time
          },
          currentIntake: totalNutrition,
          analysis: {
            score: 0,
            calorieAnalysis: "No meal data available for analysis",
            proteinAnalysis: "No meal data available for analysis",
            carbAnalysis: "No meal data available for analysis",
            fatAnalysis: "No meal data available for analysis",
            recommendations: [
              "Subscribe to meal plans to start tracking your nutrition",
              "Set realistic daily nutrition goals",
              "Track your progress regularly"
            ],
            warnings: ["No active meal subscriptions found"],
            encouragement: "Start your nutrition journey by subscribing to meal plans!"
          },
          lastUpdated: new Date()
        });
      }

      // Prepare data for AI analysis
      const analysisPrompt = `
        You are a nutrition expert. Analyze the following data and provide a comprehensive nutrition assessment:

        USER GOALS:
        - Daily Calories Target: ${goals.dailyCalories} kcal
        - Protein Target: ${goals.protein}g
        - Carbohydrates Target: ${goals.carbs}g
        - Fats Target: ${goals.fats}g
        - Health Goal: ${goals.healthGoal}
        - Preferred Meal Time: ${goals.time}

        CURRENT INTAKE (from subscribed meal plans):
        - Total Calories: ${totalNutrition.calories} kcal
        - Total Protein: ${totalNutrition.protein}g
        - Total Carbohydrates: ${totalNutrition.carbs}g
        - Total Fats: ${totalNutrition.fats}g

        MEALS IN PLANS:
        ${totalNutrition.meals.map(meal => 
          `- ${meal.name}: ${meal.calories}kcal, ${meal.protein}g protein, ${meal.carbs}g carbs, ${meal.fats}g fats`
        ).join('\n')}

        Please provide:
        1. A nutrition score out of 100 based on how well the current intake aligns with goals
        2. Brief analysis of each macro (calories, protein, carbs, fats) - whether over/under target
        3. 3 specific, actionable recommendations to better meet the health goals
        4. Any warnings about nutritional imbalances
        5. Encouragement and positive feedback where appropriate

        Format your response as JSON with this structure:
        {
          "score": number,
          "calorieAnalysis": "text",
          "proteinAnalysis": "text",
          "carbAnalysis": "text",
          "fatAnalysis": "text",
          "recommendations": ["rec1", "rec2", "rec3"],
          "warnings": ["warning1", "warning2"],
          "encouragement": "text"
        }
      `;

      // Get AI analysis
      let aiAnalysis;
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(analysisPrompt);
        const response = await result.response;
        aiAnalysis = response.text();
      } catch (aiError) {
        console.error('AI Analysis failed:', aiError.message);
        // Provide fallback analysis if AI fails
        aiAnalysis = JSON.stringify({
          score: Math.round(((totalNutrition.calories / goals.dailyCalories) + 
                          (totalNutrition.protein / goals.protein) + 
                          (totalNutrition.carbs / goals.carbs) + 
                          (totalNutrition.fats / goals.fats)) / 4 * 100),
          calorieAnalysis: totalNutrition.calories < goals.dailyCalories ? 
            `You're ${goals.dailyCalories - totalNutrition.calories} calories short of your daily target` :
            totalNutrition.calories > goals.dailyCalories ? 
            `You're ${totalNutrition.calories - goals.dailyCalories} calories over your daily target` :
            "Your calorie intake is on target",
          proteinAnalysis: totalNutrition.protein < goals.protein ? 
            `You need ${goals.protein - totalNutrition.protein}g more protein` :
            "Good protein intake",
          carbAnalysis: totalNutrition.carbs < goals.carbs ? 
            `You need ${goals.carbs - totalNutrition.carbs}g more carbs` :
            "Good carbohydrate intake", 
          fatAnalysis: totalNutrition.fats < goals.fats ? 
            `You need ${goals.fats - totalNutrition.fats}g more healthy fats` :
            "Good fat intake",
          recommendations: [
            "Consider adding protein-rich snacks if protein is low",
            "Include more vegetables for micronutrients",
            "Stay hydrated with plenty of water"
          ],
          warnings: totalNutrition.calories > goals.dailyCalories * 1.2 ? 
            ["Calorie intake significantly exceeds target"] : [],
          encouragement: "Keep working towards your nutrition goals!"
        });
      }

      // Parse AI response
      let analysisData;
      try {
        analysisData = JSON.parse(aiAnalysis);
      } catch (parseError) {
        // Fallback if AI doesn't return valid JSON
        analysisData = {
          score: Math.round(((totalNutrition.calories / goals.dailyCalories) + 
                          (totalNutrition.protein / goals.protein) + 
                          (totalNutrition.carbs / goals.carbs) + 
                          (totalNutrition.fats / goals.fats)) / 4 * 100),
          calorieAnalysis: totalNutrition.calories < goals.dailyCalories ? 
            `You're ${goals.dailyCalories - totalNutrition.calories} calories short of your daily target` :
            totalNutrition.calories > goals.dailyCalories ? 
            `You're ${totalNutrition.calories - goals.dailyCalories} calories over your daily target` :
            "Your calorie intake is on target",
          proteinAnalysis: totalNutrition.protein < goals.protein ? 
            `You need ${goals.protein - totalNutrition.protein}g more protein` :
            "Good protein intake",
          carbAnalysis: totalNutrition.carbs < goals.carbs ? 
            `You need ${goals.carbs - totalNutrition.carbs}g more carbs` :
            "Good carbohydrate intake", 
          fatAnalysis: totalNutrition.fats < goals.fats ? 
            `You need ${goals.fats - totalNutrition.fats}g more healthy fats` :
            "Good fat intake",
          recommendations: [
            "Consider adding protein-rich snacks if protein is low",
            "Include more vegetables for micronutrients",
            "Stay hydrated with plenty of water"
          ],
          warnings: totalNutrition.calories > goals.dailyCalories * 1.2 ? 
            ["Calorie intake significantly exceeds target"] : [],
          encouragement: "Keep working towards your nutrition goals!"
        };
      }

      // Prepare comprehensive response
      const nutritionData = {
        goals: {
          dailyCalories: goals.dailyCalories,
          protein: goals.protein,
          carbs: goals.carbs,
          fats: goals.fats,
          healthGoal: goals.healthGoal,
          time: goals.time
        },
        currentIntake: totalNutrition,
        analysis: analysisData,
        lastUpdated: new Date()
      };

      res.json(nutritionData);
    } catch (error) {
      console.error('Error in nutrition analysis:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get nutrition tracking data for charts
  async getNutritionTracking(req, res) {
    try {
      const { customerId } = req.query;
      
      // Find customer by Firebase UID
      const customer = await Customer.findOne({ firebaseUid: customerId });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Get customer goals
      const goals = await Goals.findOne({ customer_id: customer._id });
      if (!goals) {
        return res.status(404).json({ message: 'Please set your nutrition goals first' });
      }

      // Get subscription history for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const subscriptions = await ConsumerSubscription.find({
        consumer_id: customer._id,
        created_at: { $gte: thirtyDaysAgo }
      }).populate('plan_id');

      // Calculate daily nutrition over the past 30 days
      const dailyNutrition = {};
      
      for (const subscription of subscriptions) {
        const plan = subscription.plan_id;
        if (plan && plan.selected_meals) {
          const subscriptionDays = Math.ceil((new Date(subscription.end_date) - new Date(subscription.start_date)) / (1000 * 60 * 60 * 24));
          
          for (let i = 0; i < subscriptionDays; i++) {
            const date = new Date(subscription.start_date);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            if (!dailyNutrition[dateStr]) {
              dailyNutrition[dateStr] = { calories: 0, protein: 0, carbs: 0, fats: 0 };
            }

            for (const mealId of plan.selected_meals) {
              // Check if mealId is a valid ObjectId
              if (!mongoose.Types.ObjectId.isValid(mealId)) {
                console.log(`Skipping invalid meal ID in tracking: ${mealId}`);
                continue;
              }
              
              try {
                const menu = await Menu.findById(mealId);
                if (menu) {
                  dailyNutrition[dateStr].calories += menu.calories || 0;
                  dailyNutrition[dateStr].protein += menu.protein || 0;
                  dailyNutrition[dateStr].carbs += menu.carbohydrate || 0;
                  dailyNutrition[dateStr].fats += menu.fat || 0;
                } else {
                  console.log(`Menu not found for tracking ID: ${mealId}`);
                }
              } catch (error) {
                console.error(`Error finding menu in tracking for ID ${mealId}:`, error.message);
              }
            }
          }
        }
      }

      // Format data for charts
      const trackingData = Object.keys(dailyNutrition)
        .sort()
        .slice(-30) // Last 30 days
        .map(date => ({
          date,
          calories: dailyNutrition[date].calories,
          protein: dailyNutrition[date].protein,
          carbs: dailyNutrition[date].carbs,
          fats: dailyNutrition[date].fats,
          caloriesTarget: goals.dailyCalories,
          proteinTarget: goals.protein,
          carbsTarget: goals.carbs,
          fatsTarget: goals.fats
        }));

      res.json({
        trackingData,
        summary: {
          avgCalories: trackingData.reduce((sum, day) => sum + day.calories, 0) / trackingData.length || 0,
          avgProtein: trackingData.reduce((sum, day) => sum + day.protein, 0) / trackingData.length || 0,
          avgCarbs: trackingData.reduce((sum, day) => sum + day.carbs, 0) / trackingData.length || 0,
          avgFats: trackingData.reduce((sum, day) => sum + day.fats, 0) / trackingData.length || 0,
          daysTracked: trackingData.length
        }
      });
    } catch (error) {
      console.error('Error fetching nutrition tracking:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = goalController;
