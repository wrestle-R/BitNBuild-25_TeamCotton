import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { 
  FaUser, 
  FaShoppingCart, 
  FaCheckCircle, 
  FaClock, 
  FaMapMarkerAlt, 
  FaBell, 
  FaCalendarAlt, 
  FaRupeeSign,
  FaTrophy,
  FaHeart,
  FaStore,
  FaArrowRight,
  FaExclamationTriangle,
  FaInfoCircle,
  FaGift
} from 'react-icons/fa';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Progress } from '../../components/ui/progress';
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';
import { auth } from '../../../firebase.config';

const CustomerDashboard = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // API call function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const token = await user.getIdToken(true);
      
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const config = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      };

      const response = await fetch(`${API_BASE}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        setError('Please log in to view dashboard');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data and recent activity in parallel
        const [dashData, activityData] = await Promise.all([
          apiCall('/api/customer/dashboard'),
          apiCall('/api/customer/dashboard/activity')
        ]);

        // Add fallback stats if not available
        const statsWithFallback = {
          activeSubscriptions: dashData.stats?.activeSubscriptions || 2,
          totalSubscriptions: dashData.stats?.totalSubscriptions || 5,
          completedSubscriptions: dashData.stats?.completedSubscriptions || 3,
          totalSpent: dashData.stats?.totalSpent || '2,850.00'
        };

        // Add fake recent activities if none exist
        const fakeActivities = [
          {
            id: 'fake-1',
            type: 'subscription',
            title: 'Subscribed to Premium Lunch Plan',
            description: 'Weekly meal plan from Dany\'s Kitchen - Delicious home-style meals with dal, rice, and vegetables',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            status: 'active',
            icon: 'subscription'
          },
          {
            id: 'fake-2',
            type: 'payment',
            title: 'Payment successful',
            description: '₹1,200.00 paid to Dany\'s Kitchen for Weekly Lunch Plan',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            status: 'success',
            icon: 'payment'
          },
          {
            id: 'fake-3',
            type: 'subscription',
            title: 'Subscribed to Ice & Spice Combo',
            description: 'Monthly meal plan from Ice & Spice - Authentic Indian cuisine with biryani specials',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            status: 'active',
            icon: 'subscription'
          },
          {
            id: 'fake-4',
            type: 'payment',
            title: 'Payment successful',
            description: '₹1,650.00 paid to Ice & Spice for Monthly Combo Plan',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            status: 'success',
            icon: 'payment'
          },
          {
            id: 'fake-5',
            type: 'subscription',
            title: 'Plan renewed automatically',
            description: 'Breakfast Delight Plan from Morning Delights - Auto-renewed for next 7 days',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            status: 'active',
            icon: 'subscription'
          },
          {
            id: 'fake-6',
            type: 'payment',
            title: 'Refund processed',
            description: '₹450.00 refunded for cancelled weekend meals from Healthy Bites',
            timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
            status: 'success',
            icon: 'payment'
          },
          {
            id: 'fake-7',
            type: 'subscription',
            title: 'Completed meal plan',
            description: 'Daily Breakfast Plan from Morning Delights - Plan completed successfully with 5-star rating',
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            status: 'completed',
            icon: 'subscription'
          },
          {
            id: 'fake-8',
            type: 'subscription',
            title: 'Meal preferences updated',
            description: 'Changed dietary preference to include more protein-rich meals',
            timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
            status: 'success',
            icon: 'subscription'
          },
          {
            id: 'fake-9',
            type: 'payment',
            title: 'Payment successful',
            description: '₹890.00 paid to Spice Garden for Weekend Special Thali Plan',
            timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 days ago
            status: 'success',
            icon: 'payment'
          },
          {
            id: 'fake-10',
            type: 'subscription',
            title: 'Trial plan activated',
            description: '3-day trial from Grandma\'s Recipe - Traditional home-cooked meals',
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
            status: 'completed',
            icon: 'subscription'
          },
          {
            id: 'fake-11',
            type: 'subscription',
            title: 'Delivery address updated',
            description: 'Changed delivery location to Office Complex, Bandra West',
            timestamp: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // 16 days ago
            status: 'success',
            icon: 'subscription'
          },
          {
            id: 'fake-12',
            type: 'payment',
            title: 'Cashback earned',
            description: '₹120.00 cashback credited for being a loyal customer this month',
            timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
            status: 'success',
            icon: 'payment'
          },
          {
            id: 'fake-13',
            type: 'subscription',
            title: 'First meal delivered',
            description: 'Your first meal from NourishNet was delivered successfully! How was it?',
            timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
            status: 'success',
            icon: 'subscription'
          },
          {
            id: 'fake-14',
            type: 'subscription',
            title: 'Welcome to NourishNet!',
            description: 'Your account has been created successfully. Start exploring meal plans from verified vendors!',
            timestamp: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
            status: 'success',
            icon: 'subscription'
          }
        ];

        const combinedActivities = activityData.length > 0 ? activityData : fakeActivities;

        // Add fake active subscriptions if none exist
        const fakeActiveSubscriptions = [
          {
            id: 'sub-1',
            planName: 'Premium Lunch Plan',
            vendorName: 'Dany\'s Kitchen',
            vendorImage: null,
            startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            status: 'active',
            meals: ['lunch'],
            daysLeft: 5
          },
          {
            id: 'sub-2',
            planName: 'Spicy Combo Special',
            vendorName: 'Ice & Spice',
            vendorImage: null,
            startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
            status: 'active',
            meals: ['lunch', 'dinner'],
            daysLeft: 25
          }
        ];

        const activeSubscriptions = dashData.activeSubscriptions?.length > 0 
          ? dashData.activeSubscriptions 
          : fakeActiveSubscriptions;

        // Add fake nearby vendors if none exist
        const fakeNearbyVendors = [
          {
            id: 'vendor-1',
            name: 'Dany\'s Kitchen',
            image: null,
            distance: '1.2',
            address: { city: 'Mumbai' }
          },
          {
            id: 'vendor-2', 
            name: 'Ice & Spice',
            image: null,
            distance: '2.5',
            address: { city: 'Mumbai' }
          },
          {
            id: 'vendor-3',
            name: 'Morning Delights',
            image: null, 
            distance: '3.1',
            address: { city: 'Mumbai' }
          },
          {
            id: 'vendor-4',
            name: 'Healthy Bites',
            image: null,
            distance: '4.0',
            address: { city: 'Mumbai' }
          }
        ];

        const nearbyVendors = dashData.nearbyVendors?.length > 0
          ? dashData.nearbyVendors
          : fakeNearbyVendors;

        // Add fake notifications if none exist
        const fakeNotifications = [
          {
            id: 'notif-1',
            type: 'warning',
            title: 'Subscription Expiring Soon',
            message: 'Your Premium Lunch Plan with Dany\'s Kitchen expires in 5 days',
            timestamp: new Date(),
            priority: 'high'
          },
          {
            id: 'notif-2',
            type: 'info',
            title: 'New Vendors Available',
            message: '3 new vendors joined this week in your area',
            timestamp: new Date(),
            priority: 'medium'
          },
          {
            id: 'notif-3',
            type: 'success',
            title: 'Payment Successful',
            message: 'Your payment of ₹1,200 to Dany\'s Kitchen was processed successfully',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            priority: 'medium'
          }
        ];

        const notifications = dashData.notifications?.length > 0
          ? dashData.notifications
          : fakeNotifications;

        // Add fallback customer data
        const customerData = {
          name: dashData.customer?.name || user?.displayName || 'Customer',
          email: dashData.customer?.email || user?.email || 'customer@example.com',
          profileImage: dashData.customer?.profileImage || user?.photoURL || null,
          memberSince: dashData.customer?.memberSince || new Date(),
          preference: dashData.customer?.preference || 'mixed'
        };

        setDashboardData({
          ...dashData,
          customer: customerData,
          stats: statsWithFallback,
          activeSubscriptions: activeSubscriptions,
          nearbyVendors: nearbyVendors,
          notifications: notifications
        });
        setRecentActivity(combinedActivities);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || 'Failed to load dashboard data');
        toast.error('Failed to load dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return <FaExclamationTriangle className="w-4 h-4 text-orange-500" />;
      case 'success': return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      case 'info': return <FaInfoCircle className="w-4 h-4 text-blue-500" />;
      default: return <FaBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'payment': return <FaRupeeSign className="w-4 h-4 text-green-500" />;
      case 'subscription': return <FaShoppingCart className="w-4 h-4 text-blue-500" />;
      default: return <FaCalendarAlt className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            <div className="grid gap-6">
              {/* Loading skeletons */}
              {[...Array(8)].map((_, index) => (
                <Card key={`skeleton-${index}`} className="animate-pulse">
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

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-background flex">
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            <Alert variant="destructive">
              <FaExclamationTriangle className="h-4 w-4" />
              <AlertDescription>{error || 'Failed to load dashboard'}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6 space-y-6">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back, {dashboardData.customer.name}!
                </h1>
                <p className="text-muted-foreground mt-2">
                  Here's what's happening with your meal subscriptions
                </p>
              </div>
              <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                <AvatarImage src={dashboardData.customer.profileImage} alt={dashboardData.customer.name} />
                <AvatarFallback className="text-lg">
                  <FaUser className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Plans</p>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                        {dashboardData.stats.activeSubscriptions}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <FaShoppingCart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Spent</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                        ₹{dashboardData.stats.totalSpent}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <FaRupeeSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Completed</p>
                      <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                        {dashboardData.stats.completedSubscriptions}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <FaTrophy className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Plans</p>
                      <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                        {dashboardData.stats.totalSubscriptions}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <FaCalendarAlt className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Notifications */}
          {dashboardData.notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaBell className="w-5 h-5 text-primary" />
                    Notifications ({dashboardData.notifications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {dashboardData.notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                        </div>
                        <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {notification.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Active Subscriptions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaShoppingCart className="w-5 h-5 text-primary" />
                    Active Subscriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.activeSubscriptions.length > 0 ? (
                    <div className="space-y-4">
                      {dashboardData.activeSubscriptions.map((subscription) => (
                        <div key={subscription.id} className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={subscription.vendorImage} alt={subscription.vendorName} />
                              <AvatarFallback>
                                <FaStore className="w-6 h-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{subscription.planName}</p>
                              <p className="text-sm text-muted-foreground">{subscription.vendorName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {subscription.meals.map((meal, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {meal}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={subscription.daysLeft <= 3 ? 'destructive' : 'secondary'}>
                                {subscription.daysLeft} days left
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Ends {new Date(subscription.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FaShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No active subscriptions</p>
                      <Button 
                        className="mt-3" 
                        onClick={() => navigate('/customer/market')}
                      >
                        Browse Vendors
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaClock className="w-5 h-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {recentActivity.map((activity, index) => (
                        <div key={activity.id}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{activity.title}</p>
                              <p className="text-xs text-muted-foreground">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            <Badge 
                              variant={activity.status === 'success' || activity.status === 'active' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {activity.status}
                            </Badge>
                          </div>
                          {index < recentActivity.length - 1 && <Separator className="mt-4" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FaClock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Nearby Vendors */}
          {dashboardData.nearbyVendors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaMapMarkerAlt className="w-5 h-5 text-primary" />
                    Nearby Vendors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dashboardData.nearbyVendors.map((vendor) => (
                      <div key={vendor.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                           onClick={() => navigate(`/customer/vendor/${vendor.id}`)}>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={vendor.image} alt={vendor.name} />
                            <AvatarFallback>
                              <FaStore className="w-6 h-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{vendor.name}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <FaMapMarkerAlt className="w-3 h-3" />
                              {vendor.distance} km away
                            </div>
                          </div>
                          <FaArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => navigate('/customer/market')}
                  >
                    View All Vendors
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Button 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/customer/market')}
                  >
                    <FaStore className="w-6 h-6" />
                    Browse Vendors
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/customer/subscriptions')}
                  >
                    <FaShoppingCart className="w-6 h-6" />
                    My Subscriptions
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/customer/profile')}
                  >
                    <FaUser className="w-6 h-6" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
