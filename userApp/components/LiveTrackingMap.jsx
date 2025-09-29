import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
  ActivityIndicator,
  Image
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import { useColorScheme } from '../hooks/useColorScheme';
import { lightColors, darkColors, shadows, spacing } from '../constants/Colors';

const LiveTrackingMap = ({ delivery, customerLocation, onRefresh }) => {
  const mapRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [region, setRegion] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'mutedForeground');
  const primaryColor = useThemeColor({}, 'primary');
  const isDark = colorScheme === 'dark';

  console.log('🗺️ LiveTrackingMap Props:', {
    delivery: delivery ? 'Has delivery' : 'No delivery',
    driverLocation: delivery?.driverLocation ? 'Has driver location' : 'No driver location',
    customerLocation: customerLocation ? 'Has customer location' : 'No customer location',
    driverCoords: delivery?.driverLocation?.coordinates,
    customerCoords: customerLocation?.coordinates
  });

  // Initialize map region
  useEffect(() => {
    if (customerLocation?.coordinates) {
      setRegion({
        latitude: customerLocation.coordinates.lat,
        longitude: customerLocation.coordinates.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      // Default to Mumbai if no customer location
      setRegion({
        latitude: 19.248364,
        longitude: 72.850088,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [customerLocation]);

  // Update last update time when delivery data changes
  useEffect(() => {
    if (delivery) {
      setLastUpdate(new Date());
    }
  }, [delivery, customerLocation]);

  // Generate OpenStreetMap HTML with Leaflet for WebView
  const generateMapHTML = () => {
    const driverCoords = getDriverCoordinates();
    const vendorCoords = getVendorCoordinates();
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
            .custom-div-icon {
                background: none;
                border: none;
            }
            .marker-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            .driver-marker { background-color: #F59E0B; }
            .customer-marker { background-color: #10B981; }
            .vendor-marker { background-color: #8B5CF6; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Initialize map
            const map = L.map('map').setView([${center.lat}, ${center.lng}], 13);
            
            // Add tile layer (OpenStreetMap)
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

            // Create custom marker icons
            function createCustomIcon(className, emoji) {
                return L.divIcon({
                    className: 'custom-div-icon',
                    html: \`<div class="marker-icon \${className}">\${emoji}</div>\`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });
            }

            // Add markers and route
            function updateMap() {
                // Clear existing markers and routes
                markers.forEach(marker => map.removeLayer(marker));
                markers.length = 0;
                if (routingControl) {
                    map.removeControl(routingControl);
                    routingControl = null;
                }

                const bounds = [];

                // Customer marker
                ${customerCoords ? `
                const customerMarker = L.marker([${customerCoords.lat}, ${customerCoords.lng}], {
                    icon: createCustomIcon('customer-marker', '🏠')
                }).bindPopup('<strong>📍 Your Location</strong><br/>Delivery Address').addTo(map);
                markers.push(customerMarker);
                bounds.push([${customerCoords.lat}, ${customerCoords.lng}]);
                ` : ''}

                // Vendor marker
                ${vendorCoords ? `
                const vendorMarker = L.marker([${vendorCoords.latitude}, ${vendorCoords.longitude}], {
                    icon: createCustomIcon('vendor-marker', '🏪')
                }).bindPopup('<strong>🏪 Restaurant</strong><br/>${delivery?.vendor?.businessName || delivery?.vendor?.name || 'Vendor'}').addTo(map);
                markers.push(vendorMarker);
                bounds.push([${vendorCoords.latitude}, ${vendorCoords.longitude}]);
                ` : ''}

                // Driver marker
                ${driverCoords ? `
                const driverMarker = L.marker([${driverCoords.latitude}, ${driverCoords.longitude}], {
                    icon: createCustomIcon('driver-marker', '🚚')
                }).bindPopup('<strong>🚚 ${delivery?.driver?.name || 'Your Driver'}</strong><br/>${delivery?.driver?.vehicleType || 'Vehicle'}: ${delivery?.driver?.vehicleNumber || 'N/A'}').addTo(map);
                markers.push(driverMarker);
                bounds.push([${driverCoords.latitude}, ${driverCoords.longitude}]);

                // Add route from driver to customer
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
                        styles: [{
                            color: '#3B82F6',
                            weight: 4,
                            opacity: 0.8
                        }]
                    },
                    show: false,
                    router: L.Routing.osrmv1({
                        serviceUrl: 'https://router.project-osrm.org/route/v1'
                    })
                }).addTo(map);
                ` : ''}
                ` : ''}

                // Fit bounds to show all markers
                if (bounds.length > 0) {
                    map.fitBounds(bounds, { padding: [20, 20] });
                }
            }

            // Initialize map content
            updateMap();

            // Center on specific coordinates
            window.centerOnLocation = function(lat, lng, zoom = 16) {
                map.setView([lat, lng], zoom);
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'mapCentered',
                    lat: lat,
                    lng: lng
                }));
            };

            // Handle messages from React Native
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

            // Map ready
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

  const centerOnDriver = () => {
    if (!delivery?.driverLocation?.coordinates) {
      Alert.alert('Error', 'Driver location not available');
      return;
    }

    const driverLat = delivery.driverLocation.coordinates[1];
    const driverLng = delivery.driverLocation.coordinates[0];
    
    if (driverLat !== 0 && driverLng !== 0 && mapRef.current) {
      mapRef.current.postMessage(JSON.stringify({
        action: 'centerOnLocation',
        lat: driverLat,
        lng: driverLng
      }));
    } else {
      Alert.alert('Error', 'Driver location not available');
    }
  };

  const centerOnCustomer = () => {
    if (!customerLocation?.coordinates) {
      Alert.alert('Error', 'Your location not available');
      return;
    }
    
    if (mapRef.current) {
      mapRef.current.postMessage(JSON.stringify({
        action: 'centerOnLocation',
        lat: customerLocation.coordinates.lat,
        lng: customerLocation.coordinates.lng
      }));
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInGoogleMaps = () => {
    if (!delivery?.driverLocation?.coordinates || !customerLocation?.coordinates) {
      Alert.alert('Error', 'Location data not available');
      return;
    }

    const driverLat = delivery.driverLocation.coordinates[1];
    const driverLng = delivery.driverLocation.coordinates[0];
    const customerLat = customerLocation.coordinates.lat;
    const customerLng = customerLocation.coordinates.lng;

    const url = `https://www.google.com/maps/dir/${driverLat},${driverLng}/${customerLat},${customerLng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Google Maps');
    });
  };

  const callDriver = () => {
    if (delivery?.driver?.contactNumber) {
      Linking.openURL(`tel:${delivery.driver.contactNumber}`).catch(() => {
        Alert.alert('Error', 'Could not make phone call');
      });
    } else {
      Alert.alert('Error', 'Driver phone number not available');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Get driver coordinates for display
  const getDriverCoordinates = () => {
    let driverLat = null, driverLng = null;
    
    // Try multiple sources for driver location (matching website logic)
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

  const getVendorCoordinates = () => {
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

  if (!delivery) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: cardColor }]}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="location" size={24} color={mutedColor} />
            <ThemedText style={styles.headerTitle}>Live Tracking</ThemedText>
          </View>
        </View>
        
        <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
          <Ionicons name="car-outline" size={48} color={mutedColor} style={styles.emptyIcon} />
          <ThemedText style={[styles.emptyTitle, { color: textColor }]}>No Active Delivery</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: mutedColor }]}>
            No active delivery to track at the moment
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const driverCoords = getDriverCoordinates();
  const vendorCoords = getVendorCoordinates();
  const customerCoords = customerLocation?.coordinates ? {
    latitude: customerLocation.coordinates.lat,
    longitude: customerLocation.coordinates.lng
  } : null;

  return (
    <ThemedView style={[
      styles.container, 
      { backgroundColor: cardColor },
      isFullscreen && styles.fullscreen
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="car" size={24} color={primaryColor} />
          <ThemedText style={styles.headerTitle}>Live Tracking</ThemedText>
          {lastUpdate && (
            <View style={[styles.badge, { backgroundColor: primaryColor + '20', borderColor: primaryColor }]}>
              <ThemedText style={[styles.badgeText, { color: primaryColor }]}>
                Updated {lastUpdate.toLocaleTimeString()}
              </ThemedText>
            </View>
          )}
        </View>
        
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { 
                backgroundColor: primaryColor + '10',
                opacity: (pressed || refreshing) ? 0.7 : 1
              }
            ]}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name={refreshing ? "refresh" : "refresh-outline"} 
              size={18} 
              color={primaryColor}
              style={refreshing ? styles.rotating : null}
            />
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { 
                backgroundColor: primaryColor + '10',
                opacity: pressed ? 0.7 : 1
              }
            ]}
            onPress={toggleFullscreen}
          >
            <Ionicons 
              name={isFullscreen ? "contract" : "expand"} 
              size={18} 
              color={primaryColor} 
            />
          </Pressable>
        </View>
      </View>
      
      {/* Map Container */}
      <View style={[styles.mapContainer, isFullscreen && styles.fullscreenMap]}>
        <WebView
          ref={mapRef}
          style={styles.map}
          source={{ html: generateMapHTML() }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'mapReady') {
                setMapReady(true);
                console.log('📍 OpenStreetMap loaded successfully');
              } else if (data.type === 'mapCentered') {
                console.log('🎯 Map centered on:', data.lat, data.lng);
              }
            } catch (error) {
              console.log('Error parsing map message:', error);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          allowsFullscreenVideo={true}
        />
        
        {/* Floating Controls */}
        <View style={styles.floatingControls}>
          {driverCoords && (
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: cardColor }]}
              onPress={centerOnDriver}
            >
              <Ionicons name="car" size={16} color={primaryColor} />
              <ThemedText style={[styles.floatingButtonText, { color: primaryColor }]}>
                Driver
              </ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.floatingButton, { backgroundColor: cardColor }]}
            onPress={centerOnCustomer}
          >
            <Ionicons name="location" size={16} color={primaryColor} />
            <ThemedText style={[styles.floatingButtonText, { color: primaryColor }]}>
              Me
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, { backgroundColor: primaryColor }]}
            onPress={openInGoogleMaps}
          >
            <Ionicons name="navigate" size={16} color="white" />
            <Text style={styles.actionButtonTextWhite}>Google Maps</Text>
          </TouchableOpacity>
          
          {delivery?.driver?.contactNumber && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton, { backgroundColor: primaryColor }]}
              onPress={callDriver}
            >
              <Ionicons name="call" size={16} color="white" />
              <Text style={styles.actionButtonTextWhite}>Call Driver</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Legend */}
        <View style={[styles.legend, { backgroundColor: cardColor + 'E6' }]}>
          <ThemedText style={styles.legendTitle}>Legend</ThemedText>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="car" size={10} color="white" />
              </View>
              <ThemedText style={styles.legendText}>Driver</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: '#10B981' }]}>
                <Ionicons name="home" size={10} color="white" />
              </View>
              <ThemedText style={styles.legendText}>Your Location</ThemedText>
            </View>
            {vendorCoords && (
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, { backgroundColor: '#8B5CF6' }]}>
                  <Ionicons name="storefront" size={10} color="white" />
                </View>
                <ThemedText style={styles.legendText}>Restaurant</ThemedText>
              </View>
            )}
            <View style={styles.legendItem}>
              <View style={[styles.routeLine, { backgroundColor: '#3B82F6' }]} />
              <ThemedText style={styles.legendText}>Route</ThemedText>
            </View>
          </View>
        </View>

        {/* Loading overlay */}
        {!mapReady && (
          <View style={[styles.loadingOverlay, { backgroundColor: cardColor + 'CC' }]}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={[styles.loadingText, { color: textColor }]}>Loading map...</ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: darkColors.mutedForeground + '20',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: 20,
    gap: 4,
  },
  primaryButton: {
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonTextWhite: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  rotating: {
    // Add rotation animation if needed
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  fullscreenMap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    ...shadows.sm,
  },
  floatingControls: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    gap: spacing.xs,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: 8,
    gap: 4,
    ...shadows.sm,
  },
  floatingButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    gap: spacing.xs,
  },
  legend: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    padding: spacing.xs,
    borderRadius: 8,
    ...shadows.sm,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: spacing.xs / 2,
  },
  legendItems: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  legendMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyIcon: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LiveTrackingMap;