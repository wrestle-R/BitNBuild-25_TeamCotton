import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { 
  FaBars, FaPlus, FaEye, FaHeart, FaStar, FaSignOutAlt, FaShoppingBasket, 
  FaHistory, FaMapMarkerAlt, FaBell, FaClock, FaWallet, FaUtensils, 
  FaTruck, FaChartLine, FaGift, FaMapPin, FaCalendarAlt, FaThumbsUp,
  FaCreditCard, FaPercentage, FaArrowUp, FaArrowDown, FaChevronRight,
  FaPlay, FaPause, FaEdit, FaUser, FaPhone, FaEnvelope, FaStore, FaCheckCircle,
  FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Progress } from '../../components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Customer Sidebar */}
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Modern Header */}
        <motion.div 
          className="p-6 mb-6 bg-gradient-to-br from-background via-background/95 to-muted/20 backdrop-blur-xl border-b border-border/40"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">

              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-foreground font-montserrat tracking-tight">
                  Welcome back, {user?.displayName || user?.name || 'Customer'}! 👋
                </h1>
                <p className="text-muted-foreground font-inter">Ready to discover your next delicious meal?</p>
                <div className="flex items-center gap-4 mt-2">

                  <Badge variant="outline" className="gap-1">
                    <FaMapPin className="w-3 h-3" />
                    Mumbai, MH
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="relative hover:bg-primary/10 hover:border-primary/30 transition-all duration-200">
                    <FaBell className="w-4 h-4" />
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs animate-pulse">
                      5
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>5 new notifications</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200">
                    <FaUser className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Profile Settings</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Enhanced Statistics Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {[
              {
                title: "Active Subscriptions",
                value: "3",
                subtitle: "2 lunch, 1 dinner plan",
                icon: FaUtensils,
                color: "text-emerald-600 dark:text-emerald-400",
                bgColor: "bg-emerald-500/10",
                trend: "+2 this month"
              },
              {
                title: "Monthly Spending",
                value: "₹2,340",
                subtitle: "↗ 12% vs last month",
                icon: FaWallet,
                color: "text-blue-600 dark:text-blue-400",
                bgColor: "bg-blue-500/10",
                trend: "Within budget"
              },
              {
                title: "Favorite Vendors",
                value: "7",
                subtitle: "Recently added 2 more",
                icon: FaHeart,
                color: "text-pink-600 dark:text-pink-400",
                bgColor: "bg-pink-500/10",
                trend: "Great variety"
              },
              {
                title: "Total Orders",
                value: "42",
                subtitle: "98.5% delivery success",
                icon: FaTruck,
                color: "text-purple-600 dark:text-purple-400",
                bgColor: "bg-purple-500/10",
                trend: "Excellent record"
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
              >
                <Card className="relative overflow-hidden bg-card/60 backdrop-blur-xl border-border/50 hover:border-primary/20 transition-all duration-300 group">
                  <div className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold text-foreground font-montserrat tracking-tight">{stat.value}</p>
                        <p className={`text-xs font-medium ${stat.color}`}>{stat.subtitle}</p>
                      </div>
                      <div className={`${stat.bgColor} p-3 rounded-xl`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-border/30">
                      <p className="text-xs text-muted-foreground">{stat.trend}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule - Moved Up */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-xl h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FaCalendarAlt className="w-5 h-5 text-primary" />
                    </div>
                    Today's Schedule
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-inter">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  {/* Completed Meal */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-xl border border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-500/10 dark:border-emerald-500/20 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <FaCheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Lunch Delivered</p>
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300">
                            Completed
                          </Badge>
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                          Rajma Rice from "Mama's Kitchen" • 12:45 PM
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" size="sm">⭐ 4.8</Badge>
                          <Badge variant="outline" size="sm">🌱 Veg</Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Upcoming Meal */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-xl border border-blue-200/50 bg-blue-50/50 dark:bg-blue-500/10 dark:border-blue-500/20 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <FaClock className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Dinner Incoming</p>
                          <Badge className="text-xs bg-blue-500 hover:bg-blue-600">7:00 PM</Badge>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Paneer Butter Masala from "Spice Garden"
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" size="sm">🔥 Spicy</Badge>
                          <Badge variant="outline" size="sm">🥛 Contains Dairy</Badge>
                        </div>
                      </div>
                    </div>
                    {/* Progress bar for time remaining */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Time remaining</span>
                        <span>~3h 15m</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </motion.div>

                  <Separator />

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex-1 font-inter"
                      onClick={() => navigate('/customer/market')}
                    >
                      <FaPlus className="mr-2 h-4 w-4" />
                      Add Meal
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FaTruck className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Track delivery</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Setup Guide */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-2">
                    <FaUtensils className="w-6 h-6 text-primary" />
                    Getting Started
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-inter">
                    Follow these simple steps to start enjoying fresh meals
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <span className="font-inter text-foreground">Browse local vendors and their menus</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <span className="font-inter text-foreground">Choose your meal subscription plan</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <span className="font-inter text-foreground">Set your delivery address and preferences</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                      <span className="font-inter text-foreground">Enjoy fresh, homemade meals delivered daily</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Account Information & Today's Schedule */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {/* Enhanced Account Overview */}
            <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FaUser className="w-5 h-5 text-primary" />
                  </div>
                  Account Overview
                </CardTitle>
                <CardDescription className="text-muted-foreground font-inter">
                  Your profile completion and account status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Completion */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Profile Completion</span>
                    <Badge variant="secondary" className="font-medium">85%</Badge>
                  </div>
                  <Progress value={85} className="h-3" />
                  <p className="text-xs text-muted-foreground">Complete your profile to unlock personalized recommendations</p>
                </div>

                <Separator />

                {/* Account Details */}
                <div className="space-y-4">
                  {[
                    { label: "Account Type", value: "Premium Customer", icon: FaStar, color: "text-amber-500" },
                    { label: "Email", value: user?.email || "customer@example.com", icon: FaEnvelope, color: "text-green-500" },
                    { label: "Status", value: "Active", icon: FaCheckCircle, color: "text-emerald-500" },
                    { label: "Member Since", value: "Aug 2025", icon: FaCalendarAlt, color: "text-blue-500" }
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="font-inter text-muted-foreground text-sm">{item.label}</span>
                      </div>
                      <span className="font-inter font-medium text-foreground text-sm">{item.value}</span>
                    </motion.div>
                  ))}
                </div>

                <Separator />

                {/* Quick Actions */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start gap-2">
                      <FaEdit className="w-3 h-3" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-2">
                      <FaMapPin className="w-3 h-3" />
                      Add Address
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Today's Schedule */}
            <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FaCalendarAlt className="w-5 h-5 text-primary" />
                  </div>
                  Today's Schedule
                </CardTitle>
                <CardDescription className="text-muted-foreground font-inter">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Completed Meal */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-xl border border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-500/10 dark:border-emerald-500/20 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <FaCheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Lunch Delivered</p>
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300">
                          Completed
                        </Badge>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        Rajma Rice from "Mama's Kitchen" • 12:45 PM
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" size="sm">⭐ 4.8</Badge>
                        <Badge variant="outline" size="sm">🌱 Veg</Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Upcoming Meal */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative overflow-hidden rounded-xl border border-blue-200/50 bg-blue-50/50 dark:bg-blue-500/10 dark:border-blue-500/20 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <FaClock className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Dinner Incoming</p>
                        <Badge className="text-xs bg-blue-500 hover:bg-blue-600">7:00 PM</Badge>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Paneer Butter Masala from "Spice Garden"
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" size="sm">🔥 Spicy</Badge>
                        <Badge variant="outline" size="sm">🥛 Contains Dairy</Badge>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar for time remaining */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Time remaining</span>
                      <span>~3h 15m</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                </motion.div>

                <Separator />

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1 font-inter"
                    onClick={() => navigate('/customer/market')}
                  >
                    <FaPlus className="mr-2 h-4 w-4" />
                    Add Meal
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FaTruck className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Track delivery</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications Section - Moved Down */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-6"
          >
            <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FaBell className="w-5 h-5 text-primary" />
                  </div>
                  Recent Notifications
                </CardTitle>
                <CardDescription className="text-muted-foreground font-inter">
                  Stay updated with your orders, deliveries, and account activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {[
                      {
                        type: "success",
                        icon: FaCheckCircle,
                        title: "Food arriving tomorrow!",
                        message: "Your lunch from \"Mama's Kitchen\" will be delivered at 12:30 PM",
                        details: "Order #NK-2025-001 • 8 hours left",
                        color: "emerald"
                      },
                      {
                        type: "info",
                        icon: FaInfoCircle,
                        title: "Upcoming delivery",
                        message: "Your dinner from \"Spice Garden\" scheduled for tomorrow 7:00 PM",
                        details: "Order #NK-2025-002 • 32 hours left",
                        color: "blue"
                      },
                      {
                        type: "warning",
                        icon: FaExclamationTriangle,
                        title: "Payment reminder",
                        message: "Your weekly subscription renewal is due in 2 days (₹480)",
                        details: "Plan: Weekly Lunch Special",
                        color: "amber"
                      },
                      {
                        type: "info",
                        icon: FaStore,
                        title: "New vendor alert",
                        message: "\"Healthy Bites\" just opened in your area with 25% off!",
                        details: "2.1 km away • Veg & Vegan options",
                        color: "purple"
                      }
                    ].map((notification, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative overflow-hidden rounded-xl border border-border/40 bg-muted/30 dark:bg-muted/20 p-4 hover:shadow-lg hover:bg-muted/50 dark:hover:bg-muted/30 transition-all duration-300"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <notification.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground font-inter">
                              {notification.details}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <FaChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-center">
                  <Button variant="outline" size="sm">
                    <FaEye className="w-4 h-4 mr-2" />
                    View All Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 backdrop-blur-xl border-primary/20 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
              <CardHeader className="relative text-center pb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4"
                >
                  <FaShoppingBasket className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                <CardTitle className="text-2xl font-bold text-foreground font-montserrat">
                  Discover Amazing Food 🍽️
                </CardTitle>
                <CardDescription className="text-muted-foreground font-inter text-base">
                  Explore local vendors and enjoy fresh, homemade meals delivered to your doorstep
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-6">
                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { icon: FaUtensils, text: "Fresh Daily Meals", color: "text-emerald-500" },
                    { icon: FaTruck, text: "Fast Delivery", color: "text-blue-500" },
                    { icon: FaHeart, text: "Favorite Vendors", color: "text-pink-500" }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
                    >
                      <feature.icon className={`w-4 h-4 ${feature.color}`} />
                      <span className="text-sm font-medium">{feature.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="flex-1 font-inter font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                    onClick={() => navigate('/customer/market')}
                  >
                    <FaShoppingBasket className="mr-2" />
                    Browse Vendors Now
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="flex-1 font-inter font-semibold border-primary/30 hover:bg-primary/5"
                    onClick={() => navigate('/customer/profile')}
                  >
                    <FaMapPin className="mr-2" />
                    Complete Profile
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/30">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">500+</p>
                    <p className="text-xs text-muted-foreground">Happy Customers</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">50+</p>
                    <p className="text-xs text-muted-foreground">Local Vendors</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">98%</p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;