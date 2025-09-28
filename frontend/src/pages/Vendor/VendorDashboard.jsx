import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaStore, FaUsers, FaUser, FaClipboardList, FaUtensils, FaExclamationTriangle, FaStar, FaBars, FaPlus, FaEye, FaChartLine, FaSignOutAlt, FaTruck, FaRupeeSign, FaBell, FaShieldAlt } from 'react-icons/fa';
import VendorSidebar from '../../components/Vendor/VendorSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';

const VendorDashboard = () => {
  const { user, userType, loading, logout, vendorProfile } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  console.log('VendorDashboard - Render State:', {
    userType,
    loading,
    sidebarOpen,
    user: user ? {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role
    } : null
  });

  useEffect(() => {
    if (user && userType !== 'vendor') {
      toast.error('Access denied: This is for vendors only!');
      navigate('/customer/dashboard', { replace: true });
      return;
    }
  }, [user, userType, navigate]);

  useEffect(() => {
    if (user && userType === 'vendor') {
      fetchStats();
    }
  }, [user, userType]);

  // Fix the fetchStats function
  const fetchStats = async () => {
    setLoadingStats(true); // Now this will work
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendor/stats`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setDashboardData(data); // Also set dashboardData for the UI
      } else {
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoadingStats(false);
      setLoadingDashboard(false); // Also set this to false
    }
  };



  // Helper functions
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment':
        return <FaRupeeSign className="w-4 h-4 text-green-500" />;
      case 'subscription':
        return <FaUsers className="w-4 h-4 text-blue-500" />;
      case 'system':
        return <FaBell className="w-4 h-4 text-orange-500" />;
      default:
        return <FaBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || loadingDashboard) {
    return (
      <div className="min-h-screen bg-background flex">
        <VendorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground font-montserrat mb-4 flex items-center justify-center gap-2">
            Access Denied!
            <FaStore className="w-8 h-8 text-primary" />
          </h1>
          <p className="text-muted-foreground font-inter mb-6">
            You need to be signed in as a vendor to access your dashboard.
          </p>
          <Button asChild>
            <Link to="/vendor/auth" className="font-inter font-semibold">
              Sign In as Vendor
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Update the error condition
  if (error || (!dashboardData && !loadingDashboard)) {
    return (
      <div className="min-h-screen bg-background flex">
        <VendorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
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

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Thank you for using NourishNet! See you soon!');
      navigate('/vendor/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <VendorSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        profileImage={dashboardData.vendor?.profileImage}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6 space-y-6">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                  <AvatarImage src={stats?.vendor?.profileImage} alt={stats?.vendor?.name} />
                  <AvatarFallback className="text-lg">
                    <FaStore className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    Welcome back, {stats?.vendor?.name || user?.displayName || 'Vendor'}!
                    {stats?.vendor?.verified && (
                      <FaShieldAlt className="w-6 h-6 text-green-500" title="Verified Vendor" />
                    )}
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Here's how your business is performing today
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={stats?.vendor?.verified ? "default" : "secondary"}>
                  {stats?.accountStatus || 'Active'}
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Subscribers</p>
                      <p className="text-3xl font-bold text-foreground">
                        {stats?.activeSubscribers || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        of {stats?.totalSubscribers || 0} total
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <FaUsers className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                      <p className="text-3xl font-bold text-foreground">
                        ₹{stats?.earnings || 0}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <FaChartLine className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">This month</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <FaRupeeSign className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Menu Items</p>
                      <p className="text-3xl font-bold text-foreground">
                        {stats?.menuItems || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.plans || 0} plans created
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <FaUtensils className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Plans Created</p>
                      <p className="text-3xl font-bold text-foreground">
                        {stats?.plans || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Subscription options</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <FaClipboardList className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Notifications */}
          {stats?.notifications?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaBell className="w-5 h-5 text-primary" />
                    Notifications ({stats.notifications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {stats.notifications.map((notification) => (
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
            {/* Recent Payments */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-[400px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaRupeeSign className="w-5 h-5 text-primary" />
                    Recent Payments
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  {stats?.recentPayments?.length > 0 ? (
                    <div className="space-y-4 h-full overflow-y-auto">
                      {stats.recentPayments.map((payment, index) => (
                        <div key={payment._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                <FaUser className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{payment.consumer_id?.name || 'Customer'}</p>
                              <p className="text-xs text-muted-foreground">{payment.plan_id?.name || 'Plan'}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(payment.payment_date)} at {formatTime(payment.payment_date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">+₹{payment.amount}</p>
                            <Badge variant="secondary" className="text-xs">Success</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <FaRupeeSign className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No payments received yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Plans */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-[400px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaClipboardList className="w-5 h-5 text-primary" />
                    Recent Plans
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  {stats?.recentPlans?.length > 0 ? (
                    <div className="space-y-4 h-full overflow-y-auto">
                      {stats.recentPlans.map((plan) => (
                        <div key={plan._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <FaClipboardList className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{plan.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {plan.duration_days} day{plan.duration_days > 1 ? 's' : ''} • {plan.meals_per_day} meal{plan.meals_per_day > 1 ? 's' : ''}/day
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Created {formatDate(plan.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">₹{plan.price}</p>
                            <div className="flex flex-wrap gap-1 mt-1 justify-end">
                              {plan.selected_meals?.map((meal, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {meal}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <FaClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No plans created yet</p>
                      <Button 
                        className="mt-3" 
                        onClick={() => navigate('/vendor/plans')}
                      >
                        Create Your First Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                  <Button 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/vendor/profile')}
                  >
                    <FaUser className="w-6 h-6" />
                    Manage Profile
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/vendor/menus')}
                  >
                    <FaUtensils className="w-6 h-6" />
                    Menu Items
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/vendor/plans')}
                  >
                    <FaClipboardList className="w-6 h-6" />
                    Subscription Plans
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/vendor/tracking')}
                  >
                    <FaTruck className="w-6 h-6" />
                    Delivery Tracking
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/vendor/analytics')}
                  >
                    <FaChartLine className="w-6 h-6" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Business Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {/* Getting Started */}
            <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-2">
                  <FaUtensils className="w-6 h-6 text-primary" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <span className="font-inter text-foreground">Complete your profile with location</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <span className="font-inter text-foreground">Create menu items with images</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <span className="font-inter text-foreground">Set up subscription plans</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-2">
                  <FaUsers className="w-6 h-6 text-primary" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-inter text-muted-foreground">Account Type:</span>
                    <span className="font-inter font-medium text-foreground">Vendor</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-inter text-muted-foreground">Status:</span>
                    <span className="font-inter font-medium text-green-600">
                      {loadingStats ? '...' : (stats?.accountStatus ?? 'Active')}
                    </span>
                  </div>
                  {/* <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-inter text-muted-foreground">Total Earnings:</span>
                    <span className="font-inter font-medium text-foreground">
                      ₹{loadingStats ? '...' : (stats?.earnings ?? '0')}
                    </span>
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </motion.div>


        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;