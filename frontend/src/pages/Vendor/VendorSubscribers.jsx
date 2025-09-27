import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaUsers, FaArrowLeft, FaCalendar, FaRupeeSign, FaUser } from 'react-icons/fa';
import VendorSidebar from '../../components/Vendor/VendorSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';

const VendorSubscribers = () => {
  const { user, vendorProfile } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && auth.currentUser) {
      fetchSubscribers();
      fetchStats();
    }
  }, [user]);

  const fetchSubscribers = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendor/subscribers`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscribers(data);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendor/subscription-stats`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

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
          >
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vendor/dashboard')}
                className="flex items-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
            
            <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
              <FaUsers className="w-10 h-10 text-primary" />
              Subscribers
            </h1>
            <p className="text-muted-foreground font-inter mt-2">
              Manage your subscriber base and view subscription details
            </p>
          </motion.div>

          {/* Stats Cards */}
          {stats && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Total Subscribers</p>
                      <p className="text-3xl font-bold text-foreground">{stats.totalSubscribers}</p>
                    </div>
                    <FaUsers className="w-10 h-10 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold text-foreground">₹{stats.totalRevenue}</p>
                    </div>
                    <FaRupeeSign className="w-10 h-10 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Recent Payments</p>
                      <p className="text-3xl font-bold text-foreground">{stats.recentPayments.length}</p>
                    </div>
                    <FaCalendar className="w-10 h-10 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Subscribers Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {subscribers.map((subscription) => {
              const daysRemaining = getDaysRemaining(subscription.end_date);
              return (
                <Card key={subscription._id} className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={subscription.consumer_id.profileImage} alt={subscription.consumer_id.name} />
                        <AvatarFallback>
                          <FaUser className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{subscription.consumer_id.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{subscription.consumer_id.email}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Plan:</span>
                        <Badge variant="secondary">{subscription.plan_id.name}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Price:</span>
                        <span className="font-bold">₹{subscription.plan_id.price}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Started:</span>
                        <span className="text-sm">{formatDate(subscription.start_date)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Ends:</span>
                        <span className="text-sm">{formatDate(subscription.end_date)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={daysRemaining > 0 ? "default" : "destructive"}>
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                        </Badge>
                      </div>

                      {subscription.plan_id.selected_meals && (
                        <div className="pt-2 border-t">
                          <span className="text-sm font-medium">Meals:</span>
                          <div className="flex gap-1 mt-1">
                            {subscription.plan_id.selected_meals.map((meal) => (
                              <Badge key={meal} variant="outline" className="text-xs">
                                {meal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          {subscribers.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FaUsers className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No subscribers yet</h3>
              <p className="text-muted-foreground mb-4">
                Create attractive plans to start getting subscribers
              </p>
              <Button onClick={() => navigate('/vendor/plans')}>
                Manage Plans
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorSubscribers;