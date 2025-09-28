import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt,
  FaUsers, 
  FaStore, 
  FaShoppingCart,
  FaDollarSign,
  FaEye,
  FaSync,
  FaChartLine
} from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/admin/dashboard-stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        // Add sample data if no real data exists for demo purposes
        const statsWithDefaults = {
          ...data.stats,
          last5DaysData: data.stats.last5DaysData && data.stats.last5DaysData.length > 0 
            ? data.stats.last5DaysData 
            : [
                { date: '2025-09-24', users: 2, vendors: 1, day: 'Mon' },
                { date: '2025-09-25', users: 5, vendors: 2, day: 'Tue' },
                { date: '2025-09-26', users: 3, vendors: 0, day: 'Wed' },
                { date: '2025-09-27', users: 8, vendors: 3, day: 'Thu' },
                { date: '2025-09-28', users: 6, vendors: 1, day: 'Fri' }
              ]
        };
        setStats(statsWithDefaults);
        toast.success('Dashboard data loaded');
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
      
      setStats({
        totalUsers: 0,
        totalVendors: 0,
        totalOrders: 0,
        totalRevenue: 0,
        recentActivity: [],
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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
      case 'vendor': return 'text-chart-2';
      case 'user': return 'text-chart-1';
      case 'order': return 'text-chart-3';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-foreground">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FaTachometerAlt className="w-6 h-6 text-primary" />
                </div>
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor your platform's performance and growth
              </p>
            </div>
            <Button
              onClick={fetchDashboardData}
              disabled={loading}
              variant="outline"
              className="w-fit text-foreground border-border hover:bg-accent hover:text-accent-foreground"
            >
              <FaSync className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-chart-1/10 rounded-lg">
                    <FaUsers className="w-5 h-5 text-chart-1" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">
                      {stats.totalUsers?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-chart-2/10 rounded-lg">
                    <FaStore className="w-5 h-5 text-chart-2" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Vendors</p>
                    <p className="text-2xl font-bold">
                      {stats.totalVendors?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-chart-3/10 rounded-lg">
                    <FaShoppingCart className="w-5 h-5 text-chart-3" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">
                      {stats.totalOrders?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-chart-4/10 rounded-lg">
                    <FaDollarSign className="w-5 h-5 text-chart-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Growth Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <FaChartLine className="w-4 h-4 text-primary" />
                  </div>
                  Growth Analytics
                </CardTitle>
                <CardDescription>
                  Daily user and vendor registrations over the last 5 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  {stats.last5DaysData && stats.last5DaysData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={stats.last5DaysData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="vendorsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="2 4" 
                          stroke="hsl(var(--muted-foreground))"
                          opacity={0.3}
                        />
                        <XAxis 
                          dataKey="day" 
                          tick={{ 
                            fill: 'hsl(var(--muted-foreground))', 
                            fontSize: 12,
                            fontWeight: 500
                          }}
                          axisLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                          tickLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                        />
                        <YAxis 
                          tick={{ 
                            fill: 'hsl(var(--muted-foreground))', 
                            fontSize: 12,
                            fontWeight: 500
                          }}
                          axisLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                          tickLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                            color: 'hsl(var(--popover-foreground))',
                            fontSize: '14px'
                          }}
                          labelStyle={{ 
                            color: 'hsl(var(--popover-foreground))',
                            fontWeight: 600,
                            marginBottom: '4px'
                          }}
                          itemStyle={{
                            color: 'hsl(var(--popover-foreground))'
                          }}
                          cursor={{
                            stroke: 'hsl(var(--muted-foreground))',
                            strokeWidth: 1,
                            strokeDasharray: '4 4',
                            opacity: 0.5
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '14px'
                          }}
                          iconType="line"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stroke="hsl(var(--chart-1))" 
                          strokeWidth={3}
                          name="New Users"
                          fill="url(#usersGradient)"
                          dot={{ 
                            fill: 'hsl(var(--chart-1))', 
                            strokeWidth: 3, 
                            r: 5,
                            stroke: 'hsl(var(--card))'
                          }}
                          activeDot={{ 
                            r: 7, 
                            stroke: 'hsl(var(--chart-1))',
                            strokeWidth: 3,
                            fill: 'hsl(var(--card))',
                            shadow: true
                          }}
                          connectNulls={false}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="vendors" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={3}
                          name="New Vendors"
                          fill="url(#vendorsGradient)"
                          dot={{ 
                            fill: 'hsl(var(--chart-2))', 
                            strokeWidth: 3, 
                            r: 5,
                            stroke: 'hsl(var(--card))'
                          }}
                          activeDot={{ 
                            r: 7, 
                            stroke: 'hsl(var(--chart-2))',
                            strokeWidth: 3,
                            fill: 'hsl(var(--card))',
                            shadow: true
                          }}
                          connectNulls={false}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                      <div className="p-3 bg-muted/50 rounded-full">
                        <FaChartLine className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium">No growth data available</p>
                      <p className="text-xs">Check back once users start registering</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaEye className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest platform activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.error ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">Unable to load activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentActivity && stats.recentActivity.length > 0 ? (
                      stats.recentActivity.slice(0, 4).map((activity) => {
                        const IconComponent = getActivityIcon(activity.type);
                        return (
                          <div 
                            key={activity.id} 
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="mt-0.5">
                              <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center`}>
                                <IconComponent className={`w-4 h-4 ${getActivityColor(activity.type)}`} />
                              </div>
                            </div>
                            <div className="flex-1 space-y-1 min-w-0">
                              <p className="font-medium text-sm leading-tight">{activity.name}</p>
                              <p className="text-xs text-muted-foreground leading-tight">{activity.action}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {activity.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{activity.time}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No recent activity
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;