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
import LiveTrackingMap from '../../components/Customer/LiveTrackingMap';
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

  // New comprehensive fetch function
  const fetchAllDeliveryData = async () => {
    try {
      console.log('🔄 Fetching comprehensive delivery data...');
      
      // Try to get both active and historical deliveries from one endpoint
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/customer/deliveries/${user.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Got comprehensive delivery data:', {
            active: data.activeDeliveries?.length || 0,
            historical: data.historicalDeliveries?.length || 0
          });
          
          setActiveDeliveries(data.activeDeliveries || []);
          setDeliveryHistory(data.historicalDeliveries || []);
          return true; // Success
        }
      }
      
      console.log('⚠️ Comprehensive endpoint failed, falling back to individual calls');
      return false; // Failed, need fallback
    } catch (error) {
      console.error('❌ Error in comprehensive fetch:', error);
      return false; // Failed, need fallback
    }
  };

  useEffect(() => {
    if (user && userType === 'customer') {
      // Try comprehensive fetch first, fallback to individual calls
      fetchAllDeliveryData().then(success => {
        if (!success) {
          console.log('📞 Using fallback individual API calls');
          fetchActiveDeliveries();
          fetchDeliveryHistory();
        }
      });
      
      fetchCustomerLocation();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(() => {
        fetchAllDeliveryData().then(success => {
          if (!success) {
            fetchActiveDeliveries();
          }
        });
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, userType]);

  const fetchActiveDeliveries = async () => {
    setIsLoadingActive(true);
    try {
      console.log('🔍 Fetching active deliveries for user:', user.id);
      
      // Use the existing delivery tracking endpoint
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/delivery/tracking/${user.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 API Response data:', data);
        
        if (data.success && data.tracking) {
          // Extract all available data from tracking
          const tracking = data.tracking;
          
          console.log('🚚 Driver data:', tracking.driver);
          console.log('📍 Driver location:', tracking.driverLocation);
          console.log('🏪 Vendor data:', tracking.vendor);
          
          // Convert the tracking data to active delivery format
          const activeDelivery = {
            _id: tracking.deliveryId,
            status: tracking.status || 'in_progress',
            driver: {
              ...tracking.driver,
              location: tracking.driverLocation, // Include driver's current location
              phone: tracking.driver?.contactNumber,
              rating: tracking.driver?.rating || 4.5
            },
            vendor: {
              ...tracking.vendor,
              businessName: tracking.vendor?.name,
              address: tracking.vendor?.address
            },
            driverLocation: tracking.driverLocation, // Add this for easy access
            estimatedArrival: tracking.estimatedArrival,
            deliveryOrder: tracking.deliveryOrder,
            totalCustomers: tracking.totalCustomers,
            completedDeliveries: (tracking.deliveryOrder || 1) - 1,
            customers: Array(tracking.totalCustomers || 1).fill({}),
            createdAt: new Date().toISOString()
          };

          console.log('✅ Processed active delivery:', activeDelivery);
          setActiveDeliveries([activeDelivery]);
        } else {
          console.log('❌ No active tracking found');
          setActiveDeliveries([]);
        }
      } else {
        console.log('❌ API Response not OK:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        setActiveDeliveries([]);
      }
    } catch (error) {
      console.error('❌ Error fetching active deliveries:', error);
      setActiveDeliveries([]);
    } finally {
      setIsLoadingActive(false);
    }
  };

  const fetchDeliveryHistory = async () => {
    setIsLoadingHistory(true);
    try {
      console.log('🔍 Fetching delivery history for user:', user.id);
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/customer/deliveries/${user.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 History API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 History API Response data:', data);
        
        if (data.success) {
          // Use historical deliveries from the response
          setDeliveryHistory(data.historicalDeliveries || []);
          
          // Also update active deliveries if we got them from this endpoint
          if (data.activeDeliveries && data.activeDeliveries.length > 0) {
            console.log('🔄 Also updating active deliveries from comprehensive endpoint');
            setActiveDeliveries(data.activeDeliveries);
          }
        } else {
          setDeliveryHistory([]);
        }
      } else {
        console.log('❌ History API Response not OK:', response.status);
        setDeliveryHistory([]);
      }
    } catch (error) {
      console.error('❌ Error fetching delivery history:', error);
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
        // Always use hardcoded coordinates regardless of API response
        setCustomerLocation({
          ...data.address,
          coordinates: {
            lat: 19.248364,
            lng: 72.850088
          }
        });
      } else {
        // Set default location if API fails
        setCustomerLocation({
          coordinates: {
            lat: 19.248364,
            lng: 72.850088
          }
        });
      }
    } catch (error) {
      console.error('Error fetching customer location:', error);
      // Set default location on error
      setCustomerLocation({
        coordinates: {
          lat: 19.248364,
          lng: 72.850088
        }
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing all data...');
      
      const success = await fetchAllDeliveryData();
      if (!success) {
        // Fallback to individual calls
        await Promise.all([
          fetchActiveDeliveries(),
          fetchDeliveryHistory()
        ]);
      }
      
      await fetchCustomerLocation();
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
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

  const openGoogleMapsRoute = (delivery) => {
    const customerLat = 19.248364;
    const customerLng = 72.850088;
    
    let driverLocation = null;
    
    if (delivery.driverLocation?.coordinates && 
        delivery.driverLocation.coordinates[0] !== 0 && 
        delivery.driverLocation.coordinates[1] !== 0) {
      driverLocation = {
        lat: delivery.driverLocation.coordinates[1],
        lng: delivery.driverLocation.coordinates[0]
      };
    } else if (delivery.driver?.location?.coordinates &&
               delivery.driver.location.coordinates[0] !== 0 && 
               delivery.driver.location.coordinates[1] !== 0) {
      driverLocation = {
        lat: delivery.driver.location.coordinates[1],
        lng: delivery.driver.location.coordinates[0]
      };
    }
    
    if (driverLocation) {
      window.open(
        `https://www.google.com/maps/dir/${driverLocation.lat},${driverLocation.lng}/${customerLat},${customerLng}`,
        '_blank'
      );
    } else {
      toast.error('Driver location not available');
      window.open(`https://www.google.com/maps?q=${customerLat},${customerLng}`, '_blank');
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
            {/* <FaTruck className="w-8 h-8 text-primary" /> */}
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
                                <span className="font-medium text-foreground">{delivery.driver?.name || 'Driver'}</span>
                                {delivery.driver?.vehicleNumber && (
                                  <p className="text-xs text-muted-foreground">
                                    {delivery.driver.vehicleType || 'Vehicle'} - {delivery.driver.vehicleNumber}
                                  </p>
                                )}
                                {delivery.driver?.rating && (
                                  <div className="flex items-center gap-1">
                                    <FaStar className="w-3 h-3 text-yellow-500" />
                                    <span className="text-xs text-muted-foreground">
                                      {delivery.driver.rating}/5
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Driver Location Info */}
                            {delivery.driverLocation && delivery.driverLocation.coordinates && (
                              <div className="text-xs text-muted-foreground">
                                <p>📍 Driver Location: {delivery.driverLocation.coordinates[1]?.toFixed(6)}, {delivery.driverLocation.coordinates[0]?.toFixed(6)}</p>
                                {delivery.driverLocation.lastUpdated && (
                                  <p>🕐 Last Updated: {new Date(delivery.driverLocation.lastUpdated).toLocaleTimeString()}</p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Delivery Info</p>
                            <p className="text-sm text-foreground">
                              Started: {formatTime(delivery.createdAt)}
                            </p>
                            <p className="text-sm text-foreground">
                              {delivery.totalCustomers || delivery.customers?.length || 0} total stops
                            </p>
                            <p className="text-sm text-foreground">
                              Your Position: #{delivery.deliveryOrder || 1}
                            </p>
                            {delivery.estimatedArrival && (
                              <p className="text-sm text-foreground">
                                📅 ETA: {formatTime(delivery.estimatedArrival)}
                              </p>
                            )}
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openGoogleMapsRoute(delivery)}
                          >
                            <FaDirections className="w-3 h-3" />
                            Google Maps
                          </Button>
                          
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
                              const customerLat = 19.248364;
                              const customerLng = 72.850088;
                              
                              if (delivery.vendor?.address?.coordinates) {
                                let vendorLat, vendorLng;
                                
                                if (Array.isArray(delivery.vendor.address.coordinates)) {
                                  // GeoJSON format [lng, lat]
                                  vendorLat = delivery.vendor.address.coordinates[1];
                                  vendorLng = delivery.vendor.address.coordinates[0];
                                } else if (delivery.vendor.address.coordinates.lat) {
                                  // Object format {lat, lng}
                                  vendorLat = delivery.vendor.address.coordinates.lat;
                                  vendorLng = delivery.vendor.address.coordinates.lng;
                                }
                                
                                if (vendorLat && vendorLng) {
                                  window.open(
                                    `https://www.google.com/maps/dir/${vendorLat},${vendorLng}/${customerLat},${customerLng}`,
                                    '_blank'
                                  );
                                } else {
                                  window.open(`https://www.google.com/maps?q=${customerLat},${customerLng}`, '_blank');
                                }
                              } else {
                                window.open(`https://www.google.com/maps?q=${customerLat},${customerLng}`, '_blank');
                              }
                            }}
                          >
                            <FaMapMarkerAlt className="w-3 h-3" />
                            Vendor Route
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

          {/* Live Tracking Map */}
          {activeDeliveries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <LiveTrackingMap 
                delivery={activeDeliveries[0]} 
                customerLocation={customerLocation}
                onRefresh={refreshData}
              />
            </motion.div>
          )}

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
