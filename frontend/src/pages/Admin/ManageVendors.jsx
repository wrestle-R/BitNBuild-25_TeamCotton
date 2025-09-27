import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaStore, 
  FaSearch, 
  FaEye, 
  FaTrash,
  FaPlus,
  FaCheck,
  FaTimes,
  FaCertificate,
  FaMapMarkerAlt,
  FaPhone,
  FaIdCard,
  FaCalendarAlt,
  FaDollarSign
} from 'react-icons/fa';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import { toast } from 'sonner';

const ManageVendors = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isConnected, setIsConnected] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_auth');
    if (adminAuth !== 'authenticated') {
      navigate('/admin/auth');
      return;
    }
    
    fetchVendorsData();
  }, [navigate]);

  const fetchVendorsData = async () => {
    try {
      setLoading(true);
      
      // Fetch real vendors data from API
      const response = await fetch('http://localhost:8000/api/admin/vendors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match component expectations
        const transformedVendors = data.vendors.map(vendor => ({
          ...vendor,
          avatar: null, // Add avatar field
          status: vendor.verified ? 'Active' : 'Pending' // Map verified to status
        }));
        setVendors(transformedVendors);
        setIsConnected(true);
        console.log('Vendors loaded:', transformedVendors);
      } else {
        throw new Error(data.message || 'Failed to fetch vendors');
      }
    } catch (error) {
      console.error('Failed to fetch vendors data:', error);
      setIsConnected(false);
      toast.error('Failed to connect to server.');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (vendorId, vendorName) => {
    if (!confirm(`Are you sure you want to delete ${vendorName}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/admin/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setVendors(vendors.filter(vendor => vendor.id !== vendorId));
        toast.success('Vendor deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete vendor');
      }
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      toast.error('Failed to delete vendor');
    }
  };

  const handleToggleVerification = async (vendorId, currentVerified, vendorName) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/vendors/${vendorId}/verification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verified: !currentVerified
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the vendor in the local state
        setVendors(vendors.map(vendor => 
          vendor.id === vendorId 
            ? { 
                ...vendor, 
                verified: !currentVerified,
                status: !currentVerified ? 'Active' : 'Pending'
              }
            : vendor
        ));
        toast.success(`${vendorName} ${!currentVerified ? 'verified' : 'unverified'} successfully`);
      } else {
        throw new Error(data.message || 'Failed to update verification status');
      }
    } catch (error) {
      console.error('Failed to toggle verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  const handleViewVendor = (vendor) => {
    // Generate fake additional data for the vendor
    const enhancedVendor = {
      ...vendor,
      gstin: `22${Math.random().toString().substr(2, 13)}`,
      panNumber: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      businessAddress: `${Math.floor(Math.random() * 999) + 1}, ${['Main Street', 'Park Avenue', 'Business District', 'Commercial Complex'][Math.floor(Math.random() * 4)]}, ${['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][Math.floor(Math.random() * 5)]}, ${['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal'][Math.floor(Math.random() * 5)]} - ${Math.floor(Math.random() * 900000) + 100000}`,
      businessType: ['Retailer', 'Wholesaler', 'Manufacturer', 'Distributor', 'Service Provider'][Math.floor(Math.random() * 5)],
      establishedYear: 2015 + Math.floor(Math.random() * 9),
      bankAccount: `${Math.floor(Math.random() * 90000000000) + 10000000000}`,
      ifscCode: `${['SBIN', 'HDFC', 'ICIC', 'AXIS', 'KOTAK'][Math.floor(Math.random() * 5)]}0${Math.floor(Math.random() * 900000) + 100000}`,
      contactPerson: ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta', 'Vikash Singh'][Math.floor(Math.random() * 5)],
      alternatePhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      website: `www.${vendor.name.toLowerCase().replace(/\s+/g, '')}.com`,
      annualTurnover: Math.floor(Math.random() * 50000000) + 1000000
    };
    
    setSelectedVendor(enhancedVendor);
    setShowVendorModal(true);
  };

  const closeVendorModal = () => {
    setShowVendorModal(false);
    setSelectedVendor(null);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab
    let matchesTab = true;
    if (activeTab === 'verified') {
      matchesTab = vendor.verified === true;
    } else if (activeTab === 'pending') {
      matchesTab = vendor.verified === false;
    }
    
    return matchesSearch && matchesTab;
  });

  // Separate vendors for different tabs
  const verifiedVendors = vendors.filter(v => v.verified === true);
  const pendingVendors = vendors.filter(v => v.verified === false);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Inactive': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderVendorCard = (vendor, index) => (
    <motion.div 
      key={vendor.id} 
      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-all duration-200 hover:shadow-lg group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.01, x: 4 }}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            <AvatarImage src={vendor.avatar} />
            <AvatarFallback className="bg-primary/10">
              <FaStore className="w-6 h-6 text-primary" />
            </AvatarFallback>
          </Avatar>
          {/* Status indicator */}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
            vendor.status === 'Active' ? 'bg-green-500' : 
            vendor.status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'
          }`}>
            {vendor.status === 'Active' && (
              <div className="w-full h-full bg-green-500 rounded-full animate-ping opacity-75" />
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {vendor.name}
            </h3>
            <Badge className={`${getStatusColor(vendor.status)} border transition-all`}>
              {vendor.status}
            </Badge>
            {vendor.verified && (
              <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                <FaCertificate className="w-3 h-3" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{vendor.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="outline" 
            size="sm" 
            className="hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/20"
            onClick={() => handleViewVendor(vendor)}
          >
            <FaEye className="w-4 h-4" />
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant={vendor.verified ? "destructive" : "default"}
            size="sm"
            onClick={() => handleToggleVerification(vendor.id, vendor.verified, vendor.name)}
            className={vendor.verified 
              ? "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 bg-red-50 text-red-600 border-red-200"
              : "hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/20 bg-green-50 text-green-600 border-green-200"
            }
          >
            {vendor.verified ? <FaTimes className="w-4 h-4" /> : <FaCheck className="w-4 h-4" />}
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
            className="hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
          >
            <FaTrash className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex relative">
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className={`flex-1 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6 h-full overflow-y-auto">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground font-montserrat flex items-center gap-3 mb-2">
                  <FaStore className="w-8 h-8 text-primary" />
                  Manage Vendors
                  {!isConnected && (
                    <Badge variant="destructive" className="ml-2">
                      Offline Mode
                    </Badge>
                  )}
                </h1>
                <p className="text-muted-foreground font-inter">
                  {isConnected ? 
                    'View and manage all vendors in the system' : 
                    'Backend server not connected - No data available'
                  }
                </p>
              </div>

            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-card backdrop-blur-sm border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground font-inter text-sm font-medium">Total Vendors</p>
                      <p className="text-2xl font-bold text-foreground font-montserrat">
                        {vendors.length}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <FaStore className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-card backdrop-blur-sm border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground font-inter text-sm font-medium">Verified</p>
                      <p className="text-2xl font-bold text-foreground font-montserrat">
                        {vendors.filter(v => v.verified === true).length}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <FaCertificate className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-card backdrop-blur-sm border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground font-inter text-sm font-medium">Pending Verification</p>
                      <p className="text-2xl font-bold text-foreground font-montserrat">
                        {vendors.filter(v => v.verified === false).length}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <FaTimes className="w-4 h-4 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-card backdrop-blur-sm border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground font-inter text-sm font-medium">Total Earnings</p>
                      <p className="text-2xl font-bold text-foreground font-montserrat">
                        ${vendors.reduce((sum, v) => sum + (v.earnings || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-500 font-bold text-sm">$</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <Card className="bg-card backdrop-blur-sm border shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search vendors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendors List with Tabs */}
          <Card className="bg-card backdrop-blur-sm border shadow-lg">
            <CardHeader>
              <CardTitle className="font-montserrat flex items-center gap-2">
                <FaStore className="w-5 h-5 text-primary" />
                Vendor Management
              </CardTitle>
              <CardDescription>
                Organize vendors by verification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <FaStore className="w-4 h-4" />
                    All Vendors ({vendors.length})
                  </TabsTrigger>
                  <TabsTrigger value="verified" className="flex items-center gap-2">
                    <FaCertificate className="w-4 h-4" />
                    Verified ({verifiedVendors.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <FaTimes className="w-4 h-4" />
                    Pending ({pendingVendors.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {filteredVendors.length > 0 ? (
                    filteredVendors.map((vendor, index) => renderVendorCard(vendor, index))
                  ) : (
                    <div className="text-center py-12">
                      <FaStore className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No vendors found matching your search.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="verified" className="space-y-4">
                  {verifiedVendors.filter(vendor => 
                    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length > 0 ? (
                    verifiedVendors.filter(vendor => 
                      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((vendor, index) => renderVendorCard(vendor, index))
                  ) : (
                    <div className="text-center py-12">
                      <FaCertificate className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No verified vendors found.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Verified vendors will appear here once you approve them.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                  {pendingVendors.filter(vendor => 
                    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length > 0 ? (
                    pendingVendors.filter(vendor => 
                      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((vendor, index) => renderVendorCard(vendor, index))
                  ) : (
                    <div className="text-center py-12">
                      <FaTimes className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending vendors found.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Vendors awaiting verification will appear here.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vendor Details Modal */}
      {showVendorModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedVendor.avatar} />
                      <AvatarFallback className="bg-primary/10">
                        <FaStore className="w-8 h-8 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        {selectedVendor.name}
                        {selectedVendor.verified && (
                          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                            <FaCertificate className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-base">{selectedVendor.email}</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={closeVendorModal}>
                    <FaTimes className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FaIdCard className="text-primary" />
                      Business Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                        <p className="font-medium">{selectedVendor.businessType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">GSTIN</label>
                        <p className="font-medium font-mono">{selectedVendor.gstin}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">PAN Number</label>
                        <p className="font-medium font-mono">{selectedVendor.panNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <FaCalendarAlt className="text-sm" />
                          Established Year
                        </label>
                        <p className="font-medium">{selectedVendor.establishedYear}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FaPhone className="text-primary" />
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                        <p className="font-medium">{selectedVendor.contactPerson}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Primary Phone</label>
                        <p className="font-medium">{selectedVendor.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Alternate Phone</label>
                        <p className="font-medium">{selectedVendor.alternatePhone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Website</label>
                        <p className="font-medium text-blue-600">{selectedVendor.website}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Address Information */}
                <Card className="p-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-primary" />
                    Business Address
                  </h3>
                  <p className="font-medium">{selectedVendor.businessAddress}</p>
                </Card>

                {/* Financial Information */}
                <Card className="p-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <FaDollarSign className="text-primary" />
                    Financial Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Annual Turnover</label>
                      <p className="font-medium text-lg">₹{selectedVendor.annualTurnover.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bank Account</label>
                      <p className="font-medium font-mono">{selectedVendor.bankAccount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
                      <p className="font-medium font-mono">{selectedVendor.ifscCode}</p>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={closeVendorModal}>
                    Close
                  </Button>
                  <Button 
                    variant={selectedVendor.verified ? "destructive" : "default"}
                    onClick={() => {
                      handleToggleVerification(selectedVendor.id, selectedVendor.verified, selectedVendor.name);
                      closeVendorModal();
                    }}
                    className={selectedVendor.verified 
                      ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                    }
                  >
                    {selectedVendor.verified ? (
                      <>
                        <FaTimes className="w-4 h-4 mr-2" />
                        Unverify Vendor
                      </>
                    ) : (
                      <>
                        <FaCheck className="w-4 h-4 mr-2" />
                        Verify Vendor
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ManageVendors;