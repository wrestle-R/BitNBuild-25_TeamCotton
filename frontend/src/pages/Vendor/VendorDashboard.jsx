import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaStore, FaUsers, FaUser, FaClipboardList, FaUtensils, FaStar, FaBars, FaPlus, FaEye, FaChartLine, FaSignOutAlt, FaTruck } from 'react-icons/fa';
import VendorSidebar from '../../components/Vendor/VendorSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner';

const VendorDashboard = () => {
  const { user, userType, loading, logout, vendorProfile } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
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
    console.log('VendorDashboard - useEffect triggered:', { user, userType });
    if (user && userType !== 'vendor') {
      console.log('VendorDashboard - Wrong user type, redirecting to customer dashboard');
      console.log('Current user role:', user.role, 'Expected:', 'vendor');
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

  const fetchStats = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/vendor/stats`, {
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
            <Link to="/vendor/auth" className="font-inter font-semibold">
              Sign In as Vendor
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      console.log('VendorDashboard - Logging out vendor');
      await logout();
      toast.success('Thank you for using NourishNet! See you soon!');
      navigate('/vendor/auth', { replace: true });
    } catch (error) {
      console.error('VendorDashboard - Logout error:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <VendorSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        profileImage={vendorProfile?.profileImage}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
                   
                    Welcome, {user.name}!
                  </h1>
                </div>
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
                      {loadingStats ? '...' : (stats?.activeSubscribers ?? '0')}
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
                      {loadingStats ? '...' : (stats?.menuItems ?? '0')}
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
                    <p className="text-muted-foreground font-inter text-sm font-medium">Plans Created</p>
                    <p className="text-3xl font-bold text-foreground font-montserrat">
                      {loadingStats ? '...' : (stats?.plans ?? '0')}
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
                    <p className="text-muted-foreground font-inter text-sm font-medium">Account Status</p>
                    <p className="text-xl font-bold text-foreground font-montserrat">
                      {loadingStats ? '...' : (stats?.accountStatus ?? 'Active')}
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
                  <FaUser className="w-6 h-6 text-primary" />
                  Profile Setup
                </CardTitle>
                <CardDescription className="text-muted-foreground font-inter">
                  Complete your vendor profile with location and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/vendor/profile')}
                  className="w-full font-inter font-semibold"
                >
                  <FaEye className="w-4 h-4 mr-2" />
                  Manage Profile
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
                  Create and manage your menu items with images and descriptions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/vendor/menus')}
                  className="w-full font-inter font-semibold"
                >
                  <FaUtensils className="w-4 h-4 mr-2" />
                  Manage Menus
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-2">
                  <FaClipboardList className="w-6 h-6 text-primary" />
                  Subscription Plans
                </CardTitle>
                <CardDescription className="text-muted-foreground font-inter">
                  Create daily, weekly, and monthly subscription plans.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/vendor/plans')}
                  className="w-full font-inter font-semibold"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Manage Plans
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Setup Guide */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
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
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;