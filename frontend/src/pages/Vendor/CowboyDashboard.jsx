import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaStore, FaUsers, FaUtensils, FaStar, FaBars, FaPlus, FaEye, FaChartLine, FaSignOutAlt, FaTruck } from 'react-icons/fa';
import CustomSidebar from '../../components/ui/CustomSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import toast from 'react-hot-toast';

const VendorDashboard = () => {
  const { user, userType, loading, logout } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const backendError = false; // Simplified context doesn't have this

  console.log('🏪 VendorDashboard - User data:', {
    userType,
    user: user ? {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL
    } : null
  });

  useEffect(() => {
    // Redirect if user is not vendor type
    if (user && userType !== 'vendor') {
      console.log('🚫 VendorDashboard - Wrong user type, redirecting to customer dashboard');
      toast.error('Access denied: This is for vendors only!');
      navigate('/user2/dashboard', { replace: true });
      return;
    }
  }, [user, userType, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">
            Loading your vendor dashboard...
          </p>
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
            <Link to="/auth" className="font-inter font-semibold">
              Sign In as Vendor
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleAddSubscriber = async () => {
    try {
      console.log('🎮 VendorDashboard - Adding subscriber');
      // TODO: Implement add subscriber functionality
      toast.success('New subscriber added! 👥');
    } catch (error) {
      console.error('💥 VendorDashboard - Error adding subscriber:', error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 VendorDashboard - Logging out vendor');
      await logout('Thank you for using NourishNet! 🍽️ See you soon!');
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('💥 VendorDashboard - Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <CustomSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'} p-6`}>
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
                <FaStore className="w-10 h-10 text-primary" />
                Welcome, {user.displayName}!
              </h1>
              <div className="mt-2 flex items-center gap-2">
                {backendError ? (
                  <Alert className="max-w-md">
                    <AlertDescription>
                      Vendor data unavailable - backend offline
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Badge variant="secondary" className="font-inter">
                      Tier: {user.vendorTier || 'Starter'}
                    </Badge>
                    <Badge variant="outline" className="font-inter text-primary">
                      🏪 Vendor Dashboard
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground font-inter"
              >
                <FaSignOutAlt className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <FaBars className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground font-inter text-sm font-medium">Active Subscribers</p>
                  <p className="text-3xl font-bold text-foreground font-montserrat">
                    {backendError ? '?' : user.activeSubscribers || 0}
                  </p>
                </div>
                <FaUsers className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground font-inter text-sm font-medium">Menu Items</p>
                  <p className="text-3xl font-bold text-foreground font-montserrat">
                    {backendError ? '?' : user.menuItems?.length || 0}
                  </p>
                </div>
                <FaUtensils className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground font-inter text-sm font-medium">Delivery Areas</p>
                  <p className="text-3xl font-bold text-foreground font-montserrat">
                    {backendError ? '?' : user.deliveryAreas?.length || 0}
                  </p>
                </div>
                <FaTruck className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground font-inter text-sm font-medium">Tier</p>
                  <p className="text-xl font-bold text-foreground font-montserrat">
                    {backendError ? 'Unknown' : user.vendorTier || 'Starter'}
                  </p>
                </div>
                <FaStar className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-2">
                <FaUsers className="w-6 h-6 text-primary" />
                Subscriber Management
              </CardTitle>
              <CardDescription className="text-muted-foreground font-inter">
                Manage your tiffin service subscribers and grow your customer base.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleAddSubscriber}
                disabled={backendError}
                className="w-full font-inter font-semibold"
                variant={backendError ? "secondary" : "default"}
              >
                <FaPlus className="w-4 h-4 mr-2" />
                {backendError ? 'Unavailable' : 'Add Subscriber (+1)'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-2">
                <FaUtensils className="w-6 h-6 text-primary" />
                Menu Manager
              </CardTitle>
              <CardDescription className="text-muted-foreground font-inter">
                Update your daily menu and manage your food offerings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full font-inter font-semibold">
                <FaEye className="w-4 h-4 mr-2" />
                View Menu
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-2">
                <FaChartLine className="w-6 h-6 text-primary" />
                Analytics
              </CardTitle>
              <CardDescription className="text-muted-foreground font-inter">
                View sales analytics and delivery performance metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full font-inter font-semibold">
                <FaChartLine className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Collections */}
        {!backendError && (
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Menu Items */}
            <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-2">
                  <FaUtensils className="w-6 h-6 text-primary" />
                  Your Menu Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.menuItems?.length > 0 ? (
                    user.menuItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="font-inter text-foreground">{item}</span>
                        <FaUtensils className="w-6 h-6 text-primary" />
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground font-inter italic">No menu items yet. Add some delicious offerings!</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Areas */}
            <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-2">
                  <FaTruck className="w-6 h-6 text-primary" />
                  Your Delivery Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.deliveryAreas?.length > 0 ? (
                    user.deliveryAreas.map((area, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="font-inter text-foreground">{area}</span>
                        <FaTruck className="w-6 h-6 text-primary" />
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground font-inter italic">No delivery areas yet. Expand your service coverage!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;