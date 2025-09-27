import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaBars, FaPlus, FaEye, FaHeart, FaStar, FaSignOutAlt, FaShoppingBasket, FaHistory, FaMapMarkerAlt } from 'react-icons/fa';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

const CustomerDashboard = () => {
  const { user, userType, loading, logout } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const backendError = false; // Simplified context doesn't have this

  console.log('🍽️ CustomerDashboard - Render State:', {
    userType,
    loading,
    backendError,
    sidebarOpen,
    user: user ? {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL,
      role: user.role
    } : null
  });

  useEffect(() => {
    console.log('🍽️ CustomerDashboard - useEffect triggered:', { user, userType });
    // Redirect if user is not customer type
    if (user && userType !== 'customer') {
      console.log('🚫 CustomerDashboard - Wrong user type, redirecting to vendor dashboard');
      console.log('Current user role:', user.role, 'Expected:', 'customer');
      toast.error('Access denied: This is for customers only!');
      navigate('/vendor/dashboard', { replace: true });
      return;
    }
  }, [user, userType, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">
            Loading your customer dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access your dashboard.</p>
          <Link to="/customer/auth" className="text-primary hover:underline">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    {
      icon: <FaShoppingBasket />,
      title: 'Browse Tiffins',
      description: 'Discover delicious tiffin services',
      href: '/browse',
      action: () => {
        console.log('🎮 CustomerDashboard - Browsing tiffins');
        toast.success('Finding the best tiffin services for you!');
      }
    },
    {
      icon: <FaHeart />,
      title: 'My Favorites',
      description: 'Your saved tiffin vendors',
      href: '/favorites',
      action: () => {
        console.log('🎮 CustomerDashboard - Viewing favorites');
        toast.info('Your favorite vendors coming soon!');
      }
    },
    {
      icon: <FaHistory />,
      title: 'Order History',
      description: 'Track your past orders',
      href: '/orders',
      action: () => {
        console.log('🎮 CustomerDashboard - Viewing order history');
        toast.info('Order history feature coming soon!');
      }
    },
    {
      icon: <FaMapMarkerAlt />,
      title: 'Delivery Areas',
      description: 'Manage delivery locations',
      href: '/locations',
      action: () => {
        console.log('🎮 CustomerDashboard - Managing delivery areas');
        toast.info('Location management coming soon!');
      }
    }
  ];

  const handleLogout = async () => {
    try {
      console.log('🚪 CustomerDashboard - Logging out customer');
      await logout();
      toast.success('Logged out successfully!');
      navigate('/customer/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Customer Sidebar */}
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Header */}
        {/* <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <FaBars className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Customer Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Welcome back, {user?.displayName || 'Customer'}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.displayName || 'Anonymous Customer'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-border"
                />
              )}
            </div>
          </div>
        </header> */}

        {/* Header */}
        <motion.div 
          className="mb-8 p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                <FaBars className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
                  <FaShoppingBasket className="w-10 h-10 text-primary" />
                  Welcome, {user.displayName}!
                </h1>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="font-inter">
                    Account Type: Customer
                  </Badge>
                  <Badge variant="outline" className="font-inter text-primary">
                    🍽️ Customer Portal
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Message */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-8"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                🍽️ Welcome to NourishNet!
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover delicious, home-cooked tiffin services in your area. 
                Fresh meals delivered daily by trusted local vendors.
              </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Subscriptions
                    </CardTitle>
                    <FaShoppingBasket className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Ready to subscribe
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Favorite Vendors
                    </CardTitle>
                    <FaHeart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Start exploring
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Orders
                    </CardTitle>
                    <FaHistory className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Place your first order
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Account Status
                    </CardTitle>
                    <FaStar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">New</div>
                    <p className="text-xs text-muted-foreground">
                      Welcome aboard!
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Getting Started Guide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Getting Started with NourishNet</CardTitle>
                  <CardDescription>
                    Follow these simple steps to start enjoying delicious tiffin services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold">Browse Vendors</h4>
                          <p className="text-sm text-muted-foreground">
                            Explore local tiffin services and their menus
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold">Choose Your Plan</h4>
                          <p className="text-sm text-muted-foreground">
                            Select daily, weekly, or monthly meal subscriptions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          3
                        </div>
                        <div>
                          <h4 className="font-semibold">Set Delivery Location</h4>
                          <p className="text-sm text-muted-foreground">
                            Add your home or office address for delivery
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          4
                        </div>
                        <div>
                          <h4 className="font-semibold">Enjoy Fresh Meals</h4>
                          <p className="text-sm text-muted-foreground">
                            Receive hot, homemade food delivered to your door
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          5
                        </div>
                        <div>
                          <h4 className="font-semibold">Rate & Review</h4>
                          <p className="text-sm text-muted-foreground">
                            Share feedback to help other customers
                          </p>
                        </div>
                      </div>
                      <div className="mt-6">
                        <Button size="lg" className="w-full">
                          <FaPlus className="mr-2" />
                          Start Browsing Vendors
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Account Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>👤 Account Information</CardTitle>
                  <CardDescription>
                    Your NourishNet customer profile details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                      <p className="text-foreground">{user?.displayName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <p className="text-foreground">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      <p className="text-foreground">{user?.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Account Type</label>
                      <Badge variant="secondary">Customer</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;