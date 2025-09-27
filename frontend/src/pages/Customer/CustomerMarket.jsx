import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaStore, FaSearch, FaFilter, FaShoppingCart, FaMapMarkerAlt, FaExclamationCircle, FaSync, FaInfoCircle } from 'react-icons/fa';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner';
import { auth } from '../../../firebase.config';

const CustomerMarket = () => {
  const { user, token } = useUserContext();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPreference, setFilterPreference] = useState('all');
  const [error, setError] = useState(null);

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
      console.log('🔑 Using fresh token for API call:', token.substring(0, 20) + '...');
      
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

  // Get verified vendors
  const getVerifiedVendors = () => apiCall('/api/customer/vendors');

  useEffect(() => {
    const fetchVendors = async () => {
      if (!user || !token) {
        setLoading(false);
        setError('Please log in to view vendors');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const vendorsData = await getVerifiedVendors();
        setVendors(vendorsData);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setError(error.message || 'Failed to load vendors');
        toast.error('Failed to load vendors. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [user, token]);

  const handleRefresh = () => {
    if (user && token) {
      const fetchVendors = async () => {
        try {
          setLoading(true);
          setError(null);
          const vendorsData = await getVerifiedVendors();
          setVendors(vendorsData);
          toast.success('Vendors refreshed successfully!');
        } catch (error) {
          console.error('Error fetching vendors:', error);
          setError(error.message || 'Failed to load vendors');
          toast.error('Failed to refresh vendors. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchVendors();
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

  const handleViewDetails = (vendor) => {
    navigate(`/customer/vendor/${vendor._id || vendor.id}`);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
                <FaStore className="w-10 h-10 text-primary" />
                Market
              </h1>
              <p className="text-muted-foreground font-inter mt-2">
                Loading vendors and meal plans...
              </p>
            </div>

            {/* Loading Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={`skeleton-${index}`} className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted animate-pulse"></div>
                        <div>
                          <div className="h-5 w-32 bg-muted animate-pulse rounded mb-2"></div>
                          <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-full bg-muted animate-pulse rounded mb-3"></div>
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-4"></div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-8 bg-muted animate-pulse rounded"></div>
                      <div className="w-20 h-8 bg-muted animate-pulse rounded"></div>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
                  <FaStore className="w-10 h-10 text-primary" />
                  Market
                </h1>
                <p className="text-muted-foreground font-inter mt-2">
                  Discover vendors and explore meal plans
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Error Alert */}
          {error && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert variant="destructive">
                <FaExclamationCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Search and Filters */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search vendors or cuisines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Filter */}
                  <div className="w-full md:w-48">
                    <Select value={filterPreference} onValueChange={setFilterPreference} disabled={loading}>
                      <SelectTrigger>
                        <FaFilter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vendors</SelectItem>
                        <SelectItem value="nearest">Nearest First</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Vendors Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {filteredVendors.map((vendor, index) => (
              <motion.div
                key={vendor._id || vendor.id || `vendor-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                          <AvatarImage 
                            src={vendor.profileImage} 
                            alt={vendor.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                            <FaStore className="w-6 h-6 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-montserrat truncate">{vendor.name}</CardTitle>
                          {vendor.verified && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 mt-1">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {vendor.address && vendor.address.city && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <FaMapMarkerAlt className="w-3 h-3" />
                        <span>
                          {vendor.address.street && `${vendor.address.street}, `}
                          {vendor.address.city}
                          {vendor.address.state && `, ${vendor.address.state}`}
                        </span>
                      </div>
                    )}

                    {vendor.address && vendor.address.coordinates && user && user.address && user.address.coordinates && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {calculateDistance(
                            user.address.coordinates.lat,
                            user.address.coordinates.lng,
                            vendor.address.coordinates.lat,
                            vendor.address.coordinates.lng
                          ).toFixed(1)} km away
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <FaShoppingCart className="w-3 h-3" />
                        {vendor.plans || 0} meal plans
                      </span>
                      {vendor.contactNumber && (
                        <span className="text-xs">Contact available</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        size="sm"
                        disabled={!vendor.plans || vendor.plans === 0}
                      >
                        <FaShoppingCart className="w-4 h-4 mr-2" />
                        {vendor.plans > 0 ? 'View Plans' : 'No Plans'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(vendor)}
                      >
                        <FaInfoCircle className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* No Results */}
          {!loading && !error && filteredVendors.length === 0 && vendors.length > 0 && (
            <motion.div
              className="text-center py-    "
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <FaSearch className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No vendors match your search</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters to find vendors.
              </p>
            </motion.div>
          )}

          {/* No Vendors Available */}
          {!loading && !error && vendors.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <FaStore className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No verified vendors available</h3>
              <p className="text-muted-foreground">
                Vendors are being verified. Please check back later for available meal plans.
              </p>
            </motion.div>
          )}


        </div>
      </div>
    </div>
  );
};

export default CustomerMarket;