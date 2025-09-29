import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useColorScheme } from '../../hooks/useColorScheme';
import { lightColors, darkColors, shadows, spacing } from '../../constants/Colors';
import { getDeliveryTracking, getCustomerDeliveries, getProfile } from '../../api/customerApi';
import { auth } from '../../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

export default function TrackScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'mutedForeground');
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = '#10B981';
  const warningColor = '#F59E0B';
  const errorColor = '#EF4444';

  // Request location permission and get current location
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        console.log('📍 Getting current location...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        };
        
        console.log('📍 Current location:', coords);
        setCustomerLocation({ coordinates: coords });
      } else {
        console.log('❌ Location permission denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to see delivery tracking',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  // Fetch delivery data
  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('Please log in to view tracking');
        return;
      }

      console.log('🔄 Fetching delivery data for user:', currentUser.uid);

      // Get customer profile to get customer ID
      let profile = null;
      try {
        profile = await getProfile();
        setCustomerData(profile);
        console.log('👤 Customer profile:', profile);
      } catch (profileError) {
        console.log('⚠️ Could not fetch profile:', profileError.message);
        // Continue without profile, use Firebase UID
      }

      const customerId = currentUser.uid; // Always use Firebase UID as backend expects it
      console.log('🆔 Using Firebase UID as customer ID:', customerId);

      // Fetch delivery tracking and customer deliveries in parallel
      const [trackingData, deliveriesData] = await Promise.all([
        getDeliveryTracking(customerId).catch(err => {
          console.log('❌ Tracking data error:', err.message);
          return null;
        }),
        getCustomerDeliveries(customerId).catch(err => {
          console.log('❌ Deliveries data error:', err.message);
          return [];
        })
      ]);

      console.log('📦 Tracking data:', trackingData);
      console.log('📋 Deliveries data:', deliveriesData);

      // Set active delivery from tracking
      if (trackingData && trackingData.success && trackingData.tracking) {
        setActiveDelivery(trackingData.tracking);
        console.log('✅ Active delivery found:', trackingData.tracking);
      } else {
        console.log('ℹ️ No active delivery found');
        setActiveDelivery(null);
      }

      // Set deliveries list
      if (deliveriesData && deliveriesData.success) {
        const allDeliveries = [
          ...(deliveriesData.activeDeliveries || []),
          ...(deliveriesData.historicalDeliveries || [])
        ];
        setDeliveries(allDeliveries);
        console.log('✅ Deliveries loaded:', allDeliveries.length, 'items');
        console.log('📊 Active deliveries:', deliveriesData.activeDeliveries?.length || 0);
        console.log('📊 Historical deliveries:', deliveriesData.historicalDeliveries?.length || 0);
      } else {
        setDeliveries([]);
        console.log('ℹ️ No deliveries found');
      }

    } catch (error) {
      console.error('❌ Error fetching delivery data:', error);
      setError(error.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    const initializeTracking = async () => {
      // Request location permission first
      await requestLocationPermission();
      
      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        if (user) {
          fetchDeliveryData();
        } else {
          setLoading(false);
          setActiveDelivery(null);
          setDeliveries([]);
          setCustomerData(null);
        }
      });

      return () => unsubscribe();
    };

    initializeTracking();
  }, []);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDeliveryData();
      
      // Also refresh location if permission is granted
      if (locationPermission) {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          
          const coords = {
            lat: location.coords.latitude,
            lng: location.coords.longitude
          };
          
          setCustomerLocation({ coordinates: coords });
        } catch (locationError) {
          console.log('⚠️ Could not update location:', locationError.message);
        }
      }
    } finally {
      setRefreshing(false);
    }
  }, [locationPermission]);

  // Auto-refresh every 30 seconds when there's an active delivery
  useEffect(() => {
    let intervalId = null;
    
    if (activeDelivery && user) {
      console.log('🔄 Starting auto-refresh for active delivery');
      intervalId = setInterval(() => {
        fetchDeliveryData();
      }, 30000); // 30 seconds
    }

    return () => {
      if (intervalId) {
        console.log('⏹️ Stopping auto-refresh');
        clearInterval(intervalId);
      }
    };
  }, [activeDelivery, user]);

  // Get delivery status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'assigned':
        return warningColor;
      case 'in_progress':
      case 'picked_up':
        return primaryColor;
      case 'delivered':
        return successColor;
      case 'cancelled':
        return errorColor;
      default:
        return mutedColor;
    }
  };

  // Get delivery status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'time-outline';
      case 'assigned':
        return 'person-outline';
      case 'in_progress':
        return 'car-outline';
      case 'picked_up':
        return 'checkmark-circle-outline';
      case 'delivered':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  // Format delivery status text
  const formatStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'assigned':
        return 'Driver Assigned';
      case 'in_progress':
        return 'On the Way';
      case 'picked_up':
        return 'Picked Up';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  };

  // Get driver coordinates for display
  const getDriverCoordinates = (delivery) => {
    if (!delivery) return null;
    
    let driverLat = null, driverLng = null;
    
    // Try multiple sources for driver location
    if (delivery?.driverLocation?.coordinates && 
        delivery.driverLocation.coordinates[0] !== 0 && 
        delivery.driverLocation.coordinates[1] !== 0) {
      driverLat = delivery.driverLocation.coordinates[1];
      driverLng = delivery.driverLocation.coordinates[0];
    } else if (delivery?.driver?.location?.coordinates &&
               delivery.driver.location.coordinates[0] !== 0 && 
               delivery.driver.location.coordinates[1] !== 0) {
      driverLat = delivery.driver.location.coordinates[1];
      driverLng = delivery.driver.location.coordinates[0];
    }
    
    if (driverLat && driverLng) {
      return { latitude: driverLat, longitude: driverLng };
    }
    return null;
  };

  const getVendorCoordinates = (delivery) => {
    if (!delivery?.vendor?.address?.coordinates) return null;
    
    const vendorCoords = delivery.vendor.address.coordinates;
    let vendorLat, vendorLng;
    
    if (Array.isArray(vendorCoords)) {
      // GeoJSON format [lng, lat]
      vendorLat = vendorCoords[1];
      vendorLng = vendorCoords[0];
    } else if (vendorCoords.lat && vendorCoords.lng) {
      // Object format {lat, lng}
      vendorLat = vendorCoords.lat;
      vendorLng = vendorCoords.lng;
    }

    if (vendorLat && vendorLng) {
      return { latitude: vendorLat, longitude: vendorLng };
    }
    return null;
  };

  // Generate OpenStreetMap HTML for WebView
  const generateMapHTML = (delivery, customerLocation, isDark) => {
    const driverCoords = getDriverCoordinates(delivery);
    const vendorCoords = getVendorCoordinates(delivery);
    const customerCoords = customerLocation?.coordinates ? {
      lat: customerLocation.coordinates.lat,
      lng: customerLocation.coordinates.lng
    } : null;

    const center = customerCoords || { lat: 19.248364, lng: 72.850088 };
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            #map { height: 100vh; width: 100%; }
            body { font-family: Arial, sans-serif; }
            .leaflet-routing-container { display: none !important; }
            .custom-div-icon { background: none; border: none; }
            .marker-icon {
                width: 30px; height: 30px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                color: white; font-weight: bold; font-size: 14px;
                border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            .driver-marker { background-color: #F59E0B; }
            .customer-marker { background-color: #10B981; }
            .vendor-marker { background-color: #8B5CF6; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            const map = L.map('map').setView([${center.lat}, ${center.lng}], 13);
            
            const tileLayer = ${isDark ? 
                `L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '© OpenStreetMap contributors, © CartoDB',
                    subdomains: 'abcd'
                })` :
                `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                })`
            };
            tileLayer.addTo(map);

            const markers = [];
            let routingControl = null;

            function createCustomIcon(className, emoji) {
                return L.divIcon({
                    className: 'custom-div-icon',
                    html: \`<div class="marker-icon \${className}">\${emoji}</div>\`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });
            }

            function updateMap() {
                markers.forEach(marker => map.removeLayer(marker));
                markers.length = 0;
                if (routingControl) {
                    map.removeControl(routingControl);
                    routingControl = null;
                }

                const bounds = [];

                ${customerCoords ? `
                const customerMarker = L.marker([${customerCoords.lat}, ${customerCoords.lng}], {
                    icon: createCustomIcon('customer-marker', '🏠')
                }).bindPopup('<strong>📍 Your Location</strong>').addTo(map);
                markers.push(customerMarker);
                bounds.push([${customerCoords.lat}, ${customerCoords.lng}]);
                ` : ''}

                ${vendorCoords ? `
                const vendorMarker = L.marker([${vendorCoords.latitude}, ${vendorCoords.longitude}], {
                    icon: createCustomIcon('vendor-marker', '🏪')
                }).bindPopup('<strong>🏪 Restaurant</strong>').addTo(map);
                markers.push(vendorMarker);
                bounds.push([${vendorCoords.latitude}, ${vendorCoords.longitude}]);
                ` : ''}

                ${driverCoords ? `
                const driverMarker = L.marker([${driverCoords.latitude}, ${driverCoords.longitude}], {
                    icon: createCustomIcon('driver-marker', '🚚')
                }).bindPopup('<strong>🚚 Driver</strong>').addTo(map);
                markers.push(driverMarker);
                bounds.push([${driverCoords.latitude}, ${driverCoords.longitude}]);

                ${customerCoords ? `
                routingControl = L.Routing.control({
                    waypoints: [
                        L.latLng(${driverCoords.latitude}, ${driverCoords.longitude}),
                        L.latLng(${customerCoords.lat}, ${customerCoords.lng})
                    ],
                    routeWhileDragging: false,
                    addWaypoints: false,
                    createMarker: () => null,
                    lineOptions: {
                        styles: [{ color: '#3B82F6', weight: 4, opacity: 0.8 }]
                    },
                    show: false,
                    router: L.Routing.osrmv1({
                        serviceUrl: 'https://router.project-osrm.org/route/v1'
                    })
                }).addTo(map);
                ` : ''}
                ` : ''}

                if (bounds.length > 0) {
                    map.fitBounds(bounds, { padding: [20, 20] });
                }
            }

            updateMap();

            window.centerOnLocation = function(lat, lng, zoom = 16) {
                map.setView([lat, lng], zoom);
            };

            window.addEventListener('message', function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.action === 'centerOnLocation') {
                        window.centerOnLocation(data.lat, data.lng);
                    } else if (data.action === 'refresh') {
                        updateMap();
                    }
                } catch (error) {
                    console.log('Error handling message:', error);
                }
            });

            map.whenReady(function() {
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'mapReady'
                }));
            });
        </script>
    </body>
    </html>
    `;
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading tracking data...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={errorColor} />
          <ThemedText style={styles.errorTitle}>Unable to Load Tracking</ThemedText>
          <ThemedText style={[styles.errorMessage, { color: mutedColor }]}>{error}</ThemedText>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: primaryColor }]} 
            onPress={() => fetchDeliveryData()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No user state
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle" size={48} color={mutedColor} />
          <ThemedText style={styles.errorTitle}>Please log in</ThemedText>
          <ThemedText style={[styles.errorMessage, { color: mutedColor }]}>
            Log in to view your delivery tracking
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
        {/* Header */}
        <ThemedView style={[styles.header, { backgroundColor: cardColor }]}>
          <View style={styles.headerContent}>
            <Ionicons name="location" size={28} color={primaryColor} />
            <View style={styles.headerText}>
              <ThemedText style={styles.headerTitle}>Live Tracking</ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: mutedColor }]}>
                Track your deliveries in real-time
              </ThemedText>
            </View>
          </View>
          
          {activeDelivery && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeDelivery.status) + '20' }]}>
              <Ionicons 
                name={getStatusIcon(activeDelivery.status)} 
                size={16} 
                color={getStatusColor(activeDelivery.status)} 
              />
              <ThemedText style={[styles.statusText, { color: getStatusColor(activeDelivery.status) }]}>
                {formatStatus(activeDelivery.status)}
              </ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Active Delivery Tracking */}
        {activeDelivery ? (
          <ThemedView style={[styles.section, { backgroundColor: cardColor }]}>
            {/* Delivery Info */}
            <View style={styles.deliveryInfo}>
              <View style={styles.deliveryHeader}>
                <ThemedText style={styles.sectionTitle}>Active Delivery</ThemedText>
                <View style={[styles.deliveryId, { backgroundColor: primaryColor + '10' }]}>
                  <ThemedText style={[styles.deliveryIdText, { color: primaryColor }]}>
                    #{activeDelivery._id?.slice(-6) || 'N/A'}
                  </ThemedText>
                </View>
              </View>

              {/* Driver Info */}
              {activeDelivery.driver && (
                <View style={[styles.driverCard, { backgroundColor: backgroundColor }]}>
                  <View style={styles.driverInfo}>
                    <View style={[styles.driverAvatar, { backgroundColor: primaryColor }]}>
                      <Ionicons name="person" size={24} color="white" />
                    </View>
                    <View style={styles.driverDetails}>
                      <ThemedText style={styles.driverName}>
                        {activeDelivery.driver.name || 'Driver'}
                      </ThemedText>
                      <ThemedText style={[styles.driverVehicle, { color: mutedColor }]}>
                        {activeDelivery.driver.vehicleType || 'Vehicle'} • {activeDelivery.driver.vehicleNumber || 'N/A'}
                      </ThemedText>
                      {activeDelivery.driver.rating && (
                        <View style={styles.rating}>
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <ThemedText style={[styles.ratingText, { color: mutedColor }]}>
                            {activeDelivery.driver.rating}/5
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {activeDelivery.driver.contactNumber && (
                    <TouchableOpacity 
                      style={[styles.callButton, { backgroundColor: successColor }]}
                      onPress={() => {
                        Linking.openURL(`tel:${activeDelivery.driver.contactNumber}`);
                      }}
                    >
                      <Ionicons name="call" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Vendor Info */}
              {activeDelivery.vendor && (
                <View style={[styles.vendorCard, { backgroundColor: backgroundColor }]}>
                  <View style={styles.vendorInfo}>
                    <View style={[styles.vendorIcon, { backgroundColor: '#8B5CF6' }]}>
                      <Ionicons name="storefront" size={20} color="white" />
                    </View>
                    <View style={styles.vendorDetails}>
                      <ThemedText style={styles.vendorName}>
                        {activeDelivery.vendor.businessName || activeDelivery.vendor.name || 'Restaurant'}
                      </ThemedText>
                      <ThemedText style={[styles.vendorAddress, { color: mutedColor }]}>
                        {activeDelivery.vendor.address?.street || 'Restaurant location'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Live Map - Integrated */}
            <View style={styles.mapSection}>
              <View style={styles.mapHeader}>
                <ThemedText style={styles.mapTitle}>Live Location</ThemedText>
                <TouchableOpacity
                  style={[styles.refreshMapButton, { backgroundColor: primaryColor + '10' }]}
                  onPress={() => {
                    if (mapRef.current) {
                      mapRef.current.postMessage(JSON.stringify({ action: 'refresh' }));
                    }
                    onRefresh();
                  }}
                >
                  <Ionicons name="refresh-outline" size={16} color={primaryColor} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.mapContainer}>
                <WebView
                  ref={mapRef}
                  style={styles.map}
                  source={{ html: generateMapHTML(activeDelivery, customerLocation, isDark) }}
                  onMessage={(event) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data.type === 'mapReady') {
                        setMapReady(true);
                      }
                    } catch (error) {
                      console.log('Map message error:', error);
                    }
                  }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  mixedContentMode="compatibility"
                />
                
                {/* Map Controls */}
                <View style={styles.mapControls}>
                  <TouchableOpacity
                    style={[styles.mapControlButton, { backgroundColor: cardColor }]}
                    onPress={() => {
                      if (customerLocation?.coordinates && mapRef.current) {
                        mapRef.current.postMessage(JSON.stringify({
                          action: 'centerOnLocation',
                          lat: customerLocation.coordinates.lat,
                          lng: customerLocation.coordinates.lng
                        }));
                      }
                    }}
                  >
                    <Ionicons name="home" size={16} color={primaryColor} />
                  </TouchableOpacity>
                  
                  {getDriverCoordinates(activeDelivery) && (
                    <TouchableOpacity
                      style={[styles.mapControlButton, { backgroundColor: cardColor }]}
                      onPress={() => {
                        const driverCoords = getDriverCoordinates(activeDelivery);
                        if (driverCoords && mapRef.current) {
                          mapRef.current.postMessage(JSON.stringify({
                            action: 'centerOnLocation',
                            lat: driverCoords.latitude,
                            lng: driverCoords.longitude
                          }));
                        }
                      }}
                    >
                      <Ionicons name="car" size={16} color={primaryColor} />
                    </TouchableOpacity>
                  )}
                </View>
                
                {!mapReady && (
                  <View style={[styles.mapLoading, { backgroundColor: cardColor + 'CC' }]}>
                    <ActivityIndicator size="large" color={primaryColor} />
                    <ThemedText style={[styles.mapLoadingText, { color: mutedColor }]}>Loading map...</ThemedText>
                  </View>
                )}
              </View>
            </View>
          </ThemedView>
        ) : (
          /* No Active Delivery */
          <ThemedView style={[styles.section, { backgroundColor: cardColor }]}>
            <View style={styles.noActiveDelivery}>
              <Ionicons name="car-outline" size={64} color={mutedColor} style={styles.noActiveIcon} />
              <ThemedText style={styles.noActiveTitle}>No Active Delivery</ThemedText>
              <ThemedText style={[styles.noActiveSubtitle, { color: mutedColor }]}>
                You don't have any active deliveries at the moment
              </ThemedText>
              
              {!locationPermission && (
                <TouchableOpacity 
                  style={[styles.locationButton, { backgroundColor: primaryColor }]}
                  onPress={requestLocationPermission}
                >
                  <Ionicons name="location" size={16} color="white" />
                  <Text style={styles.locationButtonText}>Enable Location</Text>
                </TouchableOpacity>
              )}
            </View>
          </ThemedView>
        )}

        {/* Recent Deliveries */}
        {deliveries.length > 0 && (
          <ThemedView style={[styles.section, { backgroundColor: cardColor }]}>
            <ThemedText style={styles.sectionTitle}>Recent Deliveries</ThemedText>
            
            <View style={styles.deliveriesList}>
              {deliveries.slice(0, 5).map((delivery, index) => (
                <View key={delivery._id || index} style={[styles.deliveryItem, { borderBottomColor: backgroundColor }]}>
                  <View style={styles.deliveryItemContent}>
                    <View style={[styles.deliveryStatusIcon, { backgroundColor: getStatusColor(delivery.status) + '20' }]}>
                      <Ionicons 
                        name={getStatusIcon(delivery.status)} 
                        size={16} 
                        color={getStatusColor(delivery.status)} 
                      />
                    </View>
                    
                    <View style={styles.deliveryItemDetails}>
                      <ThemedText style={styles.deliveryItemTitle}>
                        Delivery #{delivery._id?.slice(-6) || 'N/A'}
                      </ThemedText>
                      <ThemedText style={[styles.deliveryItemSubtitle, { color: mutedColor }]}>
                        {delivery.vendor?.name || 'Restaurant'} • {formatStatus(delivery.status)}
                      </ThemedText>
                      {delivery.createdAt && (
                        <ThemedText style={[styles.deliveryItemTime, { color: mutedColor }]}>
                          {new Date(delivery.createdAt).toLocaleDateString()}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ThemedView>
        )}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  deliveryInfo: {
    marginBottom: spacing.lg,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  deliveryId: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deliveryIdText: {
    fontSize: 12,
    fontWeight: '600',
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    ...shadows.xs,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  driverVehicle: {
    fontSize: 14,
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    ...shadows.xs,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  vendorAddress: {
    fontSize: 14,
  },
  noActiveDelivery: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  noActiveIcon: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  noActiveTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  noActiveSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deliveriesList: {
    gap: 0,
  },
  deliveryItem: {
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  deliveryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryStatusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryItemDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  deliveryItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  deliveryItemSubtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  deliveryItemTime: {
    fontSize: 12,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Map Styles
  mapSection: {
    marginTop: spacing.md,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshMapButton: {
    padding: spacing.xs,
    borderRadius: 20,
  },
  mapContainer: {
    height: 300,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    gap: spacing.xs,
  },
  mapControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mapLoadingText: {
    fontSize: 14,
  },
});
