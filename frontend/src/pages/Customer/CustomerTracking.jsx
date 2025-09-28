import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { useTheme } from '../../../context/ThemeContext';
import { auth } from '../../../firebase.config';
import { 
  FaTruck, 
  FaRoute, 
     FaMapMarkerAlt, 
  FaClock, 
  FaUser, 
  FaPhone,
  FaStar,
  FaCircle,
  FaExclamationTriangle,
  FaEye,
  FaSync,
  FaPlay,
  FaStop,
  FaCheckCircle,
  FaDirections,
  FaMapSigns,
  FaStore
} from 'react-icons/fa';
import { MdLocationOn, MdDeliveryDining, MdDirections } from 'react-icons/md';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import ThemeToggle from '../../components/ui/ThemeToggle';

const CustomerTracking = () => {
  const { user, userType, loading } = useUserContext();
  const { theme, isDark, isLight } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [customerLocation, setCustomerLocation] = useState({
    coordinates: {
      lat: 19.248364,
      lng: 72.850088
    }
  });
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  console.log('CustomerTracking - Render State:', {
    userType,
    loading,
    sidebarOpen,
    activeDeliveriesCount: activeDeliveries.length,
    customerLocation: customerLocation ? 'Has location' : 'No location',
    historyCount: deliveryHistory.length
  });

  useEffect(() => {
    if (user && userType !== 'customer') {
      toast.error('Access denied: This is for customers only!');
      navigate('/vendor/dashboard', { replace: true });
      return;
    }
  }, [user, userType, navigate]);

  useEffect(() => {
    if (user && userType === 'customer') {
      fetchActiveDeliveries();
      fetchDeliveryHistory();
      fetchCustomerLocation();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(() => {
        fetchActiveDeliveries();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, userType]);

  const fetchActiveDeliveries = async () => {
    setIsLoadingActive(true);
    try {
      // Use the existing delivery tracking endpoint
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/delivery/tracking/${user.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Convert the tracking data to active delivery format
          setActiveDeliveries([{
            _id: data.tracking.deliveryId,
            status: data.tracking.status || 'in_progress',
            driver: data.tracking.driver,
            vendor: data.tracking.vendor,
            estimatedArrival: data.tracking.estimatedArrival,
            deliveryOrder: data.tracking.deliveryOrder,
            totalCustomers: data.tracking.totalCustomers,
            completedDeliveries: data.tracking.deliveryOrder - 1,
            customers: Array(data.tracking.totalCustomers).fill({}),
            createdAt: new Date().toISOString()
          }]);
        } else {
          setActiveDeliveries([]);
        }
      } else {
        // No active delivery found
        setActiveDeliveries([]);
      }
    } catch (error) {
      console.error('Error fetching active deliveries:', error);
      // Don't set error for no active deliveries
      setActiveDeliveries([]);
    } finally {
      setIsLoadingActive(false);
    }
  };

  const fetchDeliveryHistory = async () => {
    setIsLoadingHistory(true);
    try {
      // For now, delivery history is not available in backend
      // Set empty array to avoid errors
      setDeliveryHistory([]);
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      setDeliveryHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchCustomerLocation = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer/profile`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const text = await response.text();
      if (response.ok) {
        const data = JSON.parse(text);
        if (data.address) {
          setCustomerLocation({
            ...data.address,
            coordinates: {
              lat: 19.248364,
              lng: 72.850088
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching customer location:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchActiveDeliveries(),
        fetchCustomerLocation()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'assigned':
        return 'secondary';
      case 'started':
        return 'default';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned':
        return <FaClock className="w-4 h-4" />;
      case 'started':
        return <FaPlay className="w-4 h-4" />;
      case 'in_progress':
        return <FaTruck className="w-4 h-4" />;
      case 'completed':
        return <FaCheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <FaStop className="w-4 h-4" />;
      default:
        return <FaCircle className="w-4 h-4" />;
    }
  };

  const getDeliveryProgress = (delivery) => {
    if (!delivery.customers || delivery.customers.length === 0) return 0;
    const completedDeliveries = delivery.completedDeliveries || 0;
    return (completedDeliveries / delivery.customers.length) * 100;
  };

  const trackDriverLocation = (delivery) => {
    if (delivery.driver?.location?.coordinates && customerLocation?.coordinates) {
      // Driver coordinates are in [lng, lat] format (GeoJSON), customer coordinates are in {lat, lng} format
      const driverLat = delivery.driver.location.coordinates[1];
      const driverLng = delivery.driver.location.coordinates[0];
      const customerLat = customerLocation.coordinates.lat;
      const customerLng = customerLocation.coordinates.lng;
      
      window.open(
        `https://www.google.com/maps/dir/${driverLat},${driverLng}/${customerLat},${customerLng}`,
        '_blank'
      );
    } else {
      toast.error('Driver or customer location not available');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-background' : 'bg-gradient-to-br from-blue-50/30 to-green-50/30'} flex`}>
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className={`h-8 w-64 rounded ${isDark ? 'bg-muted/50' : 'bg-muted'}`}></div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`h-32 rounded-lg ${isDark ? 'bg-muted/30' : 'bg-muted/50'}`}></div>
                ))}
              </div>
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
            <FaTruck className="w-8 h-8 text-primary" />
          </h1>
          <p className="text-muted-foreground font-inter mb-6">
            You need to be signed in as a customer to track deliveries.
          </p>
          <Button asChild>
            <button onClick={() => navigate('/customer/auth')} className="font-inter font-semibold">
              Sign In as Customer
            </button>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-background' : 'bg-gradient-to-br from-blue-50/20 via-white to-green-50/20'} flex`}>
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 font-montserrat">
                <FaTruck className="w-8 h-8 text-primary" />
                Track Your Deliveries
              </h1>
              <p className="text-muted-foreground mt-2 font-inter">
                Monitor your active deliveries and view delivery history
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle variant="outline" size="sm" />
              <Button 
                onClick={refreshData} 
                disabled={refreshing}
                variant="outline"
                className="gap-2"
              >
                <FaSync className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </motion.div>

          {error && (
            <Alert variant="destructive">
              <FaExclamationTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Active Deliveries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`${isDark ? 'bg-card/95 backdrop-blur-sm border-border/50' : 'bg-card/90 backdrop-blur-sm border-border'} shadow-lg`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FaCircle className="w-3 h-3 text-green-500 animate-pulse" />
                  Active Deliveries
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Track your current deliveries in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActive ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : activeDeliveries.length > 0 ? (
                  <div className="space-y-4">
                    {activeDeliveries.map((delivery) => (
                      <div key={delivery._id} className={`border rounded-lg p-4 transition-colors hover:bg-muted/10 ${isDark ? 'border-border/50 hover:border-border' : 'border-border hover:border-border/80'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <FaStore className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{delivery.vendor?.businessName || 'Vendor'}</p>
                              <p className="text-sm text-muted-foreground">
                                Driver: {delivery.driver?.name}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(delivery.status)} className="gap-1">
                            {getStatusIcon(delivery.status)}
                            {delivery.status?.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Driver Details</p>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  <FaUser className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium text-foreground">{delivery.driver?.name}</span>
                                {delivery.driver?.vehicleNumber && (
                                  <p className="text-xs text-muted-foreground">
                                    {delivery.driver.vehicleType} - {delivery.driver.vehicleNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Delivery Info</p>
                            <p className="text-sm text-foreground">
                              Started: {formatTime(delivery.createdAt)}
                            </p>
                            <p className="text-sm text-foreground">
                              {delivery.customers?.length || 0} total stops
                            </p>
                          </div>
                        </div>

                        {delivery.status === 'in_progress' && delivery.customers && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Delivery Progress</span>
                              <span className="text-sm font-medium">
                                {delivery.completedDeliveries || 0} / {delivery.customers.length}
                              </span>
                            </div>
                            <Progress 
                              value={getDeliveryProgress(delivery)} 
                              className="w-full"
                            />
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          {delivery.driver?.location && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => trackDriverLocation(delivery)}
                            >
                              <FaDirections className="w-3 h-3" />
                              Track Driver
                            </Button>
                          )}
                          
                          {delivery.driver?.phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                window.open(`tel:${delivery.driver.phone}`, '_self');
                              }}
                            >
                              <FaPhone className="w-3 h-3" />
                              Call Driver
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                              if (delivery.vendor?.address?.coordinates && customerLocation?.coordinates) {
                                // Vendor coordinates are in [lng, lat] format (GeoJSON), customer coordinates are in {lat, lng} format
                                const vendorLat = delivery.vendor.address.coordinates[1];
                                const vendorLng = delivery.vendor.address.coordinates[0];
                                const customerLat = customerLocation.coordinates.lat;
                                const customerLng = customerLocation.coordinates.lng;
                                
                                window.open(
                                  `https://www.google.com/maps/dir/${vendorLat},${vendorLng}/${customerLat},${customerLng}`,
                                  '_blank'
                                );
                              } else {
                                toast.error('Location information not available');
                              }
                            }}
                          >
                            <FaMapMarkerAlt className="w-3 h-3" />
                            View Route
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaTruck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No active deliveries</p>
                    <p className="text-sm text-muted-foreground">Your deliveries will appear here when a vendor assigns a driver</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Delivery History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`${isDark ? 'bg-card/95 backdrop-blur-sm border-border/50' : 'bg-card/90 backdrop-blur-sm border-border'} shadow-lg`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MdDeliveryDining className="w-5 h-5 text-primary" />
                  Delivery History
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  View your past deliveries and their details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : deliveryHistory.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {deliveryHistory.map((delivery) => (
                      <div key={delivery._id} className={`flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-muted/20 ${isDark ? 'border-border/50 hover:border-border' : 'border-border hover:border-border/80'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getStatusIcon(delivery.status)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{delivery.vendor?.businessName || 'Vendor'}</p>
                            <p className="text-sm text-muted-foreground">
                              Driver: {delivery.driver?.name} • {formatDate(delivery.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col gap-2">
                          <Badge variant={getStatusBadgeVariant(delivery.status)}>
                            {delivery.status?.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(delivery.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MdDeliveryDining className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Delivery history not available yet</p>
                    <p className="text-sm text-muted-foreground">This feature will be implemented in a future update</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Customer Location Status */}
          {customerLocation?.coordinates && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <FaMapMarkerAlt className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  📍 Your delivery location is set to: {customerLocation.coordinates.lat.toFixed(6)}, {customerLocation.coordinates.lng.toFixed(6)}
                  <br />
                  <span className="text-xs text-green-600 dark:text-green-300">
                    ✅ Ready for delivery tracking and route optimization
                  </span>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerTracking;
