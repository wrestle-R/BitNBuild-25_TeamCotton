import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaStore, FaShoppingCart, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaArrowLeft, FaExclamationCircle } from 'react-icons/fa';
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
        setVendor(vendorData);
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

  const handleGoBack = () => {
    navigate('/customer/market');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-6">
            <div className="mb-6">
              <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2">
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
              <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2">
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
          >
            <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2">
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

                  <div className="flex flex-col gap-2">
                    <Button className="w-full md:w-auto" disabled={!vendor.plans || vendor.plans === 0}>
                      <FaShoppingCart className="w-4 h-4 mr-2" />
                      {vendor.plans > 0 ? 'View Meal Plans' : 'No Plans Available'}
                    </Button>
                    {vendor.contactNumber && (
                      <Button variant="outline" className="w-full md:w-auto">
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
                    Address & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {vendor.address ? (
                    <>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        {vendor.address.street && (
                          <div className="font-medium">{vendor.address.street}</div>
                        )}
                        <div>
                          {vendor.address.city}
                          {vendor.address.state && `, ${vendor.address.state}`}
                        </div>
                        {vendor.address.pincode && (
                          <div className="text-sm text-muted-foreground">PIN: {vendor.address.pincode}</div>
                        )}
                      </div>
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
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <FaShoppingCart className="w-4 h-4 text-muted-foreground" />
                    <span><strong>{vendor.plans || 0}</strong> meal plans available</span>
                  </div>
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

          {/* Meal Plans Section (if available) */}
          {vendor.plans && vendor.plans > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FaShoppingCart className="w-5 h-5 text-primary" />
                    Available Meal Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FaShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {vendor.plans} Meal Plans Available
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Browse and select from various meal plans offered by this vendor.
                    </p>
                    <Button size="lg">
                      <FaShoppingCart className="w-4 h-4 mr-2" />
                      Explore Meal Plans
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;