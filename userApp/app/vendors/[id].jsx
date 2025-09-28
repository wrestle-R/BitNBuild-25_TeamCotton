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
  RefreshControl,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Colors, lightColors, darkColors, shadows, borderRadius } from '../../constants/Colors';
import { getVendorById, getVendorPlans, getProfile, getPlanMenus, createOrder, verifyPayment } from '../../api/customerApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VendorDetails() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  
  const [vendor, setVendor] = useState(null);
  const [mealPlans, setMealPlans] = useState([]);
  const [planMenus, setPlanMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [distance, setDistance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

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

        // Always try to fetch meal plans and menus, even if vendor.plans count is 0 or undefined
        setPlansLoading(true);
        try {
          const plansData = await getVendorPlans(id);
          console.log('Fetched meal plans:', plansData);
          console.log('Plans data type:', typeof plansData);
          console.log('Is array?', Array.isArray(plansData));
          console.log('Length:', plansData ? (Array.isArray(plansData) ? plansData.length : 'Not an array') : 'No data');
          setMealPlans(Array.isArray(plansData) ? plansData : []);
        } catch (planError) {
          console.error('Error fetching meal plans:', planError);
          // Don't set error state for plans - just show empty state
        } finally {
          setPlansLoading(false);
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
  
  // Function to fetch menus for a specific plan
  const fetchPlanMenus = async (planId) => {
    try {
      setLoadingMenus(true);
      const menusData = await getPlanMenus(planId, id);
      setPlanMenus(Array.isArray(menusData) ? menusData : []);
    } catch (menuError) {
      console.error('Error fetching plan menus:', menuError);
      setPlanMenus([]); // Set empty array if menu fetch fails
    } finally {
      setLoadingMenus(false);
    }
  };
  
  // Helper function to handle subscribe action
  const handleSubscribe = async (plan) => {
    // Simply redirect to vendor plans page for payment
    handleCloseModal();
    router.push(`/vendor-plans/${id}`);
  };
  
  // Function to handle phone call
  const handleCallVendor = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Error', 'Phone calls are not supported on this device');
          return;
        }
        return Linking.openURL(phoneUrl);
      })
      .catch(err => console.error('Error making phone call:', err));
  };

  // Function to handle showing plan details
  const handleViewPlanDetails = (plan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
    // Fetch menus for this specific plan
    if (plan._id) {
      fetchPlanMenus(plan._id);
    }
  };

  // Function to close plan details modal
  const handleCloseModal = () => {
    setShowPlanModal(false);
    setSelectedPlan(null);
    setPlanMenus([]); // Clear plan-specific menus
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
            resizeMode="cover"
          />
          {/* <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity> */}
          
          <View style={[
            styles.headerOverlay, 
            { 
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderTopRightRadius: 12,
              borderTopLeftRadius: 12,
            }
          ]}>
            <View>
              <ThemedText style={styles.vendorName}>
                {vendor.name}
              </ThemedText>
              
              <View style={styles.ratingContainer}>
                <View style={[
                  styles.ratingBadge, 
                  { backgroundColor: vendor.rating >= 4.0 ? '#388E3C' : vendor.rating >= 3.0 ? '#F57C00' : '#D32F2F' }
                ]}>
                  <Ionicons name="star" size={16} color="white" />
                  <ThemedText style={styles.ratingText}>
                    {vendor.rating || '4.2'}
                  </ThemedText>
                </View>
                <ThemedText style={styles.reviewCount}>
                  {vendor.reviewCount || '200+'} reviews
                </ThemedText>
              </View>
              
              <View style={styles.tagContainer}>
                {vendor.specialty === 'veg' ? (
                  <View style={styles.tagBadge}>
                    <Ionicons name="leaf" size={14} color="#4CAF50" />
                    <ThemedText style={[styles.tagText, {color: '#4CAF50'}]}>Pure Veg</ThemedText>
                  </View>
                ) : (
                  <View style={styles.tagBadge}>
                    <Ionicons name="fast-food" size={14} color="#FF9800" />
                    <ThemedText style={[styles.tagText, {color: '#FF9800'}]}>Multi Cuisine</ThemedText>
                  </View>
                )}
                
                <View style={styles.tagBadge}>
                  <Ionicons name="time" size={14} color={colors.primary} />
                  <ThemedText style={[styles.tagText, {color: colors.primary}]}>30-40 min</ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* Vendor Info */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          <ThemedText style={styles.description}>{vendor.description || 'No description provided for this vendor.'}</ThemedText>
          
          <View style={styles.detailsGrid}>
            {/* Distance info */}
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <Ionicons name="location-outline" size={22} color={colors.primary} />
              <View style={styles.infoCardContent}>
                <ThemedText style={styles.infoCardTitle}>Distance</ThemedText>
                <ThemedText style={styles.infoCardValue}>
                  {distance !== null && !isNaN(distance) ? `${distance.toFixed(1)} km away` : 'Not available'}
                </ThemedText>
              </View>
            </View>
            
            {/* Contact info with call button */}
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <Ionicons name="call-outline" size={22} color={colors.primary} />
              <View style={styles.infoCardContent}>
                <ThemedText style={styles.infoCardTitle}>Contact</ThemedText>
                <ThemedText style={styles.infoCardValue}>
                  {vendor.contactNumber || 'Not available'}
                </ThemedText>
              </View>
              {vendor.contactNumber && (
                <TouchableOpacity 
                  style={[styles.callButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleCallVendor(vendor.contactNumber)}
                >
                  <Ionicons name="call" size={18} color="white" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Address info */}
            {vendor.address && (
              <View style={[styles.infoCard, { backgroundColor: colors.card, width: '100%' }]}>
                <Ionicons name="home-outline" size={22} color={colors.primary} />
                <View style={styles.infoCardContent}>
                  <ThemedText style={styles.infoCardTitle}>Address</ThemedText>
                  <ThemedText style={styles.infoCardValue} numberOfLines={2}>
                    {[vendor.address.street, vendor.address.city, vendor.address.state, vendor.address.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </ThemedText>
                </View>
              </View>
            )}
            
          </View>
        </View>
        
        {/* Meal Plans */}
        <View style={styles.plansSection}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
            <ThemedText style={styles.sectionTitle}>
              Meal Plans {vendor.plans > 0 ? `(${vendor.plans})` : ''}
            </ThemedText>
            
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: colors.primary,
                borderRadius: 16,
              }}
              onPress={() => router.push(`/vendor-plans/${id}`)}
            >
              <ThemedText style={{ color: colors.primary, fontWeight: '500' }}>View All Plans</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
          
          {plansLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <ThemedText style={[styles.loadingText, {marginTop: 10}]}>Loading Plans...</ThemedText>
            </View>
          ) : (!Array.isArray(mealPlans) || mealPlans.length === 0) ? (
            <View>
              <ThemedText style={styles.noPlansText}>
                No meal plans available at the moment.
              </ThemedText>
              <TouchableOpacity
                style={[styles.viewPlansButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/vendor-plans/${id}`)}
              >
                <ThemedText style={{ color: 'white', fontWeight: '600' }}>Check Available Plans</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            mealPlans.map((plan) => (
              <TouchableOpacity 
                key={plan._id}
                style={[
                  styles.planCard, 
                  { backgroundColor: colors.card }
                ]}
                onPress={() => handleViewPlanDetails(plan)}
                activeOpacity={0.7}
              >
                {/* Plan Header with ribbon design */}
                <View style={styles.planHeader}>
                  <View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <View style={[styles.mealIconContainer, {backgroundColor: colors.primary + '20'}]}>
                        <ThemedText style={{fontSize: 20}}>
                          {getMealPlanIcon(plan.selected_meals)}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.planName}>{plan.name}</ThemedText>
                    </View>
                    <ThemedText style={styles.planDuration}>
                      {getPlanDurationText(plan.duration || plan.duration_days)}
                    </ThemedText>
                  </View>
                  
                  <View style={[
                    styles.priceContainer,
                    { backgroundColor: colors.primary + '15', borderRadius: 8, padding: 8 }
                  ]}>
                    <ThemedText style={[styles.price, {color: colors.primary}]}>
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
                
                {/* Plan details with better styling */}
                <View style={styles.planDetails}>
                  {/* Duration */}
                  <View style={styles.planDetailRow}>
                    <View style={styles.planDetailIconContainer}>
                      <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    </View>
                    <ThemedText style={styles.planDetailLabel}>Duration</ThemedText>
                    <ThemedText style={styles.planDetailValue}>
                      {plan.duration || plan.duration_days} {(plan.duration || plan.duration_days) === 1 ? 'day' : 'days'}
                    </ThemedText>
                  </View>

                  {/* Meals */}
                  <View style={styles.planDetailRow}>
                    <View style={styles.planDetailIconContainer}>
                      <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
                    </View>
                    <ThemedText style={styles.planDetailLabel}>Meals</ThemedText>
                    <ThemedText style={styles.planDetailValue}>
                      {plan.selected_meals && plan.selected_meals.length > 0 ?
                        formatMealTypes(plan.selected_meals) : 
                        'Standard meals'}
                    </ThemedText>
                  </View>

                  {/* Per Day */}
                  <View style={styles.planDetailRow}>
                    <View style={styles.planDetailIconContainer}>
                      <Ionicons name="time-outline" size={18} color={colors.primary} />
                    </View>
                    <ThemedText style={styles.planDetailLabel}>Per Day</ThemedText>
                    <ThemedText style={styles.planDetailValue}>
                      {plan.mealsPerDay || plan.meals_per_day || 2} meal{(plan.mealsPerDay || plan.meals_per_day || 2) > 1 ? 's' : ''}
                    </ThemedText>
                  </View>
                  
                  {/* Food Type */}
                  {vendor.specialty && (
                    <View style={styles.planDetailRow}>
                      <View style={styles.planDetailIconContainer}>
                        <Ionicons 
                          name={vendor.specialty === 'veg' ? 'leaf' : 'fast-food'} 
                          size={18} 
                          color={vendor.specialty === 'veg' ? '#4CAF50' : '#FF9800'} 
                        />
                      </View>
                      <ThemedText style={styles.planDetailLabel}>Type</ThemedText>
                      <ThemedText style={[
                        styles.planDetailValue,
                        { color: vendor.specialty === 'veg' ? '#4CAF50' : '#FF9800' }
                      ]}>
                        {vendor.specialty === 'veg' ? 'Vegetarian' : 'Non-veg options'}
                      </ThemedText>
                    </View>
                  )}
                </View>
                
                {/* Subscribe button with gradient-like effect */}
                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    { backgroundColor: colors.primary }
                  ]}
                  onPress={() => router.push(`/vendor-plans/${id}`)}
                >
                  <Ionicons name="cart-outline" size={18} color="white" style={{marginRight: 8}} />
                  <ThemedText style={styles.subscribeButtonText}>Subscribe Now</ThemedText>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Plan Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPlanModal}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalTitle}>
                  {selectedPlan?.name || 'Plan Details'}
                </ThemedText>
                <ThemedText style={[styles.modalSubtitle, { color: colors.text + '80' }]}>
                  Complete plan information
                </ThemedText>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {selectedPlan && (
                <>
                  {/* Plan Summary Card */}
                  <View style={[styles.modalPlanCard, { backgroundColor: colors.primary + '10' }]}>
                    <View style={styles.modalPlanHeader}>
                      <View style={styles.modalPlanIcon}>
                        <ThemedText style={styles.modalPlanIconText}>
                          {getMealPlanIcon(selectedPlan.selected_meals)}
                        </ThemedText>
                      </View>
                      <View style={styles.modalPlanInfo}>
                        <ThemedText style={styles.modalPlanName}>{selectedPlan.name}</ThemedText>
                        <ThemedText style={[styles.modalPlanDuration, { color: colors.text + '80' }]}>
                          {getPlanDurationText(selectedPlan.duration || selectedPlan.duration_days)}
                        </ThemedText>
                      </View>
                      <View style={styles.modalPriceContainer}>
                        <ThemedText style={[styles.modalPrice, { color: colors.primary }]}>
                          ₹{safeNumberConversion(selectedPlan.price)}
                        </ThemedText>
                        <ThemedText style={[styles.modalPriceLabel, { color: colors.text + '60' }]}>
                          Total
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Detailed Information */}
                  <View style={styles.modalDetailsSection}>
                    <ThemedText style={[styles.modalSectionTitle, { color: colors.primary }]}>
                      Plan Details
                    </ThemedText>
                    
                    {/* Duration */}
                    <View style={styles.modalDetailRow}>
                      <View style={[styles.modalDetailIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.modalDetailInfo}>
                        <ThemedText style={styles.modalDetailLabel}>Duration</ThemedText>
                        <ThemedText style={[styles.modalDetailValue, { color: colors.text }]}>
                          {selectedPlan.duration || selectedPlan.duration_days} {(selectedPlan.duration || selectedPlan.duration_days) === 1 ? 'day' : 'days'}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Meals per day */}
                    <View style={styles.modalDetailRow}>
                      <View style={[styles.modalDetailIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.modalDetailInfo}>
                        <ThemedText style={styles.modalDetailLabel}>Meals per day</ThemedText>
                        <ThemedText style={[styles.modalDetailValue, { color: colors.text }]}>
                          {selectedPlan.mealsPerDay || selectedPlan.meals_per_day || 2} meal{(selectedPlan.mealsPerDay || selectedPlan.meals_per_day || 2) > 1 ? 's' : ''}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Meal types */}
                    <View style={styles.modalDetailRow}>
                      <View style={[styles.modalDetailIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="time-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.modalDetailInfo}>
                        <ThemedText style={styles.modalDetailLabel}>Meal types</ThemedText>
                        <ThemedText style={[styles.modalDetailValue, { color: colors.text }]}>
                          {selectedPlan.selected_meals && selectedPlan.selected_meals.length > 0 ?
                            formatMealTypes(selectedPlan.selected_meals) : 
                            'Standard meals'}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Food type */}
                    {vendor.specialty && (
                      <View style={styles.modalDetailRow}>
                        <View style={[styles.modalDetailIcon, { 
                          backgroundColor: vendor.specialty === 'veg' ? '#4CAF5015' : '#FF980015'
                        }]}>
                          <Ionicons 
                            name={vendor.specialty === 'veg' ? 'leaf' : 'fast-food'} 
                            size={20} 
                            color={vendor.specialty === 'veg' ? '#4CAF50' : '#FF9800'} 
                          />
                        </View>
                        <View style={styles.modalDetailInfo}>
                          <ThemedText style={styles.modalDetailLabel}>Food type</ThemedText>
                          <ThemedText style={[
                            styles.modalDetailValue,
                            { color: vendor.specialty === 'veg' ? '#4CAF50' : '#FF9800' }
                          ]}>
                            {vendor.specialty === 'veg' ? 'Vegetarian' : 'Non-vegetarian options available'}
                          </ThemedText>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Menu Items */}
                  <View style={styles.modalDetailsSection}>
                    <ThemedText style={[styles.modalSectionTitle, { color: colors.primary }]}>
                      Available Food Items
                    </ThemedText>
                    
                    <View style={styles.menuContainer}>
                      {loadingMenus ? (
                        <View style={[styles.noMenuCard, { backgroundColor: colors.card }]}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <ThemedText style={styles.noDataText}>Loading menu items...</ThemedText>
                        </View>
                      ) : planMenus && planMenus.length > 0 ? (
                        <View style={styles.mealGroupContainer}>
                          {planMenus.map((menu) => (
                            <View key={menu._id} style={[styles.mealTypeBox, { backgroundColor: colors.card }]}>
                              {/* Meal Type Header */}
                              <View style={[styles.mealTypeHeader, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons 
                                  name={
                                    menu.meal_type === 'breakfast' ? 'sunny-outline' :
                                    menu.meal_type === 'lunch' ? 'restaurant-outline' :
                                    menu.meal_type === 'dinner' ? 'moon-outline' : 'time-outline'
                                  } 
                                  size={20} 
                                  color={colors.primary} 
                                />
                                <ThemedText style={[styles.mealTypeTitle, { color: colors.primary }]}>
                                  {menu.meal_type.charAt(0).toUpperCase() + menu.meal_type.slice(1)}
                                </ThemedText>
                                <View style={[styles.vegIndicator, { 
                                  backgroundColor: menu.non_veg ? '#FF9800' : '#4CAF50' 
                                }]}>
                                  <Ionicons 
                                    name={menu.non_veg ? "restaurant" : "leaf"} 
                                    size={12} 
                                    color="white" 
                                  />
                                </View>
                              </View>
                              
                              {/* Food Items List */}
                              <View style={styles.foodItemsList}>
                                {menu.items && Array.isArray(menu.items) && menu.items.length > 0 ? (
                                  menu.items.map((item, itemIndex) => (
                                    <View key={itemIndex} style={styles.foodItemRow}>
                                      <View style={styles.bulletPoint} />
                                      <View style={styles.foodItemContent}>
                                        <ThemedText style={styles.foodItemName}>
                                          {item.name || item.dish_name || item.itemName || 'Food Item'}
                                        </ThemedText>
                                        {item.description && (
                                          <ThemedText style={styles.foodItemDescription} numberOfLines={1}>
                                            {item.description}
                                          </ThemedText>
                                        )}
                                      </View>
                                    </View>
                                  ))
                                ) : (
                                  <ThemedText style={styles.noItemsText}>No items available</ThemedText>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={[styles.noMenuCard, { backgroundColor: colors.card }]}>
                          <Ionicons name="restaurant-outline" size={32} color={colors.primary + '60'} />
                          <ThemedText style={styles.noDataText}>
                            Menu items will be provided by the vendor
                          </ThemedText>
                          <ThemedText style={[styles.noDataSubtext, { color: colors.text + '60' }]}>
                            Contact the vendor for specific meal details
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Price Breakdown */}
                  <View style={styles.modalDetailsSection}>
                    <ThemedText style={[styles.modalSectionTitle, { color: colors.primary }]}>
                      Price Breakdown
                    </ThemedText>
                    
                    <View style={[styles.modalPriceBreakdown, { backgroundColor: colors.background }]}>
                      <View style={styles.modalPriceRow}>
                        <ThemedText style={styles.modalPriceRowLabel}>Total price</ThemedText>
                        <ThemedText style={[styles.modalPriceRowValue, { color: colors.primary }]}>
                          ₹{safeNumberConversion(selectedPlan.price)}
                        </ThemedText>
                      </View>
                      
                      {(selectedPlan.duration || selectedPlan.duration_days) > 1 && (
                        <View style={styles.modalPriceRow}>
                          <ThemedText style={styles.modalPriceRowLabel}>Per day</ThemedText>
                          <ThemedText style={styles.modalPriceRowValue}>
                            ₹{Math.round(safeNumberConversion(selectedPlan.price) / (selectedPlan.duration || selectedPlan.duration_days))}
                          </ThemedText>
                        </View>
                      )}
                      
                      <View style={styles.modalPriceRow}>
                        <ThemedText style={styles.modalPriceRowLabel}>Per meal</ThemedText>
                        <ThemedText style={styles.modalPriceRowValue}>
                          ₹{(safeNumberConversion(selectedPlan.price) / 
                            ((selectedPlan.duration || selectedPlan.duration_days || 30) * 
                             (selectedPlan.mealsPerDay || selectedPlan.meals_per_day || 2))).toFixed(0)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalSecondaryButton, { borderColor: colors.primary }]}
                onPress={handleCloseModal}
              >
                <ThemedText style={[styles.modalSecondaryButtonText, { color: colors.primary }]}>
                  Close
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalPrimaryButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  handleCloseModal();
                  router.push(`/vendor-plans/${id}`);
                }}
              >
                <Ionicons name="cart-outline" size={16} color="white" style={{marginRight: 6}} />
                <ThemedText style={styles.modalPrimaryButtonText}>
                  Subscribe Now
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Header styles
  header: {
    position: 'relative',
    height: 220, // Slightly taller header
  },
  vendorImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: Platform.OS === 'ios' ? 60 : 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...shadows.md,
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
  },
  vendorName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
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
    fontSize: 12,
  },
  // Tag container for cuisine type and delivery time
  tagContainer: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Info section styles
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
    fontSize: 14,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  // Card-style info items
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    ...shadows.sm,
  },
  infoCardContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoCardTitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  // Plans section styles
  plansSection: {
    padding: 16,
    paddingTop: 8,
  },
  noPlansText: {
    textAlign: 'center',
    marginVertical: 20,
    opacity: 0.7,
  },
  viewPlansButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 40,
  },
  planCard: {
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
  perDay: {
    fontSize: 14,
    fontWeight: '600',
  },
  planDetails: {
    marginBottom: 16,
  },
  planDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  planDetailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  planDetailLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  planDetailValue: {
    fontSize: 14,
    fontWeight: '600',
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
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  subscribeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: Dimensions.get('window').height * 0.85,
    minHeight: Dimensions.get('window').height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
  },
  modalPlanCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalPlanIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalPlanIconText: {
    fontSize: 24,
  },
  modalPlanInfo: {
    flex: 1,
  },
  modalPlanName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalPlanDuration: {
    fontSize: 14,
    marginTop: 2,
  },
  modalPriceContainer: {
    alignItems: 'flex-end',
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalPriceLabel: {
    fontSize: 12,
  },
  modalDetailsSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalDetailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalDetailInfo: {
    flex: 1,
  },
  modalDetailLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalPriceBreakdown: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalPriceRowLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  modalPriceRowValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    paddingTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryButton: {
    borderWidth: 1,
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalPrimaryButton: {
    flexDirection: 'row',
  },
  modalPrimaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Menu styles
  menuContainer: {
    marginTop: 8,
  },
  mealGroupContainer: {
    gap: 12,
  },
  mealTypeBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  mealTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  vegIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodItemsList: {
    padding: 12,
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: 6,
    marginRight: 8,
  },
  foodItemContent: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  foodItemDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  noItemsText: {
    fontSize: 12,
    opacity: 0.5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  noMenuCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  noDataSubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  foodTypeIndicator: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  foodTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});