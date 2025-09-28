import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaStore, FaUsers, FaUser, FaClipboardList, FaUtensils, FaStar, FaBars, FaPlus, FaEye, FaChartLine, FaSignOutAlt, FaTruck, FaRoute } from 'react-icons/fa';
import VendorSidebar from '../../components/Vendor/VendorSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DeliveryMapView from '@/components/Vendor/DeliveryMapView';

const VendorDashboard = () => {
  const { user, userType, loading, logout, vendorProfile } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [subscribersWithLocations, setSubscribersWithLocations] = useState([]);
  const [vendorLocationData, setVendorLocationData] = useState(null); // Add this state
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false); // Add this state
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  console.log('VendorDashboard - Render State:', {
    userType,
    loading,
    sidebarOpen,
    subscribersCount: subscribersWithLocations.length,
    vendorLocation: vendorLocationData ? 'Has location' : 'No location',
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
      fetchAvailableDrivers();
      fetchSubscribersWithLocations();
      
      // Poll for location updates every 15 seconds
      const interval = setInterval(() => {
        fetchAvailableDrivers();
        fetchSubscribersWithLocations();
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [user, userType]);

  const fetchStats = async () => {
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
      } else {
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAvailableDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      console.log('Fetching drivers with token:', idToken ? 'Token exists' : 'No token');
      
      // Fix: Use VITE_BACKEND_URL instead of VITE_API_URL
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/available`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Drivers API response:', data);
      
      if (data.success) {
        setAvailableDrivers(data.drivers);
        console.log('Set available drivers:', data.drivers.length);
      } else {
        console.error('API returned error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  // Fetch subscribers with locations - Updated function
  const fetchSubscribersWithLocations = async () => {
    if (!user?.id) {
      console.log('No user ID available');
      return;
    }

    setIsLoadingSubscribers(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      console.log('Fetching subscribers for vendor ID:', user.id);
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/vendor/${user.id}/subscribers`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Subscribers API response:', data);
      
      if (data.success) {
        setSubscribersWithLocations(data.subscribers || []);
        setVendorLocationData(data.vendorLocation); // Set vendor location from API
        console.log('Set subscribers:', data.subscribers?.length || 0);
        console.log('Set vendor location:', data.vendorLocation ? 'Yes' : 'No');
      } else {
        console.error('API returned error:', data.message);
        toast.error(data.message || 'Failed to fetch subscribers');
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to fetch subscribers with locations');
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  // Update useEffect to fetch subscribers
  useEffect(() => {
    if (user && user.id) {
      fetchAvailableDrivers();
      fetchSubscribersWithLocations();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(() => {
        fetchAvailableDrivers();
        fetchSubscribersWithLocations();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const createDeliveryAssignment = async () => {
    if (!selectedDriver) {
      toast.error('Please select a driver first');
      return;
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/delivery/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId: user.id,
          driverId: selectedDriver._id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Delivery assignment created successfully!');
        setActiveDelivery(data.delivery);
        fetchAvailableDrivers(); // Refresh driver list
      } else {
        toast.error(data.message || 'Failed to create delivery assignment');
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast.error('Failed to create delivery assignment');
    }
  };

  const assignDriverForDelivery = async () => {
    if (!selectedDriver) {
      toast.error('Please select a driver first');
      return;
    }

    if (subscribersWithLocations.length === 0) {
      toast.error('No subscribers with locations found');
      return;
    }

    if (!vendorLocationData) {
      toast.error('Vendor location is required for delivery assignment');
      return;
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/delivery/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId: user.id,
          driverId: selectedDriver._id,
          customers: subscribersWithLocations.map(sub => ({
            customerId: sub.id,
            address: sub.address,
            location: {
              type: 'Point',
              coordinates: sub.coordinates
            }
          }))
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Delivery assignment created! Driver ${selectedDriver.name} has been notified.`);
        setActiveDelivery(data.delivery);
        fetchAvailableDrivers(); // Refresh driver list
      } else {
        toast.error(data.message || 'Failed to create delivery assignment');
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast.error('Failed to create delivery assignment');
    }
  };

  if (loading) {
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

  if (error || !dashboardData) {
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
                  <AvatarImage src={dashboardData.vendor?.profileImage} alt={dashboardData.vendor?.name} />
                  <AvatarFallback className="text-lg">
                    <FaStore className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    Welcome back, {dashboardData.vendor?.name || 'Vendor'}!
                    {dashboardData.vendor?.verified && (
                      <FaShieldAlt className="w-6 h-6 text-green-500" title="Verified Vendor" />
                    )}
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Here's how your business is performing today
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={dashboardData.vendor?.verified ? "default" : "secondary"}>
                  {dashboardData.stats?.accountStatus}
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
                        {dashboardData.stats?.activeSubscribers || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        of {dashboardData.stats?.totalSubscribers || 0} total
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
                        ₹{dashboardData.stats?.totalEarnings || 0}
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
                        {dashboardData.stats?.menuItems || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dashboardData.stats?.plans || 0} plans created
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
                        {dashboardData.stats?.plans || 0}
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
          {dashboardData.notifications?.length > 0 && (
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
                  {dashboardData.recentPayments?.length > 0 ? (
                    <div className="space-y-4 h-full overflow-y-auto">
                      {dashboardData.recentPayments.map((payment, index) => (
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
                  {dashboardData.recentPlans?.length > 0 ? (
                    <div className="space-y-4 h-full overflow-y-auto">
                      {dashboardData.recentPlans.map((plan) => (
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
                <div className="grid gap-4 md:grid-cols-4">
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
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-inter text-muted-foreground">Total Earnings:</span>
                    <span className="font-inter font-medium text-foreground">
                      ₹{loadingStats ? '...' : (stats?.earnings ?? '0')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Delivery Management - Add margin-top */}
          <Card className="mb-6 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaTruck className="w-5 h-5" />
                Delivery Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Debug Info */}
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                  <p><strong>Debug Info:</strong></p>
                  <p>Vendor Location: {vendorLocationData ? '✅ Available' : '❌ Missing'}</p>
                  <p>Subscribers: {subscribersWithLocations.length} found</p>
                  <p>Selected Driver: {selectedDriver ? selectedDriver.name : 'None'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Select Driver for Delivery</label>
                  <Select 
                    value={selectedDriver?._id || ""} 
                    onValueChange={(value) => {
                      const driver = availableDrivers.find(d => d._id === value);
                      console.log('Selected driver:', driver);
                      setSelectedDriver(driver);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingDrivers 
                          ? "Loading drivers..." 
                          : availableDrivers.length === 0 
                            ? "No drivers available" 
                            : `Select from ${availableDrivers.length} drivers`
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDrivers.map((driver) => (
                        <SelectItem key={driver._id} value={driver._id}>
                          {driver.name} - {driver.vehicleType} ({driver.vehicleNumber}) - {driver.rating} stars
                          {!driver.verified && ' (Unverified)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableDrivers.length === 0 && !isLoadingDrivers && (
                    <p className="text-sm text-muted-foreground mt-2">
                      No drivers are currently available. Make sure drivers have set their locations and are marked as available.
                    </p>
                  )}
                </div>
                
                {selectedDriver && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium flex items-center gap-2">
                      <FaUser className="w-4 h-4" />
                      Selected Driver Details:
                    </h4>
                    <p>Name: {selectedDriver.name}</p>
                    <p>Vehicle: {selectedDriver.vehicleType} - {selectedDriver.vehicleNumber}</p>
                    <p>Rating: {selectedDriver.rating} stars</p>
                    <p>Status: {selectedDriver.available ? 'Available' : 'Busy'}</p>
                  </div>
                )}

                {selectedDriver && subscribersWithLocations.length > 0 && vendorLocationData && (
                  <div className="mt-4 space-y-2">
                    <Button 
                      onClick={assignDriverForDelivery}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <FaTruck className="w-4 h-4 mr-2" />
                      Create Delivery Route ({subscribersWithLocations.length} customers)
                    </Button>
                    
                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      <p><strong>Next Steps:</strong></p>
                      <p>1. Driver will receive delivery assignment notification</p>
                      <p>2. Driver must be within 500m of your location to start</p>
                      <p>3. TSP optimized route will guide efficient delivery</p>
                    </div>
                  </div>
                )}

                {/* Show loading state */}
                {isLoadingSubscribers && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading subscribers...</p>
                  </div>
                )}

                {/* Show missing data warnings */}
                {!vendorLocationData && !isLoadingSubscribers && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>Warning:</strong> Vendor location is missing. Please update your profile with a complete address to enable delivery routing.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/vendor/profile')}>
                      Update Profile
                    </Button>
                  </div>
                )}

                {subscribersWithLocations.length === 0 && !isLoadingSubscribers && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>Info:</strong> No subscribers with valid locations found. Customers need to update their addresses with coordinates.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Route Map */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaRoute className="w-5 h-5" />
                Delivery Route Map
              </CardTitle>
              <CardDescription>
                TSP optimized route visualization for efficient delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryMapView 
                selectedDriver={selectedDriver}
                subscribers={subscribersWithLocations}
                vendorLocation={vendorLocationData} // Use the fetched vendor location
                activeDelivery={activeDelivery}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;