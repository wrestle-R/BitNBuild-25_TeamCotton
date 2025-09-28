import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
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
  FaCheckCircle
} from 'react-icons/fa';
import { MdLocationOn, MdDeliveryDining } from 'react-icons/md';
import VendorSidebar from '../../components/Vendor/VendorSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import DeliveryMapView from '../../components/Vendor/DeliveryMapView';

const VendorTracking = () => {
  const { user, userType, loading } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [subscribersWithLocations, setSubscribersWithLocations] = useState([]);
  const [vendorLocationData, setVendorLocationData] = useState(null);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [error, setError] = useState(null);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  console.log('VendorTracking - Render State:', {
    userType,
    loading,
    sidebarOpen,
    subscribersCount: subscribersWithLocations.length,
    vendorLocation: vendorLocationData ? 'Has location' : 'No location',
    selectedDriver: selectedDriver ? selectedDriver.name : 'None',
    activeDelivery: activeDelivery ? activeDelivery.status : 'None'
  });

  useEffect(() => {
    if (user && userType !== 'vendor') {
      toast.error('Access denied: This is for vendors only!');
      navigate('/customer/dashboard', { replace: true });
      return;
    }
  }, [user, userType, navigate]);

  useEffect(() => {
    if (user && userType === 'vendor') {
      fetchAvailableDrivers();
      fetchSubscribersWithLocations();
      fetchActiveDelivery();
      fetchDeliveryHistory();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(() => {
        fetchAvailableDrivers();
        fetchSubscribersWithLocations();
        fetchActiveDelivery();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, userType]);

  const fetchAvailableDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/available`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setAvailableDrivers(data.drivers);
      } else {
        console.error('API returned error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Failed to fetch available drivers');
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const fetchSubscribersWithLocations = async () => {
    if (!user?.id) return;

    setIsLoadingSubscribers(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/vendor/${user.id}/subscribers`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setSubscribersWithLocations(data.subscribers || []);
        setVendorLocationData(data.vendorLocation);
      } else {
        console.error('API returned error:', data.message);
        toast.error(data.message || 'Failed to fetch subscribers');
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to fetch subscribers with locations');
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  const fetchActiveDelivery = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/delivery/active/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.delivery) {
        setActiveDelivery(data.delivery);
        // Set the driver from active delivery if available
        if (data.delivery.driver && !selectedDriver) {
          setSelectedDriver(data.delivery.driver);
        }
      }
    } catch (error) {
      console.error('Error fetching active delivery:', error);
    }
  };

  const fetchDeliveryHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/delivery/history/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setDeliveryHistory(data.deliveries || []);
      }
    } catch (error) {
      console.error('Error fetching delivery history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const assignDriverForDelivery = async () => {
    if (!selectedDriver) {
      toast.error('Please select a driver first');
      return;
    }

    if (subscribersWithLocations.length === 0) {
      toast.error('No subscribers with locations found');
      return;
    }

    if (!vendorLocationData) {
      toast.error('Vendor location is required for delivery assignment');
      return;
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/delivery/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId: user.id,
          driverId: selectedDriver._id,
          customers: subscribersWithLocations.map(sub => ({
            customerId: sub.id,
            address: sub.address,
            location: {
              type: 'Point',
              coordinates: sub.coordinates
            }
          }))
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Delivery assignment created! Driver ${selectedDriver.name} has been notified.`);
        setActiveDelivery(data.delivery);
        fetchAvailableDrivers(); // Refresh driver list
      } else {
        toast.error(data.message || 'Failed to create delivery assignment');
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast.error('Failed to create delivery assignment');
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAvailableDrivers(),
        fetchSubscribersWithLocations(),
        fetchActiveDelivery(),
        fetchDeliveryHistory()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <VendorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 bg-muted rounded"></div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
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
            You need to be signed in as a vendor to access delivery tracking.
          </p>
          <Button asChild>
            <button onClick={() => navigate('/vendor/auth')} className="font-inter font-semibold">
              Sign In as Vendor
            </button>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <VendorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

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
                Delivery Tracking & Management
              </h1>
              <p className="text-muted-foreground mt-2 font-inter">
                Monitor and manage your delivery operations in real-time
              </p>
            </div>
            <Button 
              onClick={refreshData} 
              disabled={refreshing}
              variant="outline"
              className="gap-2"
            >
              <FaSync className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </motion.div>

          {error && (
            <Alert variant="destructive">
              <FaExclamationTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Active Delivery Status */}
          {activeDelivery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaCircle className="w-3 h-3 text-green-500 animate-pulse" />
                    Active Delivery in Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Driver</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            <FaUser className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{activeDelivery.driver?.name}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={getStatusBadgeVariant(activeDelivery.status)} className="gap-1">
                        {getStatusIcon(activeDelivery.status)}
                        {activeDelivery.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Customers</p>
                      <p className="font-medium">{activeDelivery.customers?.length || 0} deliveries</p>
                    </div>
                  </div>
                  
                  {activeDelivery.status === 'in_progress' && activeDelivery.customers && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-medium">
                          {activeDelivery.completedDeliveries || 0} / {activeDelivery.customers.length}
                        </span>
                      </div>
                      <Progress 
                        value={((activeDelivery.completedDeliveries || 0) / activeDelivery.customers.length) * 100} 
                        className="w-full"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Driver Assignment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaTruck className="w-5 h-5" />
                  Delivery Management
                </CardTitle>
                <CardDescription>
                  Assign drivers to create optimized delivery routes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Driver for Delivery</label>
                    <Select 
                      value={selectedDriver?._id || ""} 
                      onValueChange={(value) => {
                        const driver = availableDrivers.find(d => d._id === value);
                        setSelectedDriver(driver);
                      }}
                      disabled={!!activeDelivery}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingDrivers 
                            ? "Loading drivers..." 
                            : availableDrivers.length === 0 
                              ? "No drivers available" 
                              : `Select from ${availableDrivers.length} drivers`
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers.map((driver) => (
                          <SelectItem key={driver._id} value={driver._id}>
                            {driver.name} - {driver.vehicleType} ({driver.vehicleNumber}) - ⭐ {driver.rating}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedDriver && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <FaUser className="w-4 h-4" />
                        Selected Driver Details
                      </h4>
                      <div className="grid gap-2 md:grid-cols-2 text-sm">
                        <p><strong>Name:</strong> {selectedDriver.name}</p>
                        <p><strong>Vehicle:</strong> {selectedDriver.vehicleType} - {selectedDriver.vehicleNumber}</p>
                        <p><strong>Rating:</strong> ⭐ {selectedDriver.rating}</p>
                        <p><strong>Status:</strong> {selectedDriver.available ? 'Available' : 'Busy'}</p>
                      </div>
                    </div>
                  )}

                  {selectedDriver && subscribersWithLocations.length > 0 && vendorLocationData && !activeDelivery && (
                    <div className="space-y-2">
                      <Button 
                        onClick={assignDriverForDelivery}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <FaTruck className="w-4 h-4 mr-2" />
                        Create Delivery Route ({subscribersWithLocations.length} customers)
                      </Button>
                      
                      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border">
                        <p><strong>Next Steps:</strong></p>
                        <p>1. Driver will receive delivery assignment notification</p>
                        <p>2. Driver must be within 500m of your location to start</p>
                        <p>3. TSP optimized route will guide efficient delivery</p>
                      </div>
                    </div>
                  )}

                  {activeDelivery && (
                    <Alert>
                      <FaCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription>
                        A delivery is currently active. Complete the current delivery before creating a new one.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Loading states and warnings */}
                  {isLoadingSubscribers && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading subscribers...</p>
                    </div>
                  )}

                  {!vendorLocationData && !isLoadingSubscribers && (
                    <Alert variant="destructive">
                      <FaExclamationTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Vendor location is missing. Please update your profile with a complete address to enable delivery routing.
                        <Button variant="outline" size="sm" className="mt-2 ml-2" onClick={() => navigate('/vendor/profile')}>
                          Update Profile
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {subscribersWithLocations.length === 0 && !isLoadingSubscribers && (
                    <Alert>
                      <FaExclamationTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No subscribers with valid locations found. Customers need to update their addresses with coordinates.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Delivery Route Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaRoute className="w-5 h-5" />
                  Live Tracking Map
                </CardTitle>
                <CardDescription>
                  TSP optimized route visualization for efficient delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeliveryMapView 
                  selectedDriver={selectedDriver}
                  subscribers={subscribersWithLocations}
                  vendorLocation={vendorLocationData}
                  activeDelivery={activeDelivery}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Delivery History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MdDeliveryDining className="w-5 h-5" />
                  Delivery History
                </CardTitle>
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
                      <div key={delivery._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getStatusIcon(delivery.status)}
                          </div>
                          <div>
                            <p className="font-medium">{delivery.driver?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {delivery.customers?.length || 0} customers • {formatDate(delivery.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusBadgeVariant(delivery.status)}>
                            {delivery.status?.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(delivery.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MdDeliveryDining className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No delivery history found</p>
                    <p className="text-sm text-muted-foreground">Create your first delivery assignment to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VendorTracking;