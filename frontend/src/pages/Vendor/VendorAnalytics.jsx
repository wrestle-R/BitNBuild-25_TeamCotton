import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaChartLine, FaRupeeSign, FaUsers, FaBrain, FaLightbulb, FaExclamationTriangle, FaRobot, FaCalculator, FaSync } from 'react-icons/fa';
import VendorSidebar from '../../components/Vendor/VendorSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';

const VendorAnalytics = () => {
  const { user } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planPrediction, setPlanPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Cache keys
  const ANALYTICS_CACHE_KEY = `vendor_analytics_${user?.uid}`;
  const PLAN_CACHE_KEY = `vendor_plan_prediction_${user?.uid}`;
  const CACHE_EXPIRY_HOURS = 2; // Cache expires after 2 hours

  useEffect(() => {
    if (user) {
      loadCachedAnalytics();
    }
  }, [user]);

  // Load cached analytics data
  const loadCachedAnalytics = () => {
    try {
      const cachedData = localStorage.getItem(ANALYTICS_CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
        
        if (!isExpired) {
          setAnalytics(data);
          setLastUpdated(new Date(timestamp));
          setLoading(false);
          toast.success('Loaded cached analytics data');
          return;
        } else {
          // Remove expired cache
          localStorage.removeItem(ANALYTICS_CACHE_KEY);
        }
      }
      
      // No valid cache found, fetch fresh data
      fetchAnalytics();
    } catch (error) {
      console.error('Error loading cached analytics:', error);
      fetchAnalytics();
    }
  };

  // Save analytics to cache
  const saveAnalyticsToCache = (data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(ANALYTICS_CACHE_KEY, JSON.stringify(cacheData));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error saving analytics to cache:', error);
    }
  };

  // Load cached plan prediction
  const loadCachedPlanPrediction = (planId) => {
    try {
      const cachedData = localStorage.getItem(`${PLAN_CACHE_KEY}_${planId}`);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
        
        if (!isExpired) {
          setPlanPrediction(data);
          return true;
        } else {
          localStorage.removeItem(`${PLAN_CACHE_KEY}_${planId}`);
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading cached plan prediction:', error);
      return false;
    }
  };

  // Save plan prediction to cache
  const savePlanPredictionToCache = (planId, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${PLAN_CACHE_KEY}_${planId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving plan prediction to cache:', error);
    }
  };

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/predictions/analytics`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
        saveAnalyticsToCache(data.data);
        toast.success(isRefresh ? 'Analytics refreshed successfully' : 'Analytics loaded successfully');
      } else {
        toast.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error loading analytics');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchPlanPrediction = async (planId, isRefresh = false) => {
    // Check cache first unless it's a refresh
    if (!isRefresh && loadCachedPlanPrediction(planId)) {
      toast.success('Loaded cached prediction data');
      return;
    }

    setLoadingPrediction(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/predictions/profit/${planId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlanPrediction(data.data);
        savePlanPredictionToCache(planId, data.data);
        toast.success('Plan prediction loaded successfully');
      } else {
        toast.error('Failed to fetch plan prediction');
      }
    } catch (error) {
      console.error('Error fetching plan prediction:', error);
      toast.error('Error loading prediction');
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    fetchPlanPrediction(plan.planId);
  };

  const handleRefreshAnalytics = () => {
    // Clear all related cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(ANALYTICS_CACHE_KEY) || key.startsWith(PLAN_CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear current plan prediction
    setPlanPrediction(null);
    setSelectedPlan(null);
    
    // Fetch fresh data
    fetchAnalytics(true);
  };

  const handleRefreshPlanPrediction = () => {
    if (selectedPlan) {
      fetchPlanPrediction(selectedPlan.planId, true);
    }
  };

  const getProfitColor = (margin) => {
    if (margin >= 30) return 'text-green-600';
    if (margin >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProfitBadge = (margin) => {
    if (margin >= 30) return { variant: 'default', text: 'Excellent' };
    if (margin >= 15) return { variant: 'secondary', text: 'Good' };
    return { variant: 'destructive', text: 'Needs Improvement' };
  };

  const formatLastUpdated = (date) => {
    if (!date) return '';
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <VendorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            <div className="grid gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 w-48 bg-muted rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-muted rounded"></div>
                      <div className="h-4 w-3/4 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <VendorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6 space-y-6">
          {/* Header with Refresh Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FaBrain className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">AI-Powered Business Analytics</h1>
              </div>
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <div className="text-sm text-muted-foreground">
                    Last updated: {formatLastUpdated(lastUpdated)}
                  </div>
                )}
                <Button
                  onClick={handleRefreshAnalytics}
                  disabled={refreshing}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FaSync className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh Analytics'}
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              Maximize your profits with machine learning predictions and AI insights
            </p>
          </motion.div>

          {analytics && (
            <>
              {/* Overall Business Metrics */}
              {analytics.overallInsights && analytics.overallInsights.businessMetrics && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FaRobot className="w-5 h-5 text-primary" />
                        AI Business Intelligence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">
                            ₹{analytics.overallInsights.businessMetrics.totalRevenue || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Projected Revenue</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{analytics.overallInsights.businessMetrics.totalProfit || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Projected Profit</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${getProfitColor(analytics.overallInsights.businessMetrics.averageMargin || 0)}`}>
                            {analytics.overallInsights.businessMetrics.averageMargin || 0}%
                          </p>
                          <p className="text-sm text-muted-foreground">Average Margin</p>
                        </div>
                      </div>
                      <Alert className="bg-background/50">
                        <FaLightbulb className="h-4 w-4" />
                        <AlertDescription className="text-sm leading-relaxed">
                          {analytics.overallInsights.insights || 'No insights available'}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Plan Performance Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FaChartLine className="w-5 h-5 text-primary" />
                      Plan Performance Predictions
                    </CardTitle>
                    <CardDescription>
                      Click on any plan to view detailed AI-powered insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {analytics.predictions && analytics.predictions.length > 0 ? (
                        analytics.predictions.map((plan, index) => (
                          <motion.div
                            key={plan.planId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              selectedPlan?.planId === plan.planId ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => handlePlanSelect(plan)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{plan.planName || 'Unnamed Plan'}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {plan.predictedSubscribers || 0} predicted subscribers
                                </p>
                              </div>
                              <Badge {...getProfitBadge(plan.revenue?.profitMargin || 0)}>
                                {plan.revenue?.profitMargin || 0}% margin
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-lg font-bold text-primary">₹{plan.revenue?.totalRevenue || 0}</p>
                                <p className="text-xs text-muted-foreground">Revenue</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-orange-600">₹{plan.costBreakdown?.totalCosts || 0}</p>
                                <p className="text-xs text-muted-foreground">Total Costs</p>
                              </div>
                              <div>
                                <p className={`text-lg font-bold ${(plan.revenue?.projectedProfit || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ₹{plan.revenue?.projectedProfit || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Profit</p>
                              </div>
                            </div>

                            <Progress 
                              value={plan.revenue?.profitMargin || 0} 
                              className="mt-3" 
                            />
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No plan predictions available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Detailed Plan Analysis */}
              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FaCalculator className="w-5 h-5 text-primary" />
                          Detailed Analysis: {selectedPlan.planName}
                        </CardTitle>
                        <Button
                          onClick={handleRefreshPlanPrediction}
                          disabled={loadingPrediction}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <FaSync className={`w-3 h-3 ${loadingPrediction ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingPrediction ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-4 w-full bg-muted rounded mb-2"></div>
                              <div className="h-4 w-3/4 bg-muted rounded"></div>
                            </div>
                          ))}
                        </div>
                      ) : planPrediction?.optimization ? (
                        <div className="space-y-6">
                          {/* Cost Breakdown */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <FaRupeeSign className="w-4 h-4" />
                              Cost Breakdown
                            </h4>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Food Costs:</span>
                                  <span className="font-medium">₹{planPrediction.optimization.costBreakdown?.foodCost || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Delivery Costs:</span>
                                  <span className="font-medium">₹{planPrediction.optimization.costBreakdown?.deliveryCosts?.totalDeliveryCost || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Platform Cut (5%):</span>
                                  <span className="font-medium">₹{planPrediction.optimization.costBreakdown?.platformCut || 0}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                  <span>Total Costs:</span>
                                  <span>₹{planPrediction.optimization.costBreakdown?.totalCosts || 0}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Fuel Costs:</span>
                                  <span className="font-medium">₹{planPrediction.optimization.costBreakdown?.deliveryCosts?.fuelCost || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Driver Payments:</span>
                                  <span className="font-medium">₹{planPrediction.optimization.costBreakdown?.deliveryCosts?.driverCost || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Expected Subscribers:</span>
                                  <span className="font-medium">{planPrediction.optimization.predictedSubscribers || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* AI Recommendations */}
                          {planPrediction.optimization.recommendations && planPrediction.optimization.recommendations.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <FaChartLine className="w-4 h-4" />
                                ML Recommendations
                              </h4>
                              <div className="space-y-2">
                                {planPrediction.optimization.recommendations.map((rec, index) => (
                                  <Alert key={index} variant={rec.impact === 'high' ? 'destructive' : 'default'}>
                                    <FaLightbulb className="h-4 w-4" />
                                    <AlertDescription>{rec.message || rec}</AlertDescription>
                                  </Alert>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Gemini AI Insights */}
                          {planPrediction.aiInsights && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <FaBrain className="w-4 h-4" />
                                Gemini AI Strategic Insights
                              </h4>
                              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                                <CardContent className="pt-4">
                                  <p className="text-sm leading-relaxed whitespace-pre-line">
                                    {planPrediction.aiInsights.insights || 'No insights available'}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Generated by Gemini AI • {new Date(planPrediction.aiInsights.generatedAt).toLocaleString()}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No prediction data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          )}

          {!analytics?.predictions?.length && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FaChartLine className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Plans Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create subscription plans to see AI-powered profit predictions and insights.
                </p>
                <Button onClick={() => window.location.href = '/vendor/plans'}>
                  Create Your First Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorAnalytics;