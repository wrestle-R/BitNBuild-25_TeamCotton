import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaShoppingCart, FaArrowLeft, FaCalendar, FaRupeeSign, FaUser, FaStore, FaClock } from 'react-icons/fa';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';

const CustomerSubscriptions = () => {
  const { user } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && auth.currentUser) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payment/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      } else {
        toast.error('Failed to load subscriptions');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (daysRemaining) => {
    if (daysRemaining > 7) return 'default';
    if (daysRemaining > 0) return 'secondary';
    return 'destructive';
  };

  const safePrice = (plan) => {
    if (!plan || !plan.price) return 0;
    if (typeof plan.price === 'object' && plan.price.$numberDecimal) {
      return parseFloat(plan.price.$numberDecimal);
    }
    return typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
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
      <CustomerSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="px-6">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-6">
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/customer/dashboard')}
                className="flex items-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button> */}
            </div>
            
            <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
              {/* <FaShoppingCart className="w-10 h-10 text-primary" /> */}
              My Subscriptions
            </h1>
            <p className="text-muted-foreground font-inter mt-2">
              View and manage your active meal subscriptions
            </p>
          </motion.div>

          {/* Subscriptions Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {subscriptions.map((subscription) => {
              const daysRemaining = getDaysRemaining(subscription.end_date);
              const vendor = subscription.plan_id?.vendor_id || subscription.vendor_id;
              
              return (
                <Card key={subscription._id} className="bg-card/80 backdrop-blur-sm border-border shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={vendor?.profileImage} alt={vendor?.name} />
                        <AvatarFallback>
                          <FaStore className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{vendor?.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {subscription.plan_id?.name} Plan
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Price and Duration */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FaRupeeSign className="w-4 h-4 text-primary" />
                          <span className="font-bold text-lg">₹{safePrice(subscription.plan_id)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FaClock className="w-3 h-3" />
                          <span>{subscription.plan_id?.duration_days} days</span>
                        </div>
                      </div>

                      {/* Meals */}
                      {subscription.plan_id?.selected_meals && (
                        <div>
                          <p className="text-sm font-medium mb-2">Included Meals:</p>
                          <div className="flex flex-wrap gap-1">
                            {subscription.plan_id.selected_meals.map((meal) => (
                              <Badge key={meal} variant="secondary" className="text-xs capitalize">
                                {meal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Started:</span>
                          <span className="font-medium">{formatDate(subscription.start_date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Ends:</span>
                          <span className="font-medium">{formatDate(subscription.end_date)}</span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={getStatusColor(daysRemaining)}>
                          {daysRemaining > 0 ? (
                            <>
                              <FaCalendar className="w-3 h-3 mr-1" />
                              {daysRemaining} days left
                            </>
                          ) : (
                            'Expired'
                          )}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/customer/vendor/${vendor?._id}`)}
                        >
                          View Vendor
                        </Button>
                        {daysRemaining <= 3 && daysRemaining > 0 && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => navigate(`/customer/vendor/${vendor?._id}/plans`)}
                          >
                            Renew
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          {/* Empty State */}
          {subscriptions.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FaShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No active subscriptions</h3>
              <p className="text-muted-foreground mb-6">
                Start your meal journey by subscribing to a vendor's plan
              </p>
              <Button onClick={() => navigate('/customer/market')}>
                Browse Vendors
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSubscriptions;