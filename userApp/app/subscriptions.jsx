import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { Colors, lightColors, darkColors, shadows, borderRadius } from '../constants/Colors';
import { getSubscriptions } from '../api/customerApi';

export default function SubscriptionsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSubscriptions();
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      setError('Failed to load subscriptions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (daysRemaining) => {
    if (daysRemaining > 7) return colors.success;
    if (daysRemaining > 0) return colors.warning;
    return colors.error;
  };

  // Helper function to safely convert MongoDB Decimal128 to number
  const safePrice = (plan) => {
    if (!plan || !plan.price) return 0;
    if (typeof plan.price === 'object' && plan.price.$numberDecimal) {
      return parseFloat(plan.price.$numberDecimal);
    }
    return typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading Subscriptions...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>My Subscriptions</ThemedText>
        </View>

        {error && (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        )}

        {subscriptions.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={colors.mutedForeground} />
            <ThemedText style={styles.emptyTitle}>No active subscriptions</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Start your meal journey by subscribing to a vendor's plan
            </ThemedText>
            <TouchableOpacity 
              style={[styles.browseButton, {backgroundColor: colors.primary}]}
              onPress={() => router.push('/market')}
            >
              <ThemedText style={{color: '#fff', fontWeight: '600'}}>Browse Vendors</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={subscriptions}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => {
              const daysRemaining = getDaysRemaining(item.end_date);
              const vendor = item.plan_id?.vendor_id || item.vendor_id;
              const planPrice = safePrice(item.plan_id);
              const planDuration = item.plan_id?.duration_days || 30;
              
              return (
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                  {/* Vendor Info Header */}
                  <View style={styles.vendorHeader}>
                    <View style={styles.avatarContainer}>
                      {vendor && vendor.profileImage ? (
                        <Ionicons name="person" size={24} color={colors.mutedForeground} />
                      ) : (
                        <Ionicons name="store" size={24} color={colors.mutedForeground} />
                      )}
                    </View>
                    <View style={styles.vendorInfo}>
                      <ThemedText style={styles.vendorName}>{vendor ? vendor.name : 'Vendor'}</ThemedText>
                      <View style={[styles.badge, {backgroundColor: colors.muted}]}>
                        <ThemedText style={styles.badgeText}>{item.plan_id?.name || 'Meal Plan'}</ThemedText>
                      </View>
                    </View>
                  </View>
                  
                  {/* Price and Duration */}
                  <View style={[styles.priceContainer, {backgroundColor: colors.muted + '30'}]}>
                    <View style={styles.priceInfo}>
                      <Ionicons name="cash-outline" size={20} color={colors.primary} style={styles.priceIcon} />
                      <ThemedText style={styles.price}>₹{planPrice}</ThemedText>
                    </View>
                    <View style={styles.durationInfo}>
                      <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
                      <ThemedText style={styles.duration}>{planDuration} days</ThemedText>
                    </View>
                  </View>
                  
                  {/* Meals */}
                  {item.plan_id?.selected_meals && item.plan_id.selected_meals.length > 0 && (
                    <View style={styles.mealsSection}>
                      <ThemedText style={styles.sectionTitle}>Included Meals:</ThemedText>
                      <View style={styles.mealsContainer}>
                        {item.plan_id.selected_meals.map((meal, idx) => (
                          <View key={idx} style={[styles.mealBadge, {backgroundColor: colors.muted}]}>
                            <ThemedText style={styles.mealText}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Dates */}
                  <View style={styles.datesSection}>
                    <View style={styles.dateRow}>
                      <ThemedText style={styles.dateLabel}>Started:</ThemedText>
                      <ThemedText style={styles.dateValue}>{formatDate(item.start_date)}</ThemedText>
                    </View>
                    <View style={styles.dateRow}>
                      <ThemedText style={styles.dateLabel}>Ends:</ThemedText>
                      <ThemedText style={styles.dateValue}>{formatDate(item.end_date)}</ThemedText>
                    </View>
                  </View>
                  
                  {/* Status */}
                  <View style={styles.statusSection}>
                    <ThemedText style={styles.statusLabel}>Status:</ThemedText>
                    <View style={[
                      styles.statusBadge, 
                      {backgroundColor: getStatusColor(daysRemaining) + '20'}
                    ]}>
                      <Ionicons 
                        name={daysRemaining > 0 ? "calendar-outline" : "alert-circle-outline"} 
                        size={16} 
                        color={getStatusColor(daysRemaining)} 
                        style={styles.statusIcon} 
                      />
                      <ThemedText style={[styles.statusText, {color: getStatusColor(daysRemaining)}]}>
                        {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                      </ThemedText>
                    </View>
                  </View>
                  
                  {/* Actions */}
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.outlineButton, {borderColor: colors.border}]}
                      onPress={() => router.push(`/vendors/${vendor?._id}`)}
                    >
                      <ThemedText>View Vendor</ThemedText>
                    </TouchableOpacity>
                    
                    {daysRemaining <= 3 && daysRemaining > 0 && (
                      <TouchableOpacity 
                        style={[styles.actionButton, {backgroundColor: colors.primary}]}
                        onPress={() => router.push(`/vendors/${vendor?._id}`)}
                      >
                        <ThemedText style={{color: '#fff'}}>Renew</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    padding: 20,
    color: '#E57373',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyDescription: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    opacity: 0.7,
  },
  browseButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  card: {
    borderRadius: 12,
    marginVertical: 8,
    padding: 16,
    ...shadows.md,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIcon: {
    marginRight: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    marginLeft: 4,
    fontSize: 14,
  },
  mealsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  mealsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  mealText: {
    fontSize: 12,
  },
  datesSection: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateLabel: {
    opacity: 0.7,
  },
  dateValue: {
    fontWeight: '500',
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  },
  statusLabel: {
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
});