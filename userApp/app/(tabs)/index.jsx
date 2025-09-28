import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Image,
  RefreshControl,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { StatCard } from '../../components/StatCard';
import { QuickActionButton } from '../../components/QuickActionButton';
import { ActivityItem } from '../../components/ActivityItem';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useColorScheme } from '../../hooks/useColorScheme';
import { lightColors, darkColors, shadows, spacing } from '../../constants/Colors';
import { getDashboardData, getDashboardActivity, getProfile, getSubscriptions } from '../../api/customerApi';
import { auth } from '../../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import '../../global.css';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState(null);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const mutedColor = useThemeColor({}, 'mutedForeground');
  const isDark = colorScheme === 'dark';

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('Please log in to view dashboard');
        return;
      }

      // Fetch dashboard data, activity, profile, and subscriptions in parallel
      console.log('🔄 Starting API calls for user:', currentUser.email);
      
      const [dashData, activityData, profileData, subscriptionsData] = await Promise.all([
        getDashboardData().then(data => {
          console.log('✅ Dashboard API Response:', JSON.stringify(data, null, 2));
          return data;
        }).catch(err => {
          console.log('❌ Dashboard data error:', err.message);
          console.error('Dashboard API full error:', err);
          return null;
        }),
        getDashboardActivity().then(data => {
          console.log('✅ Activity API Response:', JSON.stringify(data, null, 2));
          return data;
        }).catch(err => {
          console.log('❌ Activity data error:', err.message);
          console.error('Activity API full error:', err);
          return [];
        }),
        getProfile().then(data => {
          console.log('✅ Profile API Response:', JSON.stringify(data, null, 2));
          return data;
        }).catch(err => {
          console.log('❌ Profile data error:', err.message);
          console.error('Profile API full error:', err);
          return null;
        }),
        getSubscriptions().then(data => {
          console.log('✅ Subscriptions API Response:', JSON.stringify(data, null, 2));
          return data;
        }).catch(err => {
          console.log('❌ Subscriptions data error:', err.message);
          console.error('Subscriptions API full error:', err);
          return [];
        })
      ]);

      // Use profile data or Firebase auth data for user info
      const userData = profileData || {
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        email: currentUser.email,
        profileImage: currentUser.photoURL || profileData?.profileImage
      };

      setUser(userData);
      
      // Store subscriptions data for potential use
      const subscriptionsArray = Array.isArray(subscriptionsData) ? subscriptionsData : [];
      setSubscriptions(subscriptionsArray);

      // Set dashboard data - prioritize backend data, fallback to subscription calculation
      console.log('📊 Processing dashboard data...');
      console.log('Dashboard data received:', dashData);
      console.log('Dashboard stats:', dashData?.stats);
      console.log('Subscriptions data:', subscriptionsArray);
      
      if (dashData && dashData.stats) {
        // Use real backend stats
        console.log('✅ Using backend dashboard stats:', dashData.stats);
        setDashboardData(dashData);
      } else {
        console.log('⚠️ Backend dashboard not available, calculating from subscriptions');
        console.log('Subscriptions array length:', subscriptionsArray.length);
        console.log('Individual subscriptions:', subscriptionsArray.map(sub => ({
          id: sub._id || sub.id,
          status: sub.status,
          amount: sub.amount || sub.totalAmount || sub.price,
          planName: sub.planName,
          vendorName: sub.vendorName
        })));
        
        // Fallback: Calculate stats from subscriptions if backend doesn't provide dashboard
        const activeSubscriptions = subscriptionsArray.filter(sub => {
          const isActive = sub.status === 'active' || sub.status === 'Active';
          console.log(`Subscription ${sub._id || 'unknown'} status: ${sub.status}, isActive: ${isActive}`);
          return isActive;
        });
        
        const completedSubscriptions = subscriptionsArray.filter(sub => {
          const isCompleted = sub.status === 'completed' || sub.status === 'Completed' || sub.status === 'finished';
          console.log(`Subscription ${sub._id || 'unknown'} status: ${sub.status}, isCompleted: ${isCompleted}`);
          return isCompleted;
        });
        
        // Calculate total spent from subscriptions
        const totalSpent = subscriptionsArray.reduce((total, sub) => {
          const amount = parseFloat(sub.amount || sub.totalAmount || sub.price || 0);
          console.log(`Subscription ${sub._id || 'unknown'} amount: ${amount}`);
          return total + amount;
        }, 0);

        console.log('📈 Calculated stats:');
        console.log('- Active subscriptions:', activeSubscriptions.length);
        console.log('- Completed subscriptions:', completedSubscriptions.length);
        console.log('- Total subscriptions:', subscriptionsArray.length);
        console.log('- Total spent:', totalSpent);

        // Fallback dashboard data
        const fallbackData = {
          customer: userData,
          stats: {
            activeSubscriptions: activeSubscriptions.length,
            totalSpent: totalSpent.toFixed(2),
            completedSubscriptions: completedSubscriptions.length,
            totalSubscriptions: subscriptionsArray.length
          },
          notifications: [
            {
              id: 1,
              title: 'Welcome to NourishNet!',
              message: `You have ${activeSubscriptions.length} active subscription${activeSubscriptions.length !== 1 ? 's' : ''}`,
              type: 'info'
            }
          ],
          activeSubscriptions: activeSubscriptions,
          nearbyVendors: []
        };
        
        console.log('📋 Final fallback dashboard data:', fallbackData);
        setDashboardData(fallbackData);
      }

      // Set activity data - prioritize backend data
      if (activityData && activityData.length > 0) {
        console.log('Using backend activity data:', activityData.length, 'items');
        setRecentActivity(activityData);
      } else if (subscriptionsArray.length > 0) {
        console.log('Generating activity from subscriptions');
        // Generate activity from recent subscriptions as fallback
        const recentSubs = subscriptionsArray
          .slice(0, 3) // Take latest 3 subscriptions
          .map((sub, index) => ({
            id: `sub-${sub._id || index}`,
            type: 'subscription',
            title: `Subscribed to ${sub.planName || 'Meal Plan'}`,
            description: `From ${sub.vendorName || sub.vendor?.name || 'Vendor'}`,
            timestamp: new Date(sub.createdAt || sub.startDate || Date.now() - index * 24 * 60 * 60 * 1000),
            status: sub.status?.toLowerCase() || 'active'
          }));
        
        setRecentActivity(recentSubs);
      } else {
        console.log('No data available, showing welcome message');
        // Fallback welcome activity
        setRecentActivity([
          {
            id: 1,
            type: 'subscription',
            title: 'Welcome to NourishNet!',
            description: 'Your account has been created successfully. Start exploring meal plans!',
            timestamp: new Date(),
            status: 'success'
          }
        ]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchDashboardData();
      } else {
        setLoading(false);
        setUser(null);
        setDashboardData(null);
        setRecentActivity([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const StatCardIcon = ({ name, size = 24, color = 'white' }) => (
    <Ionicons name={name} size={size} color={color} />
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={mutedColor} />
          <ThemedText style={styles.errorTitle}>Oops! Something went wrong</ThemedText>
          <ThemedText style={[styles.errorMessage, { color: mutedColor }]}>{error}</ThemedText>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => fetchDashboardData()}
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No user state
  if (!user || !dashboardData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle" size={48} color={mutedColor} />
          <ThemedText style={styles.errorTitle}>Please log in</ThemedText>
          <ThemedText style={[styles.errorMessage, { color: mutedColor }]}>
            Log in to view your dashboard
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <ThemedView style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <ThemedText type="title" style={styles.welcomeTitle}>
                Welcome back, {user.name || 'User'}!
              </ThemedText>
              <ThemedText style={[styles.welcomeSubtitle, { color: mutedColor }]}>
                Here's what's happening with your meals
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              <View style={[styles.avatar, shadows.sm]}>
                {user.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={24} color={mutedColor} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Notifications */}
        {dashboardData.notifications && dashboardData.notifications.length > 0 && (
          <ThemedView style={styles.section}>
            <View style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <Ionicons name="notifications" size={20} color="white" />
                <ThemedText style={styles.notificationTitle}>
                  {dashboardData.notifications[0].title || 'Latest Update'}
                </ThemedText>
              </View>
              <ThemedText style={styles.notificationMessage}>
                {dashboardData.notifications[0].message}
              </ThemedText>
            </View>
          </ThemedView>
        )}

        {/* Stats Cards */}
        <ThemedView style={styles.section}>
          <View style={styles.statsGrid}>
            <StatCard
              title="Active Plans"
              value={dashboardData.stats.activeSubscriptions}
              icon={(props) => <StatCardIcon name="restaurant" {...props} />}
              iconBgColor="#3b82f6"
              style={styles.statCard}
            />
            <StatCard
              title="Total Spent"
              value={`₹${dashboardData.stats.totalSpent}`}
              icon={(props) => <StatCardIcon name="wallet" {...props} />}
              iconBgColor="#22c55e"
              style={styles.statCard}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Completed"
              value={dashboardData.stats.completedSubscriptions}
              icon={(props) => <StatCardIcon name="checkmark-circle" {...props} />}
              iconBgColor="#8b5cf6"
              style={styles.statCard}
            />
            <StatCard
              title="Total Plans"
              value={dashboardData.stats.totalSubscriptions}
              icon={(props) => <StatCardIcon name="calendar" {...props} />}
              iconBgColor="#f59e0b"
              style={styles.statCard}
            />
          </View>
        </ThemedView>

        {/* Quick Actions */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              title="Browse Vendors"
              icon={(props) => <Ionicons name="storefront" {...props} />}
              variant="primary"
              style={styles.quickActionButton}
              onPress={() => router.push('/market')}
            />
            <QuickActionButton
              title="My Subscriptions"
              icon={(props) => <Ionicons name="list-circle" {...props} />}
              variant="outline"
              style={styles.quickActionButton}
              onPress={() => router.push('/subscriptions')}
            />
            <QuickActionButton
              title="My Profile"
              icon={(props) => <Ionicons name="person" {...props} />}
              variant="outline"
              style={styles.quickActionButton}
              onPress={() => router.push('/profile')}
            />
          </View>
        </ThemedView>

        {/* Recent Activity */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent Activity
          </ThemedText>
          <View style={styles.activityList}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  title={activity.title}
                  description={activity.description}
                  timestamp={activity.timestamp}
                  status={activity.status}
                  icon={(props) => (
                    <Ionicons 
                      name={activity.type === 'payment' ? 'card' : 'restaurant'} 
                      {...props} 
                    />
                  )}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time" size={32} color={mutedColor} />
                <ThemedText style={[styles.emptyStateText, { color: mutedColor }]}>
                  No recent activity
                </ThemedText>
              </View>
            )}
          </View>
        </ThemedView>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  profileButton: {
    padding: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  notificationCard: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    ...shadows.sm,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: spacing.xs,
  },
  notificationMessage: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionButton: {
    flex: 1,
  },
  activityList: {
    gap: 0, // Gap is handled by ActivityItem component
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
