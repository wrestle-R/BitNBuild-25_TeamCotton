import React, { useState, useEffect } from 'react';
import { 
  ActivityIndicator,
  StyleSheet, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Colors, lightColors, darkColors, shadows, borderRadius } from '../../constants/Colors';
import { getVendorById, getVendorPlans, getProfile } from '../../api/customerApi';

export default function VendorDetails() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  
  const [vendor, setVendor] = useState(null);
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [distance, setDistance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to calculate distance between two points (in km)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if ([lat1, lon1, lat2, lon2].some(v => v === undefined || v === null)) return null;

    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  // Helper to read coordinates from multiple shapes
  const readCoordinates = (addr) => {
    if (!addr) return null;
    // shape: { coordinates: [lng, lat] }
    if (Array.isArray(addr.coordinates) && addr.coordinates.length >= 2) {
      // GeoJSON style [lng, lat]
      return { lat: Number(addr.coordinates[1]), lng: Number(addr.coordinates[0]) };
    }
    // shape: { coordinates: { lat, lng } }
    if (addr.coordinates && typeof addr.coordinates.lat === 'number') {
      return { lat: addr.coordinates.lat, lng: addr.coordinates.lng };
    }
    // shape: { lat, lng }
    if (typeof addr.lat === 'number') {
      return { lat: addr.lat, lng: addr.lng };
    }
    return null;
  };

  // Helper function to safely convert MongoDB Decimal128 to number
  const safeNumberConversion = (value) => {
    if (!value) return 0;
    if (typeof value === 'object' && value.$numberDecimal) {
      return parseFloat(value.$numberDecimal);
    }
    return parseFloat(value) || 0;
  };
  
  // Helper function to get meal type icons
  const getMealPlanIcon = (meals) => {
    if (!meals || !Array.isArray(meals) || meals.length === 0) return '🍽️';
    const mealCount = meals.length;
    if (mealCount === 1) return '🍽️';
    if (mealCount === 2) return '🍽️🍽️';
    return '🍽️🍽️🍽️';
  };

  // Helper function to format meal types
  const formatMealTypes = (meals) => {
    if (!meals || !Array.isArray(meals)) return '';
    return meals.map(meal => meal.charAt(0).toUpperCase() + meal.slice(1)).join(', ');
  };

  // Helper function to get plan duration text
  const getPlanDurationText = (days) => {
    if (!days) return 'Plan';
    if (days === 1) return 'Daily Plan';
    if (days === 7) return 'Weekly Plan';
    if (days === 30) return 'Monthly Plan';
    return `${days} Days Plan`;
  };

  // Helper functions defined above

  // Get plan duration in short format
  const getPlanDurationShort = (days) => {
    if (!days) return 'Plan';
    if (days === 1) return 'Daily';
    if (days === 7) return 'Weekly';
    if (days === 30) return 'Monthly';
    return `${days} days`;
  };

  // safeNumberConversion has been defined above

  // Ensure the fetched vendor data is accurate and properly displayed
  useEffect(() => {
    async function fetchVendorDetails() {
      try {
        setLoading(true);
        setError(null);

        // Run these fetch operations in parallel to improve performance
        const [profileData, vendorData] = await Promise.all([
          // Fetch user profile for distance calculation
          getProfile().catch(profileErr => {
            // Profile may be protected; ignore failure and continue
            console.warn('Could not fetch profile for distance calculation', profileErr);
            return null;
          }),
          // Fetch vendor details by ID
          getVendorById(id)
        ]);

        // Save profile and vendor to state
        setProfile(profileData);
        setVendor(vendorData);

        // Fetch meal plans if vendor has plans count
        if (vendorData && typeof vendorData.plans === 'number' && vendorData.plans > 0) {
          setPlansLoading(true);
          try {
            const plansData = await getVendorPlans(id);
            console.log('Fetched meal plans:', plansData);
            setMealPlans(Array.isArray(plansData) ? plansData : []);
          } catch (planError) {
            console.error('Error fetching meal plans:', planError);
            // Don't set error state for plans - just show empty state
          } finally {
            setPlansLoading(false);
          }
        }

        // Calculate distance if both vendor and user coordinates are available
        if (profileData && vendorData) {
          // Log the structure of the address data for debugging
          console.log('Vendor address:', JSON.stringify(vendorData.address));
          console.log('User address:', profileData.address ? JSON.stringify(profileData.address) : 'No user address');

          const vendorCoords = vendorData.address ? readCoordinates(vendorData.address) : null;
          const userCoords = profileData.address ? readCoordinates(profileData.address) : null;
          
          console.log('Vendor coordinates:', vendorCoords);
          console.log('User coordinates:', userCoords);
          
          if (vendorCoords && userCoords) {
            const dist = calculateDistance(
              userCoords.lat, userCoords.lng, 
              vendorCoords.lat, vendorCoords.lng
            );
            console.log('Calculated distance:', dist);
            if (dist !== null && !isNaN(dist)) {
              setDistance(dist);
              console.log('Distance set successfully:', dist);
            }
          } else {
            console.log('Missing coordinates for distance calculation');
            
            // Try alternate coordinate formats if direct access failed
            if (vendorData.address && profileData.address) {
              console.log('Attempting alternate coordinate formats');
              
              // Try to access nested coordinate structures
              let vLat, vLng, uLat, uLng;
              
              // Vendor coordinates fallbacks
              if (vendorData.address.coordinates) {
                if (Array.isArray(vendorData.address.coordinates)) {
                  vLng = Number(vendorData.address.coordinates[0]);
                  vLat = Number(vendorData.address.coordinates[1]);
                } else if (vendorData.address.coordinates.lat) {
                  vLat = Number(vendorData.address.coordinates.lat);
                  vLng = Number(vendorData.address.coordinates.lng);
                }
              } else if (vendorData.address.lat) {
                vLat = Number(vendorData.address.lat);
                vLng = Number(vendorData.address.lng);
              }
              
              // User coordinates fallbacks
              if (profileData.address.coordinates) {
                if (Array.isArray(profileData.address.coordinates)) {
                  uLng = Number(profileData.address.coordinates[0]);
                  uLat = Number(profileData.address.coordinates[1]);
                } else if (profileData.address.coordinates.lat) {
                  uLat = Number(profileData.address.coordinates.lat);
                  uLng = Number(profileData.address.coordinates.lng);
                }
              } else if (profileData.address.lat) {
                uLat = Number(profileData.address.lat);
                uLng = Number(profileData.address.lng);
              }
              
              console.log('Fallback coordinates:', { vLat, vLng, uLat, uLng });
              
              // Try calculating with fallback values
              if (vLat && vLng && uLat && uLng) {
                const dist = calculateDistance(uLat, uLng, vLat, vLng);
                console.log('Fallback calculated distance:', dist);
                if (dist !== null && !isNaN(dist)) {
                  setDistance(dist);
                }
              }
            }
          }
        } else {
          console.log('Missing profile or vendor data for distance calculation');
        }
      } catch (err) {
        console.error('Error fetching vendor details:', err);
        // Surface backend response if available
        const message = err.message || 'Could not load vendor details. Please try again later.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchVendorDetails();
  }, [id]);

  // Function to handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Fetch vendor details and profile again
      const [profileData, vendorData] = await Promise.all([
        getProfile().catch(() => null),
        getVendorById(id)
      ]);
      
      setProfile(profileData);
      setVendor(vendorData);
      
      // Calculate distance
      if (profileData && vendorData) {
        const vendorCoords = vendorData.address ? readCoordinates(vendorData.address) : null;
        const userCoords = profileData.address ? readCoordinates(profileData.address) : null;
        
        if (vendorCoords && userCoords) {
          const dist = calculateDistance(
            userCoords.lat, userCoords.lng, 
            vendorCoords.lat, vendorCoords.lng
          );
          if (dist !== null && !isNaN(dist)) {
            setDistance(dist);
          }
        }
      }
      
      // Fetch meal plans
      if (vendorData && vendorData.plans > 0) {
        try {
          const plansData = await getVendorPlans(id);
          setMealPlans(Array.isArray(plansData) ? plansData : []);
        } catch (error) {
          console.error('Failed to refresh meal plans:', error);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh vendor details');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Helper function to handle subscribe action
  const handleSubscribe = (planId) => {
    Alert.alert(
      'Subscribe to Plan',
      'Subscription feature coming soon!',
      [{ text: 'OK' }]
    );
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading Vendor Details...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !vendor) {
    return (
      <ThemedView style={styles.container}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <ThemedText style={styles.errorText}>{error || 'Vendor not found'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Vendor Header with Image */}
        <View style={styles.header}>
          <Image
            source={{ 
              uri: vendor.profileImage || vendor.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop' 
            }}
            style={styles.vendorImage}
          />
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={[
            styles.headerOverlay, 
            { backgroundColor: 'rgba(0,0,0,0.3)' }
          ]}>
            <View>
              <ThemedText style={styles.vendorName}>
                {vendor.name}
              </ThemedText>
              
              <View style={styles.ratingContainer}>
                <View style={[
                  styles.ratingBadge, 
                  { backgroundColor: vendor.rating >= 4.0 ? '#388E3C' : '#F57C00' }
                ]}>
                  <Ionicons name="star" size={16} color="white" />
                  <ThemedText style={styles.ratingText}>
                    {vendor.rating}
                  </ThemedText>
                </View>
                {vendor.reviewCount !== undefined && (
                  <ThemedText style={styles.reviewCount}>
                    {vendor.reviewCount} reviews
                  </ThemedText>
                )}
              </View>
              
              <ThemedText style={styles.cuisineText}>
                {vendor.specialty === 'veg' ? 'Vegetarian • Pure Veg' : 'Non-Vegetarian • Multi Cuisine'}
              </ThemedText>
            </View>
          </View>
        </View>
        
        {/* Vendor Info */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          <ThemedText style={styles.description}>{vendor.description || 'No description provided for this vendor.'}</ThemedText>
          
          <View style={styles.detailsGrid}>
            {/* <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <ThemedText style={styles.detailText}>
                Delivery: {vendor.deliveryTime || '30-45'} mins
              </ThemedText>
            </View> */}
            
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <ThemedText style={styles.detailText}>
                Contact: {vendor.contactNumber || '1234567890'}
              </ThemedText>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <ThemedText style={styles.detailText}>
                {distance !== null && !isNaN(distance) ? `${distance.toFixed(1)} km away` : 'Distance not available'}
              </ThemedText>
            </View>
            
            {vendor.address && (
              <View style={styles.detailItem}>
                <Ionicons name="home-outline" size={20} color={colors.primary} />
                <ThemedText style={styles.detailText} numberOfLines={2}>
                  {[vendor.address.street, vendor.address.city, vendor.address.state, vendor.address.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </ThemedText>
              </View>
            )}
            
          </View>
        </View>
        
        {/* Meal Plans */}
        <View style={styles.plansSection}>
          <ThemedText style={styles.sectionTitle}>
            Meal Plans {vendor.plans > 0 ? `(${vendor.plans})` : ''}
          </ThemedText>
          
          {plansLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <ThemedText style={[styles.loadingText, {marginTop: 10}]}>Loading Plans...</ThemedText>
            </View>
          ) : (!Array.isArray(mealPlans) || mealPlans.length === 0) ? (
            <ThemedText style={styles.noPlansText}>
              No meal plans available at the moment.
            </ThemedText>
          ) : (
            mealPlans.map((plan) => (
              <View 
                key={plan._id} 
                style={[
                  styles.planCard, 
                  { backgroundColor: colors.card, ...shadows.sm }
                ]}
              >
                <View style={styles.planHeader}>
                  <View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <ThemedText style={{fontSize: 22, marginRight: 8}}>
                        {getMealPlanIcon(plan.selected_meals)}
                      </ThemedText>
                      <ThemedText style={styles.planName}>{plan.name}</ThemedText>
                    </View>
                    <ThemedText style={styles.planDuration}>
                      {getPlanDurationText(plan.duration || plan.duration_days)}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.priceContainer}>
                    <ThemedText style={styles.price}>
                      ₹{safeNumberConversion(plan.price)}
                    </ThemedText>
                    <ThemedText style={styles.perMeal}>
                      Total for {plan.duration || plan.duration_days} {(plan.duration || plan.duration_days) === 1 ? 'day' : 'days'}
                    </ThemedText>
                    {(plan.duration || plan.duration_days) > 1 && (
                      <ThemedText style={[styles.perDay, {color: colors.primary}]}>
                        ₹{Math.round(safeNumberConversion(plan.price) / (plan.duration || plan.duration_days))} per day
                      </ThemedText>
                    )}
                    <ThemedText style={styles.perMeal}>
                      (₹{(safeNumberConversion(plan.price) / ((plan.duration || plan.duration_days || 30) * (plan.mealsPerDay || plan.meals_per_day || 2))).toFixed(0)}/meal)
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.planDetails}>
                  <View style={[styles.planDetailRow, {backgroundColor: colors.muted + '30', borderRadius: 8, padding: 8, marginBottom: 6}]}>
                    <ThemedText style={{fontSize: 14, fontWeight: '500'}}>Duration</ThemedText>
                    <View style={styles.planBadge}>
                      <ThemedText style={{color: colors.card, fontWeight: '500'}}>
                        {plan.duration || plan.duration_days} {(plan.duration || plan.duration_days) === 1 ? 'day' : 'days'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.planDetailRow, {backgroundColor: colors.muted + '30', borderRadius: 8, padding: 8, marginBottom: 6}]}>
                    <ThemedText style={{fontSize: 14, fontWeight: '500'}}>Meals</ThemedText>
                    <ThemedText style={{fontWeight: '500'}}>
                      {plan.selected_meals && plan.selected_meals.length > 0 ?
                        formatMealTypes(plan.selected_meals) : 
                        'Standard meals'}
                    </ThemedText>
                  </View>

                  <View style={[styles.planDetailRow, {backgroundColor: colors.muted + '30', borderRadius: 8, padding: 8, marginBottom: 6}]}>
                    <ThemedText style={{fontSize: 14, fontWeight: '500'}}>Per Day</ThemedText>
                    <ThemedText style={{fontWeight: '500'}}>
                      {plan.mealsPerDay || plan.meals_per_day || 2} meal{(plan.mealsPerDay || plan.meals_per_day || 2) > 1 ? 's' : ''}
                    </ThemedText>
                  </View>
                  
                  {vendor.specialty && (
                    <View style={styles.planDetailItem}>
                      <Ionicons 
                        name={vendor.specialty === 'veg' ? 'leaf-outline' : 'fast-food-outline'} 
                        size={16} 
                        color={colors.primary} 
                      />
                      <ThemedText style={styles.planDetailText}>
                        {vendor.specialty === 'veg' ? 'Vegetarian' : 'Non-veg options'}
                      </ThemedText>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    { backgroundColor: colors.primary }
                  ]}
                  onPress={() => {
                    Alert.alert(
                      'Subscription',
                      'Subscription feature coming soon!',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <Ionicons name="cart-outline" size={18} color="white" style={{marginRight: 8}} />
                  <ThemedText style={styles.subscribeButtonText}>Subscribe Now</ThemedText>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  errorText: {
    textAlign: 'center',
    padding: 20,
    color: '#E57373',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    position: 'relative',
    height: 200,
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: Platform.OS === 'ios' ? 60 : 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  vendorName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  ratingText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  reviewCount: {
    color: 'white',
    marginLeft: 8,
  },
  cuisineText: {
    color: 'white',
    marginTop: 4,
  },
  infoSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 8,
  },
  plansSection: {
    padding: 16,
    paddingTop: 8,
  },
  noPlansText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  planCard: {
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planDuration: {
    opacity: 0.7,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  perMeal: {
    fontSize: 12,
    opacity: 0.7,
  },
  planDetails: {
    marginBottom: 16,
  },
  planDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planDetailText: {
    marginLeft: 8,
  },
  subscribeButton: {
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});