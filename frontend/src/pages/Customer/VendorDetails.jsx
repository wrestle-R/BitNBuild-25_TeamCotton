import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaStore, FaShoppingCart, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaArrowLeft, FaExclamationCircle, FaCheckCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner';
import { auth } from '../../../firebase.config';

const VendorDetails = () => {
  const { user, token } = useUserContext();
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState(null);
  const [error, setError] = useState(null);
  const [mealPlans, setMealPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [menus, setMenus] = useState([]);
  const [menusLoading, setMenusLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // API call function
  const apiCall = async (endpoint, options = {}) => {
    try {
      // Get fresh token from Firebase
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const token = await user.getIdToken(true); // Force refresh
      
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

  // Function to calculate distance between two points (in km)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d;
  };

  // Helper function to safely convert MongoDB Decimal128 to number
  const safeDecimalToNumber = (value) => {
    if (!value) return 0;
    if (typeof value === 'object' && value.$numberDecimal) {
      return parseFloat(value.$numberDecimal);
    }
    return parseFloat(value) || 0;
  };

  // Get vendor details
  const getVendorDetails = (id) => apiCall(`/api/customer/vendors/${id}`);

  // Get vendor meal plans
  const getVendorPlans = (id) => apiCall(`/api/customer/vendors/${id}/plans`);

  // Get vendor menus
  const getVendorMenus = (id) => apiCall(`/api/customer/vendors/${id}/menus`);

  useEffect(() => {
    const fetchVendorDetails = async () => {
      if (!user || !token || !vendorId) {
        setLoading(false);
        setError('Please log in to view vendor details');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const vendorData = await getVendorDetails(vendorId);
        console.log('🏪 Fetched vendor data:', vendorData);
        setVendor(vendorData);

        // Always try to fetch meal plans regardless of vendor.plans count
        setPlansLoading(true);
        try {
          const plansData = await getVendorPlans(vendorId);
          console.log('📋 Fetched meal plans:', plansData);
          setMealPlans(plansData || []);
        } catch (planError) {
          console.error('Error fetching meal plans:', planError);
          setMealPlans([]);
          toast.error('Failed to load meal plans');
        } finally {
          setPlansLoading(false);
        }

        // Fetch vendor menus to show food types
        setMenusLoading(true);
        try {
          const menusData = await getVendorMenus(vendorId);
          console.log('🍽️ Fetched menus:', menusData);
          setMenus(menusData || []);
        } catch (menuError) {
          console.error('Error fetching menus:', menuError);
          setMenus([]);
        } finally {
          setMenusLoading(false);
        }
      } catch (error) {
        console.error('Error fetching vendor details:', error);
        setError(error.message || 'Failed to load vendor details');
        toast.error('Failed to load vendor details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorDetails();
  }, [user, token, vendorId]);

  // const handleGoBack = () => {
  //   navigate('/customer/market');
  // };

  const handleSubscribe = async (planId) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      
      // Create Razorpay order
      const orderResponse = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          vendor_id: vendorId
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Razorpay options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: 'INR',
        name: 'NourishNet',
        description: `Meal Plan Subscription - ${vendor?.name}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await fetch(`${API_BASE}/api/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                payment_id: orderData.payment_id
              })
            });

            if (verifyResponse.ok) {
              toast.success('🎉 Payment successful! Your subscription is now active.');
              // Redirect to subscriptions page
              navigate('/customer/subscriptions');
            } else {
              const errorData = await verifyResponse.json();
              toast.error(errorData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.contactNumber || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + response.error.description);
      });
      
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
    }
  };

  const getMealPlanIcon = (meals) => {
    const mealCount = meals.length;
    if (mealCount === 1) return '🍽️';
    if (mealCount === 2) return '🍽️🍽️';
    return '🍽️🍽️🍽️';
  };

  const formatMealTypes = (meals) => {
    return meals.map(meal => meal.charAt(0).toUpperCase() + meal.slice(1)).join(', ');
  };

  const getPlanDuration = (days) => {
    if (days === 1) return 'Daily';
    if (days === 7) return 'Weekly';
    if (days === 30) return 'Monthly';
    return `${days} days`;
  };

  // Helper function to get food types from menus
  const getFoodTypes = () => {
    if (!menus || menus.length === 0) return [];
    
    const hasVeg = menus.some(menu => !menu.non_veg);
    const hasNonVeg = menus.some(menu => menu.non_veg);
    
    const types = [];
    if (hasVeg) types.push('Vegetarian');
    if (hasNonVeg) types.push('Non-Vegetarian');
    
    return types;
  };

  // Helper function to get meal types from menus
  const getMealTypes = () => {
    if (!menus || menus.length === 0) return [];
    return [...new Set(menus.map(menu => menu.meal_type))];
  };

  // Helper function to group menus by meal type
  const getMenusByMealType = () => {
    if (!menus || menus.length === 0) return {};
    
    const grouped = {};
    menus.forEach(menu => {
      if (!grouped[menu.meal_type]) {
        grouped[menu.meal_type] = [];
      }
      grouped[menu.meal_type].push(menu);
    });
    
    return grouped;
  };

  // Function to get plan details and open modal
  const handleViewPlanDetails = (plan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  // Function to get menus for specific meal types in a plan
  const getPlanMenus = (selectedMeals) => {
    if (!menus || menus.length === 0) return [];
    return menus.filter(menu => selectedMeals.includes(menu.meal_type));
  };

  // Function to get food types for a specific plan
  const getPlanFoodTypes = (planMenus) => {
    const hasVeg = planMenus.some(menu => !menu.non_veg);
    const hasNonVeg = planMenus.some(menu => menu.non_veg);
    
    const types = [];
    if (hasVeg) types.push('Vegetarian');
    if (hasNonVeg) types.push('Non-Vegetarian');
    
    return types;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            <div className="mb-6">
              <Button 
                onClick={() => navigate('/customer/market')} 
                variant="outline"
                className="flex items-center gap-2 hover:bg-primary text-primary-foreground transition-all duration-200"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Market
              </Button>
            </div>
            
            <div className="grid gap-6">
              {/* Loading skeleton for vendor header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-muted animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2"></div>
                      <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loading skeleton for menu section */}
              <Card>
                <CardHeader>
                  <div className="h-6 w-64 bg-muted animate-pulse rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                      <div className="flex gap-2">
                        <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                        <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-36 bg-muted animate-pulse rounded"></div>
                      <div className="flex gap-2">
                        <div className="h-6 w-18 bg-muted animate-pulse rounded"></div>
                        <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                        <div className="h-6 w-18 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loading skeletons for content cards */}
              {[...Array(3)].map((_, index) => (
                <Card key={`skeleton-${index}`}>
                  <CardHeader>
                    <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                      <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
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

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-background flex">
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            <div className="mb-6">
              <Button 
                onClick={() => navigate('/customer/market')} 
                variant="outline"
                className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Market
              </Button>
            </div>
            
            <Alert variant="destructive">
              <FaExclamationCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Vendor not found'}</AlertDescription>
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
        <div className="p-6">
          {/* Back Button */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Button 
              onClick={() => navigate('/customer/market')} 
              variant="outline"
              className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
            >
              <FaArrowLeft className="w-4 h-4" />
              Back to Market
            </Button>
          </motion.div>

          {/* Vendor Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                    <AvatarImage src={vendor.profileImage} alt={vendor.name} />
                    <AvatarFallback className="text-2xl">
                      <FaStore className="w-12 h-12" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-foreground font-montserrat">
                        {vendor.name}
                      </h1>
                      {vendor.verified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 w-fit">
                          ✓ Verified Vendor
                        </Badge>
                      )}
                    </div>
                    
                    {vendor.address && vendor.address.city && (
                      <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mb-2">
                        <FaMapMarkerAlt className="w-4 h-4" />
                        <span>
                          {vendor.address.street && `${vendor.address.street}, `}
                          {vendor.address.city}
                          {vendor.address.state && `, ${vendor.address.state}`}
                        </span>
                      </div>
                    )}

                    {vendor.address && vendor.address.coordinates && user && user.address && user.address.coordinates && (
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                          📍 {calculateDistance(
                            user.address.coordinates.lat,
                            user.address.coordinates.lng,
                            vendor.address.coordinates.lat,
                            vendor.address.coordinates.lng
                          ).toFixed(1)} km away
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* <Button 
                      className="w-full md:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300" 
                      disabled={!vendor.plans || vendor.plans === 0}
                      onClick={() => {
                        if (vendor.plans > 0) {
                          document.getElementById('meal-plans-section')?.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }
                      }}
                      size="lg"
                    >
                      <FaShoppingCart className="w-4 h-4 mr-2" />
                      {vendor.plans > 0 ? `View ${vendor.plans} Meal Plans` : 'No Plans Available'}
                    </Button> */}
                    {vendor.contactNumber && (
                      <Button variant="outline" className="w-full md:w-auto border-2 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300">
                        <FaPhone className="w-4 h-4 mr-2" />
                        Call Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>



          {/* Content Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FaPhone className="w-5 h-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {vendor.email && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <FaEnvelope className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.contactNumber && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <FaPhone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{vendor.contactNumber}</span>
                    </div>
                  )}
                  {!vendor.email && !vendor.contactNumber && (
                    <p className="text-muted-foreground text-sm">No contact information available</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Address Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FaMapMarkerAlt className="w-5 h-5 text-primary" />
                    Address & Location ({vendor.address.pincode})
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {vendor.address ? (
                    <>
                      <p className="p-3 bg-muted/50 rounded-lg">
  {vendor.address.street && `${vendor.address.street}, `}
  {vendor.address.city}
  {vendor.address.state && `, ${vendor.address.state}`}
  {vendor.address.pincode && ``}
</p>

                      {vendor.address.coordinates && user && user.address && user.address.coordinates && (
                        <div className="flex items-center gap-2 text-sm bg-primary/10 text-primary p-3 rounded-lg">
                          <FaMapMarkerAlt className="w-4 h-4" />
                          <span className="font-medium">
                            Distance: {calculateDistance(
                              user.address.coordinates.lat,
                              user.address.coordinates.lng,
                              vendor.address.coordinates.lat,
                              vendor.address.coordinates.lng
                            ).toFixed(1)} km from your location
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">No address information available</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Business Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 lg:col-span-1"
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FaStore className="w-5 h-5 text-primary" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {/* <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <FaShoppingCart className="w-4 h-4 text-muted-foreground" />
                    <span><strong>{vendor.plans || 0}</strong> meal plans available</span>
                  </div> */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <FaClock className="w-4 h-4 text-muted-foreground" />
                    <span>Joined on <strong>{new Date(vendor.createdAt).toLocaleDateString()}</strong></span>
                  </div>
                  {vendor.earnings && safeDecimalToNumber(vendor.earnings) > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-muted-foreground">Total earnings:</span>
                      <span className="font-bold text-green-700">₹{safeDecimalToNumber(vendor.earnings).toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Meal Plans Section */}
          {vendor && (
            <motion.div
              id="meal-plans-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FaShoppingCart className="w-5 h-5 text-primary" />
                    Available Meal Plans ({mealPlans?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {plansLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[...Array(3)].map((_, index) => (
                        <div key={`plan-skeleton-${index}`} className="p-6 border rounded-lg">
                          <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4"></div>
                          <div className="h-4 w-full bg-muted animate-pulse rounded mb-2"></div>
                          <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-4"></div>
                          <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : mealPlans && mealPlans.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                      {mealPlans.map((plan, index) => (
                        <motion.div
                          key={plan._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="group"
                        >
                          <Card className="h-full bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg overflow-hidden">
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <CardContent className="relative p-3">
                              <div className="text-center mb-3">
                                <div className="text-2xl mb-1">
                                  {getMealPlanIcon(plan.selected_meals)}
                                </div>
                                <h3 className="text-sm font-bold text-foreground font-montserrat mb-1">
                                  {plan.name}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {getPlanDuration(plan.duration_days)} Plan
                                </Badge>
                              </div>

                              <div className="space-y-1.5 mb-3">
                                <div className="flex items-center justify-between p-1.5 bg-muted/20 rounded border border-muted/30">
                                  <span className="text-xs font-medium">Duration</span>
                                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-1.5 py-0.5">
                                    {plan.duration_days}d
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between p-1.5 bg-muted/20 rounded border border-muted/30">
                                  <span className="text-xs font-medium">Meals</span>
                                  <span className="text-xs font-semibold text-foreground">
                                    {formatMealTypes(plan.selected_meals)}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between p-1.5 bg-muted/20 rounded border border-muted/30">
                                  <span className="text-xs font-medium">Per Day</span>
                                  <span className="text-xs font-semibold text-foreground">
                                    {plan.meals_per_day} meal{plan.meals_per_day > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>

                              <div className="text-center mb-3 p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded border border-primary/20">
                                <div className="flex items-center justify-center mb-1">
                                  <span className="text-xl font-bold text-primary">
                                    ₹{plan.price}
                                  </span>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-xs text-muted-foreground">
                                    Total for {plan.duration_days}d
                                  </p>
                                  {plan.duration_days > 1 && (
                                    <div className="flex items-center justify-center">
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 px-1 py-0.5">
                                        ₹{Math.round(plan.price / plan.duration_days)}/day
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <Button 
                                  onClick={() => handleViewPlanDetails(plan)}
                                  variant="outline"
                                  className="w-full border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary transition-all duration-200 text-xs py-1.5"
                                  size="sm"
                                >
                                  <FaInfoCircle className="w-3 h-3 mr-1" />
                                  Details
                                </Button>
                                <Button 
                                  onClick={() => handleSubscribe(plan._id)}
                                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 text-xs py-1.5"
                                  size="sm"
                                >
                                  <FaShoppingCart className="w-3 h-3 mr-1" />
                                  Subscribe
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FaExclamationCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No Meal Plans Available
                      </h3>
                      <p className="text-muted-foreground">
                        This vendor hasn't added any meal plans yet. Check back later!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Plan Details Modal */}
          {showPlanModal && selectedPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-background border-b p-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                      {getMealPlanIcon(selectedPlan.selected_meals)} {selectedPlan.name}
                    </h2>
                    <p className="text-muted-foreground">Plan Details & Menu Information</p>
                  </div>
                  <Button
                    onClick={() => setShowPlanModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <FaTimes className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-6">
                  {/* Plan Overview */}
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">₹{selectedPlan.price}</div>
                        <div className="text-sm text-muted-foreground">Total Price</div>
                        {selectedPlan.duration_days > 1 && (
                          <div className="text-xs text-green-600 mt-1">
                            ₹{Math.round(selectedPlan.price / selectedPlan.duration_days)}/day
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{selectedPlan.duration_days}</div>
                        <div className="text-sm text-muted-foreground">Days</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{selectedPlan.meals_per_day}</div>
                        <div className="text-sm text-muted-foreground">Meals/Day</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Meal Types Included */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      🍽️ Included Meal Times
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlan.selected_meals.map((mealType, idx) => (
                        <Badge 
                          key={idx}
                          variant="outline" 
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {mealType === 'breakfast' && '🌅 '}
                          {mealType === 'lunch' && '☀️ '}
                          {mealType === 'dinner' && '🌙 '}
                          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Food Types Available */}
                  {(() => {
                    const planMenus = getPlanMenus(selectedPlan.selected_meals);
                    const foodTypes = getPlanFoodTypes(planMenus);
                    
                    return foodTypes.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          🥗 Food Types Available
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {foodTypes.map((foodType, idx) => (
                            <Badge 
                              key={idx}
                              variant="secondary"
                              className={`${
                                foodType === 'Vegetarian' 
                                  ? 'bg-green-100 text-green-700 border-green-200' 
                                  : 'bg-red-100 text-red-700 border-red-200'
                              }`}
                            >
                              {foodType === 'Vegetarian' ? '🥬 Vegetarian' : '🍖 Non-Vegetarian'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sample Menu Items */}
                  {(() => {
                    const planMenus = getPlanMenus(selectedPlan.selected_meals);
                    
                    return planMenus.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          📋 Sample Menu Items
                        </h3>
                        <div className="grid gap-4">
                          {selectedPlan.selected_meals.map((mealType) => {
                            const mealMenus = planMenus.filter(menu => menu.meal_type === mealType);
                            
                            return mealMenus.length > 0 && (
                              <Card key={mealType}>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <span>
                                      {mealType === 'breakfast' && '🌅'}
                                      {mealType === 'lunch' && '☀️'}
                                      {mealType === 'dinner' && '🌙'}
                                    </span>
                                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Options
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    {mealMenus.map((menu, menuIdx) => (
                                      <div key={menuIdx} className="p-3 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className={`w-3 h-3 rounded-full ${menu.non_veg ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                          <span className="font-medium text-sm">
                                            {menu.non_veg ? 'Non-Vegetarian' : 'Vegetarian'} Menu
                                          </span>
                                        </div>
                                        {menu.items && menu.items.length > 0 && (
                                          <div className="space-y-1">
                                            {menu.items.slice(0, 5).map((item, itemIdx) => (
                                              <div key={itemIdx} className="text-sm text-muted-foreground flex items-center gap-2">
                                                <span>•</span>
                                                <span>{item.name}</span>
                                                {item.description && (
                                                  <span className="text-xs text-muted-foreground/70">
                                                    ({item.description})
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                            {menu.items.length > 5 && (
                                              <div className="text-xs text-primary font-medium">
                                                + {menu.items.length - 5} more items
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => setShowPlanModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPlanModal(false);
                        handleSubscribe(selectedPlan._id);
                      }}
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <FaShoppingCart className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;