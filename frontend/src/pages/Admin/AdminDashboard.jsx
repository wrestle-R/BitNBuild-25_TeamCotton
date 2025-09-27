import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaHatCowboy, 
  FaShieldAlt, 
  FaUsers, 
  FaChartBar, 
  FaCog, 
  FaSignOutAlt, 
  FaBullseye,
  FaHorse,
  FaCrown,
  FaEye,
  FaEdit,
  FaTrash,
  FaTachometerAlt,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import AdminBackground from '../../components/ui/AdminBackground';
import { useUserContext } from '../../../context/UserContextSimplified';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const backendError = false; // Simplified context doesn't have this
  
  // Placeholder admin functions
  const getAllUsers = async () => {
    throw new Error('Admin functionality not implemented in simplified context');
  };
  
  const deleteUserById = async () => {
    throw new Error('Admin functionality not implemented in simplified context');
  };
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  // Check admin authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem('wildwest_admin_auth');
    if (adminAuth !== 'authenticated') {
      navigate('/admin/auth');
      return;
    }
    
    fetchUsersData();
  }, [navigate]);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      
      if (backendError) {
        // Use mock data when backend is unavailable
        const mockUsers = [
          {
            _id: '1',
            displayName: 'John Cowboy',
            email: 'john@wildwest.com',
            cowboyLevel: 'Expert',
            lassoCount: 25,
            horses: ['Thunder', 'Lightning'],
            hats: ['Stetson', 'Fedora'],
            joinedAt: new Date('2024-01-15'),
            lastActive: new Date('2024-09-26'),
            photoURL: null
          },
          {
            _id: '2',
            displayName: 'Sarah Ranger',
            email: 'sarah@wildwest.com',
            cowboyLevel: 'Professional',
            lassoCount: 18,
            horses: ['Spirit'],
            hats: ['Classic Brown'],
            joinedAt: new Date('2024-02-20'),
            lastActive: new Date('2024-09-25'),
            photoURL: null
          },
          {
            _id: '3',
            displayName: 'Mike Sheriff',
            email: 'mike@wildwest.com',
            cowboyLevel: 'Rookie',
            lassoCount: 5,
            horses: ['Dusty'],
            hats: ['Basic Stetson'],
            joinedAt: new Date('2024-09-01'),
            lastActive: new Date('2024-09-27'),
            photoURL: null
          }
        ];

        const mockStats = {
          totalUsers: 3,
          activeUsers: 2,
          totalLassos: 48,
          averageLassos: '16.00'
        };

        setUsers(mockUsers);
        setStatistics(mockStats);
        toast.error('Backend unavailable - showing demo data');
      } else {
        // Fetch real data from backend
        const data = await getAllUsers();
        setUsers(data.users || []);
        setStatistics(data.statistics || {});
      }
    } catch (error) {
      console.error('Failed to fetch users data:', error);
      toast.error('Failed to fetch cowboys data');
      
      // Fallback to empty state
      setUsers([]);
      setStatistics({});
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (backendError) {
      toast.error('Backend unavailable - cannot delete users');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${userName} from the saloon?`)) {
      return;
    }

    try {
      await deleteUserById(userId);
      // Refresh the users list
      await fetchUsersData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wildwest_admin_auth');
    localStorage.removeItem('wildwest_admin_login');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || user.cowboyLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Expert': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Professional': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Rookie': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const sidebarItems = [
    { id: 'overview', icon: FaTachometerAlt, label: 'Overview' },
    { id: 'users', icon: FaUsers, label: 'Manage Cowboys' },
    { id: 'analytics', icon: FaChartBar, label: 'Analytics' },
    { id: 'settings', icon: FaCog, label: 'Settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">Loading Sheriff's Office...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background  overflow-x-hidden flex relative">
      <AdminBackground />
      {/* Sidebar */}
      <motion.div
        className={`bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
        initial={false}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="w-8 h-8 text-sidebar-primary flex-shrink-0" />
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h1 className="font-montserrat font-bold text-sidebar-foreground text-lg">
                  Sheriff's Office
                </h1>
                <p className="text-sidebar-foreground/70 text-sm">Admin Panel</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <Button
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full justify-start gap-3 transition-all duration-200 ${
                    sidebarOpen ? 'px-3' : 'px-0 justify-center'
                  } ${
                    activeTab === item.id 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                      : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-inter"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Admin Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center relative overflow-hidden"
              whileHover={{ scale: 1.1 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <FaCrown className="w-5 h-5 text-yellow-500 relative z-10" />
              <motion.div
                className="absolute inset-0 bg-yellow-500/10 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <p className="text-sidebar-foreground font-medium text-sm">Admin</p>
                <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  Sheriff
                </Badge>
              </motion.div>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={`w-full justify-start gap-3 text-sidebar-foreground hover:text-destructive ${
              sidebarOpen ? 'px-3' : 'px-0 justify-center'
            }`}
          >
            <FaSignOutAlt className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-inter"
              >
                Logout
              </motion.span>
            )}
          </Button>
        </div>

        {/* Toggle Button */}
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          variant="ghost"
          size="sm"
          className="absolute -right-3 top-6 bg-sidebar border border-sidebar-border rounded-full w-6 h-6 p-0"
        >
          <motion.div
            animate={{ rotate: sidebarOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.div>
        </Button>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="p-6 h-full overflow-y-auto">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3 mb-2">
              <FaShieldAlt className="w-10 h-10 text-primary" />
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground font-inter">
                Manage the Wild West Arena from the Sheriff's Office
              </p>
              {backendError && (
                <Alert className="max-w-md">
                  <AlertDescription>
                    Backend offline - limited functionality
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </motion.div>

          {/* Tab Content */}
          <Tabs value={activeTab} className="w-full">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-card/80 backdrop-blur-sm border shadow-lg relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-muted-foreground font-inter text-sm font-medium">Total Cowboys</p>
                            <p className="text-3xl font-bold text-foreground font-montserrat">
                              {statistics.totalUsers || 0}
                            </p>
                          </div>
                          <div className="relative">
                            <FaUsers className="w-10 h-10 text-primary" />
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-50" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-card/80 backdrop-blur-sm border shadow-lg relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-muted-foreground font-inter text-sm font-medium">Active This Week</p>
                            <p className="text-3xl font-bold text-foreground font-montserrat">
                              {statistics.activeUsers || 0}
                            </p>
                          </div>
                          <div className="relative">
                            <FaHatCowboy className="w-10 h-10 text-green-500" />
                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md opacity-50" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-card/80 backdrop-blur-sm border shadow-lg relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-muted-foreground font-inter text-sm font-medium">Total Lassos</p>
                            <p className="text-3xl font-bold text-foreground font-montserrat">
                              {statistics.totalLassos || 0}
                            </p>
                          </div>
                          <div className="relative">
                            <FaBullseye className="w-10 h-10 text-blue-500" />
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-50" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-card/80 backdrop-blur-sm border shadow-lg relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-muted-foreground font-inter text-sm font-medium">Avg Lassos</p>
                            <p className="text-3xl font-bold text-foreground font-montserrat">
                              {statistics.averageLassos || '0.00'}
                            </p>
                          </div>
                          <div className="relative">
                            <FaBullseye className="w-10 h-10 text-yellow-500" />
                            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-md opacity-50" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Recent Activity */}
                <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-montserrat flex items-center gap-2">
                      <FaChartBar className="w-5 h-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.slice(0, 3).map((user) => (
                        <div key={user._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.photoURL} />
                              <AvatarFallback>
                                <FaHatCowboy className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{user.displayName}</p>
                              <p className="text-sm text-muted-foreground">Last active: {formatDate(user.lastActive)}</p>
                            </div>
                          </div>
                          <Badge className={getLevelColor(user.cowboyLevel)}>
                            {user.cowboyLevel}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Filters */}
                <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search cowboys..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="w-full md:w-48">
                        <Select value={filterLevel} onValueChange={setFilterLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Rookie">Rookie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Users List */}
                <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-montserrat flex items-center gap-2">
                      <FaUsers className="w-5 h-5 text-primary" />
                      Cowboys Management ({filteredUsers.length})
                    </CardTitle>
                    <CardDescription>
                      Manage all cowboys in the Wild West Arena
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredUsers.map((user, index) => (
                        <motion.div 
                          key={user._id} 
                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-all duration-200 hover:shadow-lg group"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ scale: 1.01, x: 4 }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                <AvatarImage src={user.photoURL} />
                                <AvatarFallback className="bg-primary/10">
                                  <FaHatCowboy className="w-6 h-6 text-primary" />
                                </AvatarFallback>
                              </Avatar>
                              {/* Online indicator for recently active users */}
                              {new Date(user.lastActive) > new Date(Date.now() - 24 * 60 * 60 * 1000) && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background">
                                  <div className="w-full h-full bg-green-500 rounded-full animate-ping opacity-75" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {user.displayName}
                                </h3>
                                <Badge className={`${getLevelColor(user.cowboyLevel)} border transition-all`}>
                                  {user.cowboyLevel}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <motion.span 
                                  className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <FaBullseye className="w-3 h-3" />
                                  {user.lassoCount} Lassos
                                </motion.span>
                                <motion.span 
                                  className="flex items-center gap-1 hover:text-green-500 transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <FaHorse className="w-3 h-3" />
                                  {user.horses?.length || 0} Horses
                                </motion.span>
                                <motion.span 
                                  className="flex items-center gap-1 hover:text-yellow-500 transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <FaHatCowboy className="w-3 h-3" />
                                  {user.hats?.length || 0} Hats
                                </motion.span>
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
                                onClick={() => handleDeleteUser(user._id, user.displayName)}
                                disabled={backendError}
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
              </motion.div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Alert>
                  <FaChartBar className="h-4 w-4" />
                  <AlertDescription>
                    Analytics dashboard coming soon! This will show detailed statistics about user engagement, growth trends, and more.
                  </AlertDescription>
                </Alert>
              </motion.div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Alert>
                  <FaCog className="h-4 w-4" />
                  <AlertDescription>
                    Settings panel coming soon! This will allow you to configure various aspects of the Wild West Arena.
                  </AlertDescription>
                </Alert>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;