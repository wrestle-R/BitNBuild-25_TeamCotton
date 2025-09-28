import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaChartLine, FaRupeeSign, FaUsers, FaBrain, FaLightbulb, FaExclamationTriangle, FaRobot, FaCalculator } from 'react-icons/fa';
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
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planPrediction, setPlanPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    setLoading(true);
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
      } else {
        toast.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanPrediction = async (planId) => {
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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <FaBrain className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">AI-Powered Business Analytics</h1>
            </div>
            <p className="text-muted-foreground">
              Maximize your profits with machine learning predictions and AI insights
            </p>
          </motion.div>

          {analytics && (
            <>
              {/* Overall Business Metrics */}
              {analytics.overallInsights && (
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
                            ₹{analytics.overallInsights.businessMetrics.totalRevenue}
                          </p>
                          <p className="text-sm text-muted-foreground">Projected Revenue</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{analytics.overallInsights.businessMetrics.totalProfit}
                          </p>
                          <p className="text-sm text-muted-foreground">Projected Profit</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${getProfitColor(analytics.overallInsights.businessMetrics.averageMargin)}`}>
                            {analytics.overallInsights.businessMetrics.averageMargin}%
                          </p>
                          <p className="text-sm text-muted-foreground">Average Margin</p>
                        </div>
                      </div>
                      <Alert className="bg-background/50">
                        <FaLightbulb className="h-4 w-4" />
                        <AlertDescription className="text-sm leading-relaxed">
                          {analytics.overallInsights.insights}
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
                      {analytics.predictions.map((plan, index) => (
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
                              <h3 className="font-semibold text-lg">{plan.planName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {plan.predictedSubscribers} predicted subscribers
                              </p>
                            </div>
                            <Badge {...getProfitBadge(plan.revenue.profitMargin)}>
                              {plan.revenue.profitMargin}% margin
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-lg font-bold text-primary">₹{plan.revenue.totalRevenue}</p>
                              <p className="text-xs text-muted-foreground">Revenue</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-orange-600">₹{plan.costBreakdown.totalCosts}</p>
                              <p className="text-xs text-muted-foreground">Total Costs</p>
                            </div>
                            <div>
                              <p className={`text-lg font-bold ${plan.revenue.projectedProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{plan.revenue.projectedProfit}
                              </p>
                              <p className="text-xs text-muted-foreground">Profit</p>
                            </div>
                          </div>

                          <Progress 
                            value={plan.revenue.profitMargin} 
                            className="mt-3" 
                          />
                        </motion.div>
                      ))}
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
                      <CardTitle className="flex items-center gap-2">
                        <FaCalculator className="w-5 h-5 text-primary" />
                        Detailed Analysis: {selectedPlan.planName}
                      </CardTitle>
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
                      ) : planPrediction ? (
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
                                  <span className="font-medium">₹{planPrediction.optimization.costBreakdown.foodCost}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Delivery Costs:</span>
                                  <span className="font-medium">₹{planPrediction.optimization.costBreakdown.deliveryCosts.totalDeliveryCost}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Platform Cut (5%):</span>
                                  <span className="font-medium">₹{planPrediction.optimization.costBreakdown.platformCut}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                  <span>Total Costs:</span>
                                  <span>₹{planPrediction.optimization.costBreakdown.totalCosts}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Fuel Costs:</span>
                                  <span className="font-medium">₹{planPrediction.optimization.costBreakdown.deliveryCosts.fuelCost}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Driver Payments:</span>
                                  <span className="font-medium">₹{planPrediction.optimization.costBreakdown.deliveryCosts.driverCost}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Expected Subscribers:</span>
                                  <span className="font-medium">{planPrediction.optimization.predictedSubscribers}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* AI Recommendations */}
                          {planPrediction.optimization.recommendations.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <FaChartLine className="w-4 h-4" />
                                ML Recommendations
                              </h4>
                              <div className="space-y-2">
                                {planPrediction.optimization.recommendations.map((rec, index) => (
                                  <Alert key={index} variant={rec.impact === 'high' ? 'destructive' : 'default'}>
                                    <FaLightbulb className="h-4 w-4" />
                                    <AlertDescription>{rec.message}</AlertDescription>
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
                                    {planPrediction.aiInsights.insights}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Generated by Gemini AI • {new Date(planPrediction.aiInsights.generatedAt).toLocaleString()}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </div>
                      ) : null}
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