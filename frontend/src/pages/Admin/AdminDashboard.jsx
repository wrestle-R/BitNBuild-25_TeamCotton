import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt,
  FaUsers, 
  FaStore, 
  FaShoppingCart,
  FaDollarSign,
  FaEye,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // Check admin authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_auth');
    if (adminAuth !== 'authenticated') {
      navigate('/admin/auth');
      return;
    }
    
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock dashboard stats
      const mockStats = {
        totalUsers: 1247,
        totalVendors: 89,
        totalOrders: 3456,
        totalRevenue: 125690,
        monthlyGrowth: {
          users: 12.5,
          vendors: 8.3,
          orders: 23.7,
          revenue: 18.2
        },
        recentActivity: [
          {
            id: 1,
            type: 'vendor',
            name: 'Fresh Market Co.',
            action: 'New vendor registration',
            time: '2 hours ago',
            status: 'pending'
          },
          {
            id: 2,
            type: 'order',
            name: 'Order #12345',
            action: 'Large order placed',
            time: '4 hours ago',
            status: 'completed'
          },
          {
            id: 3,
            type: 'user',
            name: 'John Doe',
            action: 'New user registration',
            time: '6 hours ago',
            status: 'active'
          },
          {
            id: 4,
            type: 'vendor',
            name: 'Tech Solutions Inc.',
            action: 'Product catalog updated',
            time: '8 hours ago',
            status: 'completed'
          }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'vendor': return FaStore;
      case 'user': return FaUsers;
      case 'order': return FaShoppingCart;
      default: return FaEye;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'vendor': return 'text-blue-500';
      case 'user': return 'text-green-500';
      case 'order': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">Loading dashboard...</p>
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
            <h1 className="text-3xl font-bold text-foreground font-montserrat flex items-center gap-3 mb-2">
              <FaTachometerAlt className="w-8 h-8 text-primary" />
              Dashboard
            </h1>
            <p className="text-muted-foreground font-inter">
              Overview of your platform performance
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-card backdrop-blur-sm border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground font-inter text-sm font-medium">Total Users</p>
                      <p className="text-2xl font-bold text-foreground font-montserrat">
                        {stats.totalUsers?.toLocaleString() || 0}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <FaArrowUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-500 font-medium">
                          +{stats.monthlyGrowth?.users || 0}%
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaUsers className="w-6 h-6 text-blue-500" />
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
                      <p className="text-muted-foreground font-inter text-sm font-medium">Total Vendors</p>
                      <p className="text-2xl font-bold text-foreground font-montserrat">
                        {stats.totalVendors?.toLocaleString() || 0}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <FaArrowUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-500 font-medium">
                          +{stats.monthlyGrowth?.vendors || 0}%
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <FaStore className="w-6 h-6 text-green-500" />
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
                      <p className="text-muted-foreground font-inter text-sm font-medium">Total Orders</p>
                      <p className="text-2xl font-bold text-foreground font-montserrat">
                        {stats.totalOrders?.toLocaleString() || 0}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <FaArrowUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-500 font-medium">
                          +{stats.monthlyGrowth?.orders || 0}%
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <FaShoppingCart className="w-6 h-6 text-purple-500" />
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
                      <p className="text-muted-foreground font-inter text-sm font-medium">Total Revenue</p>
                      <p className="text-2xl font-bold text-foreground font-montserrat">
                        {formatCurrency(stats.totalRevenue || 0)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <FaArrowUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-500 font-medium">
                          +{stats.monthlyGrowth?.revenue || 0}%
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <FaDollarSign className="w-6 h-6 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <Card className="bg-card backdrop-blur-sm border shadow-lg">
            <CardHeader>
              <CardTitle className="font-montserrat flex items-center gap-2">
                <FaEye className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest platform activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity?.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <motion.div 
                      key={activity.id} 
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-all duration-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center`}>
                          <IconComponent className={`w-5 h-5 ${getActivityColor(activity.type)}`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{activity.name}</p>
                          <p className="text-sm text-muted-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;