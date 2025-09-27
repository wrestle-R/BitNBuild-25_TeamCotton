import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaStore, 
  FaSearch, 
  FaEye, 
  FaEdit, 
  FaTrash,
  FaPlus
} from 'react-icons/fa';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import { toast } from 'sonner';

const ManageVendors = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      
      // Mock vendors data for now
      const mockVendors = [
        {
          id: '1',
          name: 'Fresh Market Co.',
          email: 'contact@freshmarket.com',
          phone: '+1 234 567 8901',
          category: 'Grocery',
          status: 'Active',
          joinedAt: new Date('2024-01-15'),
          lastActive: new Date('2024-09-26'),
          avatar: null,
          totalProducts: 45,
          totalSales: 1250
        },
        {
          id: '2',
          name: 'Tech Solutions Inc.',
          email: 'info@techsolutions.com',
          phone: '+1 234 567 8902',
          category: 'Electronics',
          status: 'Active',
          joinedAt: new Date('2024-02-20'),
          lastActive: new Date('2024-09-25'),
          avatar: null,
          totalProducts: 28,
          totalSales: 890
        },
        {
          id: '3',
          name: 'Fashion Hub',
          email: 'hello@fashionhub.com',
          phone: '+1 234 567 8903',
          category: 'Fashion',
          status: 'Pending',
          joinedAt: new Date('2024-09-01'),
          lastActive: new Date('2024-09-27'),
          avatar: null,
          totalProducts: 12,
          totalSales: 340
        },
        {
          id: '4',
          name: 'Home & Garden',
          email: 'support@homegarden.com',
          phone: '+1 234 567 8904',
          category: 'Home & Garden',
          status: 'Inactive',
          joinedAt: new Date('2024-03-10'),
          lastActive: new Date('2024-08-15'),
          avatar: null,
          totalProducts: 67,
          totalSales: 2100
        }
      ];

      setVendors(mockVendors);
    } catch (error) {
      console.error('Failed to fetch vendors data:', error);
      toast.error('Failed to fetch vendors data');
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
      // Mock delete functionality
      setVendors(vendors.filter(vendor => vendor.id !== vendorId));
      toast.success('Vendor deleted successfully');
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      toast.error('Failed to delete vendor');
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
                </h1>
                <p className="text-muted-foreground font-inter">
                  View and manage all vendors in the system
                </p>
              </div>
              <Button className="flex items-center gap-2">
                <FaPlus className="w-4 h-4" />
                Add Vendor
              </Button>
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
                      <p className="text-muted-foreground font-inter text-sm font-medium">Active</p>
                      <p className="text-2xl font-bold text-foreground font-montserrat">
                        {vendors.filter(v => v.status === 'Active').length}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
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
                      <p className="text-muted-foreground font-inter text-sm font-medium">Pending</p>
                      <p className="text-2xl font-bold text-foreground font-montserrat">
                        {vendors.filter(v => v.status === 'Pending').length}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
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
                      <p className="text-muted-foreground font-inter text-sm font-medium">Inactive</p>
                      <p className="text-2xl font-bold text-foreground font-montserrat">
                        {vendors.filter(v => v.status === 'Inactive').length}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
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

          {/* Vendors List */}
          <Card className="bg-card backdrop-blur-sm border shadow-lg">
            <CardHeader>
              <CardTitle className="font-montserrat flex items-center gap-2">
                <FaStore className="w-5 h-5 text-primary" />
                Vendors ({filteredVendors.length})
              </CardTitle>
              <CardDescription>
                Manage all vendor accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredVendors.map((vendor, index) => (
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
                        </div>
                        <p className="text-sm text-muted-foreground">{vendor.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            Category: {vendor.category}
                          </span>
                          <span>Products: {vendor.totalProducts}</span>
                          <span>Sales: ${vendor.totalSales}</span>
                          <span>Joined: {formatDate(vendor.joinedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" size="sm" className="hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/20">
                          <FaEye className="w-4 h-4" />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" size="sm" className="hover:bg-yellow-500/10 hover:text-yellow-500 hover:border-yellow-500/20">
                          <FaEdit className="w-4 h-4" />
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManageVendors;