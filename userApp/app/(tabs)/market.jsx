import React, { useState, useEffect, useCallback } from 'react';
import { 
  ActivityIndicator,
  FlatList, 
  StyleSheet, 
  View, 
  Image, 
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Colors, lightColors, darkColors, shadows, borderRadius } from '../../constants/Colors';
import { getVendors, getProfile } from '../../api/customerApi';

const screenWidth = Dimensions.get('window').width;

export default function Market() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPreference, setFilterPreference] = useState('all');
  const [error, setError] = useState(null);

  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch current user profile (to compute distances) and vendors
      try {
        const p = await getProfile();
        setProfile(p || null);
      } catch (err) {
        // profile may be protected; ignore failure and continue to load vendors
        console.warn('Could not fetch profile for distance calculations', err);
        setProfile(null);
      }

      const data = await getVendors();
      setVendors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      setError('Failed to load vendors. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadVendors();
  }, [loadVendors]);

  // Function to calculate distance between two points (in km)
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
    return distance.toFixed(1);
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

  const handleViewDetails = (vendor) => {
    router.push(`/vendors/${vendor._id}`);
  };

  // Use only fetched vendors; show empty state if none
  const filteredVendors = vendors.filter(vendor => {
    const name = (vendor.name || '').toString().toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesPreference = filterPreference === 'all' || vendor.specialty === filterPreference;
    return matchesSearch && matchesPreference;
  });

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading Vendors...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <ThemedView style={styles.container}>
        <StatusBar 
          style={colorScheme === 'dark' ? 'light' : 'dark'} 
          translucent={true}
        />
      
      {/* Search bar */}
      <View style={[
        styles.searchContainer, 
        { backgroundColor: colors.background }
      ]}>
        <View style={[
          styles.searchBar, 
          { backgroundColor: colors.input }
        ]}>
          <Ionicons 
            name="search" 
            size={22} 
            color={colors.mutedForeground} 
            style={styles.searchIcon} 
          />
          <TextInput
            placeholder="Restaurant name or a dish..."
            placeholderTextColor={colors.mutedForeground}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          <TouchableOpacity>
            <Ionicons 
              name="mic-outline" 
              size={22} 
              color={colors.mutedForeground} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Veg Mode Toggle */}
        <View style={styles.vegModeContainer}>
          <ThemedText style={styles.vegModeText}>VEG MODE</ThemedText>
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              { backgroundColor: filterPreference === 'veg' ? colors.primary : colors.border }
            ]}
            onPress={() => setFilterPreference(filterPreference === 'veg' ? 'all' : 'veg')}
          >
            <View style={[
              styles.toggleKnob, 
              { 
                backgroundColor: colors.background,
                transform: [{ translateX: filterPreference === 'veg' ? 20 : 0 }] 
              }
            ]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vendors Count */}
      <View style={styles.headerContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <ThemedText style={styles.headerText}>
            {filteredVendors.length} RESTAURANTS DELIVERING TO YOU
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              loadVendors();
            }}
          >
            <Ionicons name="sync" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.subHeaderText}>Featured</ThemedText>
      </View>

      {error && (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      )}

      <FlatList
        data={filteredVendors}
  keyExtractor={(item) => item._id || item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[colors.primary]} 
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.vendorCard, 
              { 
                backgroundColor: colors.card,
                ...shadows.md
              }
            ]}
            onPress={() => handleViewDetails(item)}
          >
            {/* Hero Image with Featured Item */}
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: item.profileImage || item.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop'
                }}
                style={styles.vendorImage}
              />
              
                {/* Featured Item Tag (only show if vendor provides featured info) */}
                {item.featured && item.featured.name && (
                  <View style={[
                    styles.featureTag, 
                    { backgroundColor: 'rgba(0,0,0,0.7)' }
                  ]}>
                    <ThemedText style={styles.featureTagText}>
                      {`${item.featured.name}${item.featured.price ? ` · ₹${item.featured.price}` : ''}`}
                    </ThemedText>
                  </View>
                )}
              
              {/* Bookmark Button */}
              <TouchableOpacity style={styles.bookmarkButton}>
                <Ionicons 
                  name="bookmark-outline" 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Vendor Info */}
              <View style={styles.infoContainer}>
              {/* Vendor Name and Rating */}
              <View style={styles.vendorHeaderRow}>
                <ThemedText type="subtitle" style={styles.vendorName}>
                  {item.name}
                </ThemedText>
                <View style={[
                  styles.ratingBadge, 
                  { backgroundColor: item.rating >= 4.0 ? '#388E3C' : '#F57C00' }
                ]}>
                  <Ionicons name="star" size={16} color="white" />
                  <ThemedText style={styles.ratingText}>
                    {item.rating}
                  </ThemedText>
                </View>
              </View>
              
              {/* Delivery / distance / extra info (render only available fields) */}
              <View style={styles.detailsRow}>
                {item.estimatedDelivery && (
                  <View style={styles.deliveryInfoItem}>
                    <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
                    <ThemedText style={styles.deliveryInfoText}>
                      {item.estimatedDelivery}
                    </ThemedText>
                  </View>
                )}

                {/* Compute distance from profile (if available) and vendor address */}
                {(() => {
                  const vendorCoords = readCoordinates(item.address);
                  const userCoords = profile ? readCoordinates(profile.address) : null;
                  const dist = vendorCoords && userCoords ? calculateDistance(userCoords.lat, userCoords.lng, vendorCoords.lat, vendorCoords.lng) : null;
                  if (dist) {
                    return (
                      <View style={styles.deliveryInfoItem}>
                        <Ionicons name="location-outline" size={16} color={colors.mutedForeground} />
                        <ThemedText style={styles.deliveryInfoText}>{`${dist} km`}</ThemedText>
                      </View>
                    );
                  }
                  return null;
                })()}

                {item.extraInfo && (
                  <View style={styles.deliveryInfoItem}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
                    <ThemedText style={styles.deliveryInfoText}>
                      {item.extraInfo}
                    </ThemedText>
                  </View>
                )}
              </View>
              
              {/* Promo (only if provided by vendor) */}
              {item.promo && (
                <View style={styles.promoContainer}>
                  <Ionicons name="medal-outline" size={18} color={colors.primary} />
                  <ThemedText style={[styles.promoText, { color: colors.primary }]}> {item.promo} </ThemedText>
                </View>
              )}
              
              {/* Vendor features list (if present) */}
              {item.features && item.features.length > 0 && (
                <View style={styles.featuresRow}>
                  {item.features.map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <ThemedText style={styles.featureText}>{feat}</ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {/* Address block */}
              {item.address && (
                <ThemedText style={{ marginTop: 8, color: colors.mutedForeground }}>
                  {[
                    item.address.street,
                    item.address.city,
                    item.address.state,
                    item.address.pincode,
                  ].filter(Boolean).join(', ')}
                </ThemedText>
              )}

              {/* Plans / contact row */}
              <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="cart-outline" size={16} color={colors.mutedForeground} />
                  <ThemedText style={{ marginLeft: 8 }}>{(item.plans || 0)} meal plans</ThemedText>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    disabled={!item.plans || item.plans === 0}
                    onPress={() => router.push(`/vendors/${item._id}/plans`)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginRight: 8,
                    }}
                  >
                    <ThemedText>{item.plans > 0 ? 'View Plans' : 'No Plans'}</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleViewDetails(item)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                    }}
                  >
                    <ThemedText style={{ color: colors.card }}>{'Details'}</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    width: '100%',
    paddingTop: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: borderRadius.lg,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    paddingHorizontal: 4,
  },
  vegModeContainer: {
    marginLeft: 10,
    alignItems: 'center',
  },
  vegModeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 8,
    opacity: 0.9,
  },
  subHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  errorText: {
    textAlign: 'center',
    padding: 20,
    color: '#E57373',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
  },
  vendorCard: {
    marginVertical: 12,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  featureTag: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  featureTagText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  bookmarkButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 16,
  },
  vendorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  ratingText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  deliveryInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  deliveryInfoText: {
    marginLeft: 4,
    fontSize: 14,
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  promoText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    marginLeft: 4,
    fontSize: 12,
  }
});
