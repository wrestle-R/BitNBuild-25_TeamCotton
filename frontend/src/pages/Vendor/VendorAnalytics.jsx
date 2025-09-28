import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaChartLine, FaRupeeSign, FaUsers, FaBrain, FaLightbulb, FaExclamationTriangle, FaRobot, FaCalculator, FaSync, FaChartPie } from 'react-icons/fa';
import VendorSidebar from '../../components/Vendor/VendorSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
  LineChart,
  Area,
  AreaChart
} from 'recharts';

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
  const CACHE_EXPIRY_HOURS = 2;

  // Chart colors
  const COLORS = {
    revenue: '#3b82f6',
    costs: '#ef4444',
    profit: '#10b981',
    food: '#f59e0b',
    delivery: '#8b5cf6',
    platform: '#06b6d4',
    margin: '#ec4899'
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    if (user) {
      loadCachedAnalytics();
    }
  }, [user]);

  // ... (keep all existing cache and fetch functions) ...
  
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
          localStorage.removeItem(ANALYTICS_CACHE_KEY);
        }
      }
      
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
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(ANALYTICS_CACHE_KEY) || key.startsWith(PLAN_CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    
    setPlanPrediction(null);
    setSelectedPlan(null);
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

  // Parse AI insights into structured format
  const parseAIInsights = (insights) => {
    if (!insights) return { sections: [], recommendations: [] };

    const sections = [];
    const recommendations = [];
    
    const lines = insights.split('\n').filter(line => line.trim());
    let currentSection = '';
    let currentContent = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Check if it's a section header (starts with number or bullet)
      if (trimmed.match(/^\d+\.\s*\*\*.*\*\*/) || trimmed.match(/^\*\s*\*\*.*\*\*/)) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          sections.push({
            title: currentSection,
            content: currentContent.join(' ')
          });
        }
        
        // Start new section
        currentSection = trimmed.replace(/^\d+\.\s*\*\*/, '').replace(/^\*\s*\*\*/, '').replace(/\*\*/g, '');
        currentContent = [];
      } else if (trimmed.match(/^\*.*:/)) {
        // This is a recommendation
        recommendations.push(trimmed.replace(/^\*\s*/, ''));
      } else if (trimmed && currentSection) {
        currentContent.push(trimmed);
      }
    });

    // Add last section
    if (currentSection && currentContent.length > 0) {
      sections.push({
        title: currentSection,
        content: currentContent.join(' ')
      });
    }

    return { sections, recommendations };
  };

  // Prepare chart data
  const prepareOverviewChartData = () => {
    if (!analytics?.predictions) return [];
    
    return analytics.predictions.map(plan => ({
      name: plan.planName?.replace('All ', '') || 'Plan',
      revenue: plan.revenue?.totalRevenue || 0,
      costs: plan.costBreakdown?.totalCosts || 0,
      profit: plan.revenue?.projectedProfit || 0,
      margin: plan.revenue?.profitMargin || 0,
      subscribers: plan.predictedSubscribers || 0
    }));
  };

  const preparePieChartData = () => {
    if (!analytics?.predictions) return [];
    
    return analytics.predictions.map((plan, index) => ({
      name: plan.planName?.replace('All ', '') || 'Plan',
      value: plan.revenue?.totalRevenue || 0,
      fill: PIE_COLORS[index % PIE_COLORS.length]
    }));
  };

  const prepareCostBreakdownData = () => {
    if (!planPrediction?.optimization?.costBreakdown) return [];
    
    const breakdown = planPrediction.optimization.costBreakdown;
    return [
      {
        name: 'Food Costs',
        value: breakdown.foodCost || 0,
        fill: COLORS.food
      },
      {
        name: 'Delivery Costs',
        value: breakdown.deliveryCosts?.totalDeliveryCost || 0,
        fill: COLORS.delivery
      },
      {
        name: 'Platform Cut',
        value: breakdown.platformCut || 0,
        fill: COLORS.platform
      }
    ];
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry) => (
            <p key={entry.dataKey} style={{ color: entry.color }}>
              {entry.name}: ₹{entry.value?.toLocaleString() || 0}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
              {/* Overall Business Metrics with Charts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FaRobot className="w-5 h-5 text-primary" />
                      Business Performance Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="metrics" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
                        <TabsTrigger value="revenue">Revenue Split</TabsTrigger>
                        <TabsTrigger value="comparison">Plan Comparison</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="metrics" className="space-y-4">
                        {analytics.overallInsights?.businessMetrics && (
                          <div className="grid gap-4 md:grid-cols-3 mb-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-primary">
                                ₹{analytics.overallInsights.businessMetrics.totalRevenue?.toLocaleString() || 0}
                              </p>
                              <p className="text-sm text-muted-foreground">Projected Revenue</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">
                                ₹{analytics.overallInsights.businessMetrics.totalProfit?.toLocaleString() || 0}
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
                        )}
                        
                        {/* AI Insights - Parsed */}
                        {analytics.overallInsights?.insights && (
                          <div className="space-y-4">
                            {(() => {
                              const { sections, recommendations } = parseAIInsights(analytics.overallInsights.insights);
                              return (
                                <>
                                  {sections.map((section, index) => (
                                    <Alert key={index} className="bg-background/50">
                                      <FaLightbulb className="h-4 w-4" />
                                      <AlertDescription>
                                        <strong>{section.title}:</strong> {section.content}
                                      </AlertDescription>
                                    </Alert>
                                  ))}
                                  
                                  {recommendations.length > 0 && (
                                    <div className="mt-4">
                                      <h4 className="font-semibold mb-2">Key Recommendations:</h4>
                                      <div className="space-y-1">
                                        {recommendations.map((rec, index) => (
                                          <div key={index} className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/30">
                                            {rec}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="revenue" className="space-y-4">
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={preparePieChartData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {preparePieChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="comparison" className="space-y-4">
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={prepareOverviewChartData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend />
                              <Bar yAxisId="left" dataKey="revenue" fill={COLORS.revenue} name="Revenue" />
                              <Bar yAxisId="left" dataKey="costs" fill={COLORS.costs} name="Costs" />
                              <Bar yAxisId="left" dataKey="profit" fill={COLORS.profit} name="Profit" />
                              <Line yAxisId="right" type="monotone" dataKey="margin" stroke={COLORS.margin} name="Margin %" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>

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
                      Click on any plan to view detailed AI-powered insights and cost breakdowns
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
                            
                            <div className="grid grid-cols-3 gap-4 text-center mb-3">
                              <div>
                                <p className="text-lg font-bold text-primary">₹{plan.revenue?.totalRevenue?.toLocaleString() || 0}</p>
                                <p className="text-xs text-muted-foreground">Revenue</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-orange-600">₹{plan.costBreakdown?.totalCosts?.toLocaleString() || 0}</p>
                                <p className="text-xs text-muted-foreground">Total Costs</p>
                              </div>
                              <div>
                                <p className={`text-lg font-bold ${(plan.revenue?.projectedProfit || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ₹{plan.revenue?.projectedProfit?.toLocaleString() || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Profit</p>
                              </div>
                            </div>

                            <Progress 
                              value={Math.min(plan.revenue?.profitMargin || 0, 100)} 
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

              {/* Detailed Plan Analysis with Charts */}
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
                        <Tabs defaultValue="overview" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
                            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                            <TabsTrigger value="insights">AI Insights</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="overview" className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                              {/* Revenue vs Cost Chart */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Revenue vs Costs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={[{
                                        name: selectedPlan.planName?.replace('All ', '') || 'Plan',
                                        revenue: planPrediction.optimization.revenue?.totalRevenue || 0,
                                        costs: planPrediction.optimization.costBreakdown?.totalCosts || 0,
                                        profit: planPrediction.optimization.revenue?.projectedProfit || 0
                                      }]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="revenue" fill={COLORS.revenue} name="Revenue" />
                                        <Bar dataKey="costs" fill={COLORS.costs} name="Costs" />
                                        <Bar dataKey="profit" fill={COLORS.profit} name="Profit" />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Key Metrics */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Key Metrics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                                      <p className="text-2xl font-bold text-primary">
                                        {planPrediction.optimization.predictedSubscribers || 0}
                                      </p>
                                      <p className="text-sm text-muted-foreground">Subscribers</p>
                                    </div>
                                    <div className="text-center p-3 bg-green-500/5 rounded-lg">
                                      <p className="text-2xl font-bold text-green-600">
                                        {planPrediction.optimization.revenue?.profitMargin || 0}%
                                      </p>
                                      <p className="text-sm text-muted-foreground">Profit Margin</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm">Total Revenue:</span>
                                      <span className="font-medium">₹{planPrediction.optimization.revenue?.totalRevenue?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm">Total Costs:</span>
                                      <span className="font-medium">₹{planPrediction.optimization.costBreakdown?.totalCosts?.toLocaleString() || 0}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-semibold">
                                      <span>Net Profit:</span>
                                      <span className={`${(planPrediction.optimization.revenue?.projectedProfit || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₹{planPrediction.optimization.revenue?.projectedProfit?.toLocaleString() || 0}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="costs" className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                              {/* Cost Breakdown Pie Chart */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <FaChartPie className="w-4 h-4" />
                                    Cost Distribution
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={prepareCostBreakdownData()}
                                          cx="50%"
                                          cy="50%"
                                          labelLine={false}
                                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                          outerRadius={80}
                                          fill="#8884d8"
                                          dataKey="value"
                                        >
                                          {prepareCostBreakdownData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                          ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Detailed Cost Breakdown */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <FaRupeeSign className="w-4 h-4" />
                                    Detailed Breakdown
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
                                      <span className="text-sm font-medium">Food Costs:</span>
                                      <span className="font-bold text-amber-700 dark:text-amber-400">
                                        ₹{planPrediction.optimization.costBreakdown?.foodCost?.toLocaleString() || 0}
                                      </span>
                                    </div>
                                    <div className="space-y-1 ml-4 text-sm text-muted-foreground">
                                      <div className="flex justify-between">
                                        <span>• Fuel Costs:</span>
                                        <span>₹{planPrediction.optimization.costBreakdown?.deliveryCosts?.fuelCost?.toLocaleString() || 0}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>• Driver Payments:</span>
                                        <span>₹{planPrediction.optimization.costBreakdown?.deliveryCosts?.driverCost?.toLocaleString() || 0}</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-950/20 rounded">
                                      <span className="text-sm font-medium">Delivery Costs:</span>
                                      <span className="font-bold text-purple-700 dark:text-purple-400">
                                        ₹{planPrediction.optimization.costBreakdown?.deliveryCosts?.totalDeliveryCost?.toLocaleString() || 0}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-cyan-50 dark:bg-cyan-950/20 rounded">
                                      <span className="text-sm font-medium">Platform Cut (5%):</span>
                                      <span className="font-bold text-cyan-700 dark:text-cyan-400">
                                        ₹{planPrediction.optimization.costBreakdown?.platformCut?.toLocaleString() || 0}
                                      </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 rounded font-semibold">
                                      <span>Total Costs:</span>
                                      <span>₹{planPrediction.optimization.costBreakdown?.totalCosts?.toLocaleString() || 0}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="recommendations" className="space-y-4">
                            {planPrediction.optimization.recommendations && planPrediction.optimization.recommendations.length > 0 ? (
                              <div className="space-y-3">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <FaChartLine className="w-4 h-4" />
                                  ML-Powered Recommendations
                                </h4>
                                {planPrediction.optimization.recommendations.map((rec, index) => (
                                  <Alert key={index} variant={rec.impact === 'high' ? 'destructive' : rec.impact === 'positive' ? 'default' : 'default'}>
                                    <FaLightbulb className="h-4 w-4" />
                                    <AlertDescription>
                                      <span className="font-medium capitalize">{rec.type || 'General'}:</span> {rec.message || rec}
                                    </AlertDescription>
                                  </Alert>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <FaLightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No specific recommendations available</p>
                              </div>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="insights" className="space-y-4">
                            {planPrediction.aiInsights ? (
                              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <FaBrain className="w-5 h-5" />
                                    Gemini AI Strategic Insights
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    {(() => {
                                      const { sections, recommendations } = parseAIInsights(planPrediction.aiInsights.insights);
                                      return (
                                        <>
                                          {sections.map((section, index) => (
                                            <div key={index} className="border-l-4 border-primary/30 pl-4">
                                              <h5 className="font-semibold mb-2">{section.title}</h5>
                                              <p className="text-sm leading-relaxed text-muted-foreground">
                                                {section.content}
                                              </p>
                                            </div>
                                          ))}
                                          
                                          {recommendations.length > 0 && (
                                            <div className="mt-6">
                                              <h5 className="font-semibold mb-3">Strategic Actions:</h5>
                                              <div className="space-y-2">
                                                {recommendations.map((rec, index) => (
                                                  <div key={index} className="flex items-start gap-2 text-sm">
                                                    <FaLightbulb className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                                                    <span>{rec}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                                    Generated by Gemini AI • {new Date(planPrediction.aiInsights.generatedAt).toLocaleString()}
                                  </p>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="text-center py-8">
                                <FaBrain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">AI insights not available</p>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
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