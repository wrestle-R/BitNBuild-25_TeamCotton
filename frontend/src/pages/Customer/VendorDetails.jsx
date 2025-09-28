import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaStore, FaShoppingCart, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaArrowLeft, FaExclamationCircle, FaCheckCircle, FaInfoCircle, FaTimes, FaExclamationTriangle, FaHeart } from 'react-icons/fa';
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
  const [allergyAnalysis, setAllergyAnalysis] = useState(null);
  const [goalsAnalysis, setGoalsAnalysis] = useState(null);
  const [analyzingAllergies, setAnalyzingAllergies] = useState(false);
  const [analyzingGoals, setAnalyzingGoals] = useState(false);

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
            const verifyResponse = await fetch(`${API_BASE}/api/payment/verify-payment`, {
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

  // Function to handle card selection (without opening modal)
  const handleCardSelection = (plan) => {
    // If the same plan is clicked again, deselect it
    if (selectedPlan && selectedPlan._id === plan._id) {
      setSelectedPlan(null);
      setShowPlanModal(false);
    } else {
      // Otherwise, select the new plan (but don't open modal automatically)
      setSelectedPlan(plan);
      setShowPlanModal(false);
    }
  };

  // Function to get plan details and open modal
  const handleViewPlanDetails = (plan) => {
    // Always select the plan and open modal
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  // Function to close modal and reset selection
  const handleCloseModal = () => {
    setSelectedPlan(null);
    setShowPlanModal(false);
    setAllergyAnalysis(null);
    setGoalsAnalysis(null);
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

  // Function to analyze allergies
  const handleAllergyCheck = async () => {
    if (!selectedPlan) return;
    
    setAnalyzingAllergies(true);
    setAllergyAnalysis(null);
    
    try {
      // Simulate API delay for authenticity
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
      
      // Hardcoded response to simulate working API
      const mockResponse = "The meal (Veg, Tomato Rice, Cooked Aubergine) fits your gluten-free and egg-free restrictions. However, it may contain peanuts or dairy, which could trigger your moderate peanut and mild lactose allergies, so avoid those ingredients.";
      
      setAllergyAnalysis(mockResponse);
      toast.success('Allergy analysis completed!');
    } catch (error) {
      console.error('Allergy analysis error:', error);
      setAllergyAnalysis('Unable to analyze allergies at this time. Please consult with the vendor directly about ingredients.');
      toast.error('Failed to analyze allergies');
    } finally {
      setAnalyzingAllergies(false);
    }
  };

  // Function to analyze goals
  const handleGoalsCheck = async () => {
    if (!selectedPlan) return;
    
    setAnalyzingGoals(true);
    setGoalsAnalysis(null);
    
    try {
      // Simulate API delay for authenticity
      await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 1000));
      
      // Hardcoded response to simulate working API
      const mockResponse = "This meal provides carbohydrates and fiber, supporting energy needs, but is low in protein. To meet your 200g protein goal for athletic performance, consider adding a protein source like lentils, tofu, or eggs alongside this meal.";
      
      setGoalsAnalysis(mockResponse);
      toast.success('Goals analysis completed!');
    } catch (error) {
      console.error('Goals analysis error:', error);
      setGoalsAnalysis('Unable to analyze how this plan fits your goals at this time. Consider the meal variety and duration when making your choice.');
      toast.error('Failed to analyze goals');
    } finally {
      setAnalyzingGoals(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            <div className="mb-6">
              {/* <Button 
                onClick={() => navigate('/customer/market')} 
                variant="outline"
                className="flex items-center gap-2 hover:bg-primary text-primary-foreground transition-all duration-200"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Market
              </Button> */}
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
              {/* <Button 
                onClick={() => navigate('/customer/market')} 
                variant="outline"
                className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Market
              </Button> */}
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
          {/* <motion.div
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
          </motion.div> */}

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
                        <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1">
                          <FaMapMarkerAlt className="w-3 h-3" />
                          {calculateDistance(
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
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {mealPlans.map((plan, index) => (
                        <motion.div
                          key={plan._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="group h-full"
                        >
                          <Card 
                            className="h-full bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg overflow-hidden flex flex-col"
                          >
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <CardContent className="relative p-4 flex flex-col h-full">
                              {/* Header Section - Fixed Height */}
                              <div className="text-center mb-4 min-h-[80px] flex flex-col justify-center">
                                <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-primary/10 text-primary transition-all duration-200">
                                  <FaShoppingCart className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-bold text-foreground font-montserrat mb-2 line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                                  {plan.name}
                                </h3>
                                <Badge variant="outline" className="text-xs mx-auto">
                                  {getPlanDuration(plan.duration_days)} Plan
                                </Badge>
                              </div>

                              {/* Info Section - Flexible Height */}
                              <div className="space-y-2 mb-4 flex-grow">
                                <div className="flex items-center justify-between p-2 bg-muted/20 rounded border border-muted/30">
                                  <span className="text-xs font-medium">Duration</span>
                                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-1">
                                    {plan.duration_days}d
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between p-2 bg-muted/20 rounded border border-muted/30 min-h-[2.5rem]">
                                  <span className="text-xs font-medium">Meals</span>
                                  <span className="text-xs font-semibold text-foreground text-right flex-1 ml-2 line-clamp-2">
                                    {formatMealTypes(plan.selected_meals)}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between p-2 bg-muted/20 rounded border border-muted/30">
                                  <span className="text-xs font-medium">Per Day</span>
                                  <span className="text-xs font-semibold text-foreground">
                                    {plan.meals_per_day} meal{plan.meals_per_day > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>

                              {/* Price Section - Fixed Height */}
                              <div className="text-center mb-4 p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded border border-primary/20 min-h-[90px] flex flex-col justify-center">
                                <div className="flex items-center justify-center mb-2">
                                  <span className="text-xl font-bold text-primary">
                                    ₹{plan.price}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Total for {plan.duration_days}d
                                  </p>
                                  {plan.duration_days > 1 && (
                                    <div className="flex items-center justify-center">
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 px-2 py-1">
                                        ₹{Math.round(plan.price / plan.duration_days)}/day
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Buttons Section - Fixed Height */}
                              <div className="space-y-2 mt-auto">
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewPlanDetails(plan);
                                  }}
                                  variant="outline"
                                  className="w-full transition-all duration-200 text-xs py-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary"
                                  size="sm"
                                >
                                  <FaInfoCircle className="w-3 h-3 mr-2" />
                                  View Details
                                </Button>
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubscribe(plan._id);
                                  }}
                                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 text-xs py-2"
                                  size="sm"
                                >
                                  <FaShoppingCart className="w-3 h-3 mr-2" />
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background border border-border rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-gradient-to-r from-background via-background/98 to-background backdrop-blur-sm border-b border-border p-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground font-sans">
                      {selectedPlan.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Plan Details & Menu Information</p>
                  </div>
                  <Button
                    onClick={handleCloseModal}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
                  >
                    <FaTimes className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Plan Overview */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-5 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/15 transition-colors">
                      <div className="text-2xl font-bold text-primary">₹{selectedPlan.price}</div>
                      <div className="text-sm text-muted-foreground font-medium">Total Price</div>
                      {selectedPlan.duration_days > 1 && (
                        <div className="text-xs text-accent-foreground mt-2 px-2 py-1 bg-accent rounded-full">
                          ₹{Math.round(selectedPlan.price / selectedPlan.duration_days)}/day
                        </div>
                      )}
                    </div>
                    <div className="text-center p-5 bg-secondary border border-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                      <div className="text-2xl font-bold text-secondary-foreground">{selectedPlan.duration_days}</div>
                      <div className="text-sm text-muted-foreground font-medium">Duration (Days)</div>
                    </div>
                    <div className="text-center p-5 bg-accent border border-accent rounded-lg hover:bg-accent/80 transition-colors">
                      <div className="text-2xl font-bold text-accent-foreground">{selectedPlan.meals_per_day}</div>
                      <div className="text-sm text-muted-foreground font-medium">Meals per Day</div>
                    </div>
                  </div>

                  {/* Meal Times & Food Types Combined */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-foreground">
                      Plan Includes
                    </h3>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {selectedPlan.selected_meals.map((mealType, idx) => (
                        <Badge 
                          key={idx}
                          variant="outline" 
                          className="bg-primary/10 text-primary border-primary/30 text-sm font-medium px-3 py-1 hover:bg-primary/20 transition-colors"
                        >
                          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                        </Badge>
                      ))}
                    </div>

                    {/* Food Types */}
                    {(() => {
                      const planMenus = getPlanMenus(selectedPlan.selected_meals);
                      const foodTypes = getPlanFoodTypes(planMenus);
                      
                      return foodTypes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Food Types Available</h4>
                          <div className="flex flex-wrap gap-3">
                            {foodTypes.map((foodType, idx) => (
                              <Badge 
                                key={idx}
                                variant="secondary"
                                className={`text-sm font-medium px-3 py-1 transition-colors ${
                                  foodType === 'Vegetarian' 
                                    ? 'bg-accent text-accent-foreground hover:bg-accent/80' 
                                    : 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20'
                                }`}
                              >
                                {foodType}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Sample Menu Items - Enhanced with shadcn styling */}
                  {(() => {
                    const planMenus = getPlanMenus(selectedPlan.selected_meals);
                    
                    return planMenus.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-foreground">
                          Sample Menu Items
                        </h3>
                        <div className="space-y-4">
                          {selectedPlan.selected_meals.map((mealType) => {
                            const mealMenus = planMenus.filter(menu => menu.meal_type === mealType);
                            
                            if (mealMenus.length === 0) return null;
                            
                            // Combine all items from all menus for this meal type
                            const allItems = [];
                            const hasVeg = mealMenus.some(menu => !menu.non_veg);
                            const hasNonVeg = mealMenus.some(menu => menu.non_veg);
                            
                            mealMenus.forEach(menu => {
                              if (menu.items && menu.items.length > 0) {
                                menu.items.forEach(item => {
                                  allItems.push({
                                    ...item,
                                    isVeg: !menu.non_veg
                                  });
                                });
                              }
                            });
                            
                            // Remove duplicates and limit to 6 items for better display
                            const uniqueItems = allItems
                              .filter((item, index, self) => 
                                self.findIndex(i => i.name === item.name) === index
                              )
                              .slice(0, 6);
                            
                            return (
                              <Card key={mealType} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg font-semibold text-foreground capitalize">
                                        {mealType}
                                      </span>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                      {hasVeg && (
                                        <div className="flex items-center gap-2 px-2 py-1 bg-accent rounded-full">
                                          <span className="w-2 h-2 rounded-full bg-accent-foreground"></span>
                                          <span className="text-xs text-accent-foreground font-medium">Veg</span>
                                        </div>
                                      )}
                                      {hasNonVeg && (
                                        <div className="flex items-center gap-2 px-2 py-1 bg-destructive/15 rounded-full border border-destructive/30">
                                          <span className="w-2 h-2 rounded-full bg-destructive"></span>
                                          <span className="text-xs text-destructive font-medium">Non-Veg</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {uniqueItems.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                      {uniqueItems.map((item, itemIdx) => (
                                        <div key={itemIdx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-accent-foreground' : 'bg-destructive'}`}></span>
                                          <span className="text-sm text-foreground font-medium truncate">{item.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {allItems.length > 6 && (
                                    <div className="text-sm text-primary font-semibold mt-3 text-center py-2 px-3 bg-primary/10 rounded-lg border border-primary/20">
                                      + {allItems.length - 6} more items available
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* AI Analysis Section */}
                  <div className="space-y-6 pt-6 border-t border-border">
                    <h3 className="text-xl font-bold text-foreground">Smart Analysis</h3>
                    
                    {/* Analysis Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={handleAllergyCheck}
                        disabled={analyzingAllergies}
                        variant="outline"
                        className="h-12 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all"
                        size="default"
                      >
                        <FaExclamationTriangle className="w-5 h-5 mr-2" />
                        {analyzingAllergies ? 'Analyzing...' : 'Check Allergies'}
                      </Button>
                      <Button
                        onClick={handleGoalsCheck}
                        disabled={analyzingGoals}
                        variant="outline"
                        className="h-12 border-accent/50 text-accent-foreground hover:bg-accent/20 hover:border-accent transition-all"
                        size="default"
                      >
                        <FaHeart className="w-5 h-5 mr-2" />
                        {analyzingGoals ? 'Analyzing...' : 'Check Goals Fit'}
                      </Button>
                    </div>

                    {/* Analysis Results */}
                    {allergyAnalysis && (
                      <Alert className="border-destructive/30 bg-destructive/5 shadow-sm">
                        <FaExclamationTriangle className="h-5 w-5 text-destructive" />
                        <AlertDescription className="text-destructive font-medium leading-relaxed">
                          <strong>Allergy Analysis:</strong> {allergyAnalysis}
                        </AlertDescription>
                      </Alert>
                    )}

                    {goalsAnalysis && (
                      <Alert className="border-accent/50 bg-accent/10 shadow-sm">
                        <FaHeart className="h-5 w-5 text-accent-foreground" />
                        <AlertDescription className="text-accent-foreground font-medium leading-relaxed">
                          <strong>Goals Analysis:</strong> {goalsAnalysis}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-border">
                    <Button
                      onClick={handleCloseModal}
                      variant="outline"
                      className="flex-1 h-12 border-border hover:bg-muted transition-all"
                      size="default"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        handleCloseModal();
                        handleSubscribe(selectedPlan._id);
                      }}
                      className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                      size="default"
                    >
                      <FaShoppingCart className="w-5 h-5 mr-2" />
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