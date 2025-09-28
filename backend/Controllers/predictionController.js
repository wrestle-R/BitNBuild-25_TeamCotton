const { GoogleGenerativeAI } = require('@google/generative-ai');
const Vendor = require('../Models/Vendor');
const Plan = require('../Models/Plan');
const Menu = require('../Models/Menu');
const Payment = require('../Models/Payment');
const ConsumerSubscription = require('../Models/ConsumerSubscription');
require('dotenv').config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

class ProfitOptimizer {
  // Base ingredient costs (per serving in INR)
  static ingredientCosts = {
    rice: 8,
    dal: 12,
    vegetables: 15,
    paneer: 25,
    chicken: 35,
    mutton: 60,
    fish: 30,
    oil: 3,
    spices: 5,
    bread: 4,
    milk: 6,
    curd: 8,
    ghee: 8
  };

  // Calculate estimated cost to make a menu item
  static calculateMenuItemCost(menuItem, isNonVeg = false) {
    let baseCost = 0;
    
    // Base meal cost calculation
    if (menuItem.meal_type === 'breakfast') {
      baseCost = this.ingredientCosts.bread + this.ingredientCosts.milk + 
                this.ingredientCosts.oil + this.ingredientCosts.spices;
    } else if (menuItem.meal_type === 'lunch' || menuItem.meal_type === 'dinner') {
      baseCost = this.ingredientCosts.rice + this.ingredientCosts.dal + 
                this.ingredientCosts.vegetables + this.ingredientCosts.oil + 
                this.ingredientCosts.spices;
    }

    // Add non-veg cost
    if (isNonVeg) {
      baseCost += this.ingredientCosts.chicken; // Default to chicken
    }

    // Add packaging and overhead (15%)
    const packagingCost = baseCost * 0.15;
    
    return Math.round(baseCost + packagingCost);
  }

  // Predict demand based on historical data and market trends
  static async predictDemand(vendorId, planType) {
    try {
      // Get historical subscription data
      const historicalSubs = await ConsumerSubscription.find({
        vendor_id: vendorId,
        active: true
      }).populate('plan_id');

      // Get recent payments
      const recentPayments = await Payment.find({
        vendor_id: vendorId,
        payment_status: 'success',
        payment_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      // Base demand calculation
      let baseDemand = 5; // Minimum expected subscribers
      
      // Factor in historical performance
      if (historicalSubs.length > 0) {
        baseDemand = Math.max(baseDemand, historicalSubs.length);
      }

      // Growth factor based on recent payments
      if (recentPayments.length > 0) {
        const growthRate = recentPayments.length / 30; // Daily average
        baseDemand += Math.round(growthRate * 7); // Weekly growth
      }

      // Plan type multiplier
      const planMultipliers = {
        'One day': 1.5,    // Higher demand for trial
        'All week': 1.0,   // Standard demand
        'All month': 0.7   // Lower demand but higher value
      };

      const predictedDemand = Math.round(baseDemand * (planMultipliers[planType] || 1.0));
      
      return Math.max(predictedDemand, 3); // Minimum 3 subscribers
    } catch (error) {
      console.error('Error predicting demand:', error);
      return 5; // Fallback
    }
  }

  // Calculate delivery costs
  static calculateDeliveryCosts(subscriberCount, avgDistance = 3) {
    const costPerKm = 8; // INR per km
    const baseFuelCost = 15; // Base fuel cost per delivery
    const driverPayment = 25; // Per delivery payment to driver
    
    const totalDistance = subscriberCount * avgDistance * 2; // Round trip
    const fuelCost = (totalDistance * costPerKm) + (subscriberCount * baseFuelCost);
    const driverCost = subscriberCount * driverPayment;
    
    return {
      fuelCost: Math.round(fuelCost),
      driverCost: Math.round(driverCost),
      totalDeliveryCost: Math.round(fuelCost + driverCost)
    };
  }

  // Calculate platform cut (5%)
  static calculatePlatformCut(totalRevenue) {
    return Math.round(totalRevenue * 0.05);
  }

  // Main profit optimization function
  static async optimizeProfitForPlan(vendorId, planData) {
    try {
      // Get vendor's menu items for the plan
      const menuItems = await Menu.find({
        vendor_id: vendorId,
        meal_type: { $in: planData.selected_meals }
      });

      // Calculate cost per meal
      let costPerMeal = 0;
      menuItems.forEach(menu => {
        menu.items.forEach(item => {
          costPerMeal += this.calculateMenuItemCost(item, menu.non_veg);
        });
      });
      
      if (menuItems.length > 0) {
        costPerMeal = costPerMeal / menuItems.length; // Average cost
      } else {
        costPerMeal = 40; // Default cost
      }

      // Predict demand
      const predictedSubscribers = await this.predictDemand(vendorId, planData.name);

      // Calculate total costs
      const totalMeals = predictedSubscribers * planData.duration_days * planData.meals_per_day;
      const foodCost = totalMeals * costPerMeal;
      
      const deliveryCosts = this.calculateDeliveryCosts(predictedSubscribers);
      const totalRevenue = predictedSubscribers * planData.price;
      const platformCut = this.calculatePlatformCut(totalRevenue);
      
      const totalCosts = foodCost + deliveryCosts.totalDeliveryCost + platformCut;
      const projectedProfit = totalRevenue - totalCosts;
      const profitMargin = ((projectedProfit / totalRevenue) * 100).toFixed(1);

      return {
        predictedSubscribers,
        costBreakdown: {
          foodCost,
          deliveryCosts,
          platformCut,
          totalCosts
        },
        revenue: {
          totalRevenue,
          projectedProfit,
          profitMargin: parseFloat(profitMargin)
        },
        recommendations: this.generateRecommendations(profitMargin, planData.price, costPerMeal)
      };
    } catch (error) {
      console.error('Error optimizing profit:', error);
      throw error;
    }
  }

  // Generate recommendations
  static generateRecommendations(profitMargin, currentPrice, costPerMeal) {
    const recommendations = [];

    if (profitMargin < 20) {
      recommendations.push({
        type: 'pricing',
        message: 'Consider increasing your plan price by 10-15% to improve profit margins',
        impact: 'high'
      });
    }

    if (costPerMeal > 50) {
      recommendations.push({
        type: 'cost',
        message: 'Optimize ingredient costs by bulk purchasing or finding better suppliers',
        impact: 'medium'
      });
    }

    if (profitMargin > 40) {
      recommendations.push({
        type: 'growth',
        message: 'Great margins! Consider expanding your menu or service area',
        impact: 'positive'
      });
    }

    return recommendations;
  }
}

// Get profit predictions for a specific plan
const getProfitPrediction = async (req, res) => {
  try {
    const { planId } = req.params;
    const vendorId = req.user.uid;

    // Get plan details
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Get profit optimization data
    const optimization = await ProfitOptimizer.optimizeProfitForPlan(vendorId, plan);

    // Get Gemini AI insights
    const geminiInsights = await getGeminiInsights(plan, optimization);

    res.json({
      success: true,
      data: {
        plan: plan,
        optimization,
        aiInsights: geminiInsights
      }
    });
  } catch (error) {
    console.error('Error getting profit prediction:', error);
    res.status(500).json({ error: 'Failed to get profit prediction' });
  }
};

// Get overall business analytics
const getBusinessAnalytics = async (req, res) => {
  try {
    const vendorId = req.user.uid;

    // Get all vendor plans
    const plans = await Plan.find({ vendor_id: vendorId });
    
    const analytics = {
      totalPlans: plans.length,
      predictions: [],
      overallInsights: null
    };

    // Get predictions for each plan
    for (const plan of plans) {
      try {
        const optimization = await ProfitOptimizer.optimizeProfitForPlan(vendorId, plan);
        analytics.predictions.push({
          planId: plan._id,
          planName: plan.name,
          ...optimization
        });
      } catch (error) {
        console.error(`Error optimizing plan ${plan._id}:`, error);
      }
    }

    // Get overall business insights from Gemini
    if (analytics.predictions.length > 0) {
      analytics.overallInsights = await getOverallBusinessInsights(analytics.predictions);
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting business analytics:', error);
    res.status(500).json({ error: 'Failed to get business analytics' });
  }
};

// Gemini AI Integration for insights
async function getGeminiInsights(plan, optimization) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
    As a business consultant for food delivery services, analyze this subscription plan and provide insights:
    
    Plan Details:
    - Name: ${plan.name}
    - Price: ₹${plan.price}
    - Duration: ${plan.duration_days} days
    - Meals per day: ${plan.meals_per_day}
    - Selected meals: ${plan.selected_meals.join(', ')}
    
    Financial Analysis:
    - Predicted subscribers: ${optimization.predictedSubscribers}
    - Total revenue: ₹${optimization.revenue.totalRevenue}
    - Total costs: ₹${optimization.costBreakdown.totalCosts}
    - Projected profit: ₹${optimization.revenue.projectedProfit}
    - Profit margin: ${optimization.revenue.profitMargin}%
    
    Provide:
    1. Key insights about the plan's profitability
    2. Market positioning advice
    3. Specific actionable recommendations
    4. Risk assessment
    5. Growth opportunities
    
    Keep the response concise but actionable (max 200 words).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return {
      insights: response.text(),
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error getting Gemini insights:', error);
    return {
      insights: "AI insights temporarily unavailable. Please try again later.",
      generatedAt: new Date()
    };
  }
}

// Overall business insights
async function getOverallBusinessInsights(predictions) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const totalRevenue = predictions.reduce((sum, p) => sum + p.revenue.totalRevenue, 0);
    const totalProfit = predictions.reduce((sum, p) => sum + p.revenue.projectedProfit, 0);
    const avgMargin = (totalProfit / totalRevenue * 100).toFixed(1);
    
    const prompt = `
    As a business strategy consultant, analyze this food vendor's overall business performance:
    
    Business Overview:
    - Total Plans: ${predictions.length}
    - Combined Revenue: ₹${totalRevenue}
    - Combined Profit: ₹${totalProfit}
    - Average Margin: ${avgMargin}%
    
    Plan Performance:
    ${predictions.map(p => 
      `- ${p.planName}: ₹${p.revenue.totalRevenue} revenue, ${p.revenue.profitMargin}% margin`
    ).join('\n')}
    
    Provide strategic recommendations for:
    1. Portfolio optimization
    2. Pricing strategy
    3. Cost management
    4. Market expansion opportunities
    5. Risk mitigation
    
    Focus on actionable insights for maximizing profitability (max 250 words).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return {
      insights: response.text(),
      generatedAt: new Date(),
      businessMetrics: {
        totalRevenue,
        totalProfit,
        averageMargin: parseFloat(avgMargin)
      }
    };
  } catch (error) {
    console.error('Error getting overall business insights:', error);
    return {
      insights: "AI business insights temporarily unavailable. Please try again later.",
      generatedAt: new Date()
    };
  }
}

module.exports = {
  getProfitPrediction,
  getBusinessAnalytics,
  ProfitOptimizer
};