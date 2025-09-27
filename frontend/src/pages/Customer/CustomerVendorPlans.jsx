import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaStore, FaArrowLeft, FaShoppingCart, FaRupeeSign, FaClock, FaUtensils, FaCalendarDay } from 'react-icons/fa';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';

const CustomerVendorPlans = () => {
  const { user } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vendor, setVendor] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { vendorId } = useParams();

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    if (user && auth.currentUser) {
      fetchVendorAndPlans();
    }
  }, [user, vendorId]);

  const fetchVendorAndPlans = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      
      // Fetch vendor details
      const vendorResponse = await fetch(`${API_BASE}/api/customer/vendor/${vendorId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        setVendor(vendorData);
      }

      // Fetch vendor plans
      const plansResponse = await fetch(`${API_BASE}/api/customer/vendor/${vendorId}/plans`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData);
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast.error('Failed to load vendor plans');
    } finally {
      setLoading(false);
    }
  };

  const safePrice = (plan) => {
    if (!plan || !plan.price) return 0;
    if (typeof plan.price === 'object' && plan.price.$numberDecimal) {
      return parseFloat(plan.price.$numberDecimal);
    }
    return typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
  };

  const handleSubscribeNow = async (plan) => {
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
          plan_id: plan._id,
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
        description: `${plan.name} Plan Subscription - ${vendor?.name}`,
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

  const getDurationText = (days, planName) => {
    switch (planName) {
      case 'One day': return '1 Day';
      case 'All week': return '1 Week';
      case 'All month': return '1 Month';
      default: return `${days} Days`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
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
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/customer/market')}
                className="flex items-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Market
              </Button>
            </div>
            
            {vendor && (
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                  <AvatarImage src={vendor.profileImage} alt={vendor.name} />
                  <AvatarFallback>
                    <FaStore className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-4xl font-bold text-foreground font-montserrat">
                    {vendor.name}
                  </h1>
                  <p className="text-muted-foreground font-inter mt-1">
                    Choose a meal plan that suits your needs
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Plans Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {plans.map((plan, index) => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                  <CardHeader className="text-center pb-4">
                    <div className="flex items-center justify-center mb-3">
                      <FaCalendarDay className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                      {plan.name}
                    </CardTitle>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <FaClock className="w-3 h-3" />
                        {getDurationText(plan.duration_days, plan.name)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center">
                        <FaRupeeSign className="w-6 h-6 text-primary mr-1" />
                        <span className="text-4xl font-bold text-primary">
                          {safePrice(plan)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        ₹{(safePrice(plan) / plan.duration_days).toFixed(2)} per day
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <FaClock className="w-4 h-4 text-primary" />
                        <span>{plan.duration_days} days duration</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <FaUtensils className="w-4 h-4 text-primary" />
                        <span>{plan.meals_per_day} meal{plan.meals_per_day > 1 ? 's' : ''} per day</span>
                      </div>

                      {plan.selected_meals && plan.selected_meals.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">Included meals:</p>
                          <div className="flex flex-wrap gap-1">
                            {plan.selected_meals.map((meal) => (
                              <Badge key={meal} variant="secondary" className="text-xs capitalize">
                                {meal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Subscribe Button */}
                    <Button 
                      className="w-full mt-auto"
                      size="lg"
                      onClick={() => handleSubscribeNow(plan)}
                    >
                      <FaShoppingCart className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* No Plans Available */}
          {plans.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FaShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No plans available</h3>
              <p className="text-muted-foreground mb-6">
                This vendor hasn't created any meal plans yet.
              </p>
              <Button onClick={() => navigate('/customer/market')}>
                Browse Other Vendors
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerVendorPlans;