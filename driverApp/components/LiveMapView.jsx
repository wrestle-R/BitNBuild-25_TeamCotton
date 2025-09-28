import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useDriverContext } from '../context/DriverContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Only import WebView on mobile platforms
let WebView = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (error) {
    console.warn('react-native-webview not available:', error);
  }
}

const LiveMapView = ({ height = 200 }) => {
  const { driver } = useDriverContext();
  const webViewRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const updateIntervalRef = useRef(null);
  const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // HTML template with Leaflet.js map (works on both mobile and web)
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Driver Live Location</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossorigin=""/>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            #map {
                width: 100%;
                height: 100vh;
                z-index: 1;
            }
            .location-info {
                position: absolute;
                bottom: 10px;
                left: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.95);
                padding: 8px 12px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                font-size: 12px;
                z-index: 1000;
            }
            .coords {
                color: #007AFF;
                font-weight: 600;
                font-family: monospace;
            }
            .address {
                color: #666;
                margin-top: 4px;
            }
            .timestamp {
                color: #999;
                font-size: 10px;
                margin-top: 4px;
            }
            .loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.9);
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                color: #007AFF;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div id="loading" class="loading">📍 Loading map...</div>
        <div id="map"></div>
        <div id="locationInfo" class="location-info" style="display: none;">
            <div class="coords" id="coordinates">Waiting for location...</div>
            <div class="address" id="address"></div>
            <div class="timestamp" id="timestamp"></div>
        </div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            crossorigin=""></script>
        
        <script>
            let map = null;
            let marker = null;

            // Initialize map
            function initMap() {
                console.log('🗺️ Initializing Leaflet map...');
                
                map = L.map('map', {
                    center: [28.6139, 77.2090], // Default to New Delhi
                    zoom: 15,
                    zoomControl: true,
                    scrollWheelZoom: true,
                    doubleClickZoom: true,
                    boxZoom: true,
                    keyboard: true,
                    dragging: true,
                    touchZoom: true
                });

                // Add OpenStreetMap tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19,
                    subdomains: ['a', 'b', 'c']
                }).addTo(map);

                // Hide loading indicator
                document.getElementById('loading').style.display = 'none';
                console.log('✅ Map initialized successfully');
                
                // Send ready message to React Native (mobile only)
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'MAP_READY'
                    }));
                }
            }

            // Update location and marker
            function updateLocation(latitude, longitude, address = '', timestamp = '') {
                console.log('📍 Updating location:', { latitude, longitude, address });
                
                if (!map) {
                    console.warn('⚠️ Map not initialized yet');
                    return;
                }

                // Remove existing marker
                if (marker) {
                    map.removeLayer(marker);
                }

                // Create custom car icon
                const carIcon = L.divIcon({
                    html: \`
                        <div style="
                            background: #007AFF;
                            border: 3px solid white;
                            border-radius: 50%;
                            width: 32px;
                            height: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
                            font-size: 16px;
                        ">🚗</div>
                    \`,
                    className: 'custom-car-marker',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                // Add new marker
                marker = L.marker([latitude, longitude], { 
                    icon: carIcon,
                    title: 'Driver Location'
                }).addTo(map);

                // Center map on new location with smooth animation
                map.flyTo([latitude, longitude], 16, {
                    animate: true,
                    duration: 1.5
                });

                // Update location info
                const coordsElement = document.getElementById('coordinates');
                const addressElement = document.getElementById('address');
                const timestampElement = document.getElementById('timestamp');
                const locationInfo = document.getElementById('locationInfo');

                if (coordsElement) {
                    coordsElement.textContent = \`📍 \${latitude.toFixed(6)}, \${longitude.toFixed(6)}\`;
                }

                if (addressElement && address) {
                    addressElement.textContent = \`📍 \${address}\`;
                    addressElement.style.display = 'block';
                } else if (addressElement) {
                    addressElement.style.display = 'none';
                }

                if (timestampElement) {
                    const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
                    timestampElement.textContent = \`Last updated: \${time}\`;
                }

                if (locationInfo) {
                    locationInfo.style.display = 'block';
                }

                console.log('✅ Location updated on map');
            }

            // Handle messages from React Native (mobile only)
            if (window.ReactNativeWebView) {
                window.addEventListener('message', function(event) {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('📨 Received message from React Native:', data);
                        
                        if (data.type === 'UPDATE_LOCATION') {
                            updateLocation(data.latitude, data.longitude, data.address, data.timestamp);
                        }
                    } catch (error) {
                        console.error('❌ Error parsing message:', error);
                    }
                });
            }

            // Initialize map when DOM is loaded
            document.addEventListener('DOMContentLoaded', initMap);
            
            // Fallback initialization
            if (document.readyState !== 'loading') {
                initMap();
            }
        </script>
    </body>
    </html>
  `;

  // Fetch driver location from backend
  const fetchDriverLocation = async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const driverData = await AsyncStorage.getItem('driver_data');
      
      if (!token || !driverData) {
        console.warn('⚠️ Driver authentication data not found');
        return null;
      }

      const driver = JSON.parse(driverData);
      
      const response = await fetch(`${API_BASE}/api/auth/user/${driver.firebaseUid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch driver location:', response.status);
        return null;
      }

      const result = await response.json();
      console.log('✅ Fetched driver location:', result.user?.location);
      
      return result.user?.location;
    } catch (error) {
      console.error('💥 Error fetching driver location:', error);
      return null;
    }
  };

  // Update location on map (different methods for mobile vs web)
  const updateLocationOnMap = (location) => {
    if (!location || !location.coordinates || location.coordinates.length < 2) {
      console.warn('⚠️ Invalid location data:', location);
      return;
    }

    const [longitude, latitude] = location.coordinates;
    const locationData = {
      latitude,
      longitude,
      address: location.address || '',
      timestamp: location.lastUpdated || new Date().toISOString()
    };

    if (Platform.OS === 'web') {
      // For web, try to call the global updateLocation function
      setTimeout(() => {
        try {
          if (typeof window !== 'undefined' && window.updateLocation) {
            window.updateLocation(
              locationData.latitude, 
              locationData.longitude, 
              locationData.address, 
              locationData.timestamp
            );
            console.log('📍 Updated location on web map:', locationData);
          }
        } catch (error) {
          console.log('Map not ready yet for web update:', error.message);
        }
      }, 100);
    } else {
      // For mobile, send location to WebView via JavaScript injection
      if (webViewRef.current) {
        const jsCode = `
          if (typeof updateLocation === 'function') {
            updateLocation(${latitude}, ${longitude}, "${locationData.address}", "${locationData.timestamp}");
          }
          true;
        `;
        
        webViewRef.current.injectJavaScript(jsCode);
        console.log('📍 Sent location update to WebView:', locationData);
      }
    }
  };

  // Start periodic location updates
  const startLocationUpdates = () => {
    console.log('🔄 Starting location updates every 30 seconds');
    
    // Initial fetch
    fetchDriverLocation().then(location => {
      if (location) {
        updateLocationOnMap(location);
      }
    });

    // Set up interval for updates
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(async () => {
      console.log('🔄 Fetching location update...');
      const location = await fetchDriverLocation();
      if (location) {
        updateLocationOnMap(location);
      }
    }, 30000); // 30 seconds
  };

  // Handle WebView messages
  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 Received message from WebView:', data);
      
      if (data.type === 'MAP_READY') {
        console.log('✅ Map is ready, starting location updates');
        setIsMapReady(true);
        startLocationUpdates();
      }
    } catch (error) {
      console.error('❌ Error parsing WebView message:', error);
    }
  };

  // UseEffect for driver context updates
  useEffect(() => {
    console.log('🚗 Driver context updated:', driver?.location);
    if (driver?.location?.coordinates && driver.location.coordinates.length >= 2) {
      console.log('👤 Driver context location updated, updating map');
      updateLocationOnMap(driver.location);
    }
  }, [driver?.location]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Render appropriate component based on platform
  console.log('LiveMapView: Platform:', Platform.OS);
  
  if (Platform.OS === 'web') {
    // Web version - simple fallback with location info
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.webFallbackContainer}>
          <Text style={styles.webFallbackTitle}>🗺️ Driver Location</Text>
          {driver?.location?.coordinates ? (
            <View style={styles.locationDetails}>
              <Text style={styles.coordinates}>
                📍 {driver.location.coordinates[1].toFixed(6)}, {driver.location.coordinates[0].toFixed(6)}
              </Text>
              {driver.location.address && (
                <Text style={styles.address}>📍 {driver.location.address}</Text>
              )}
              <Text style={styles.timestamp}>
                🕐 {driver.location.lastUpdated ? 
                  new Date(driver.location.lastUpdated).toLocaleString() : 
                  'Location tracking active'
                }
              </Text>
              <Text style={styles.webNote}>
                � Interactive map available on mobile app
              </Text>
            </View>
          ) : (
            <Text style={styles.noLocation}>📱 No location data available</Text>
          )}
        </View>
      </View>
    );
  }
  
  // Mobile version using WebView
  if (!WebView) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>❌ WebView not available</Text>
          <Text style={styles.loadingSubText}>Please install react-native-webview</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={onMessage}
        onError={(error) => {
          console.error('❌ WebView error:', error);
        }}
        onLoadEnd={() => {
          console.log('✅ WebView loaded successfully');
        }}
        onLoadStart={() => {
          console.log('🔄 WebView loading started');
        }}
      />
      
      {/* Loading overlay while map initializes */}
      {!isMapReady && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>🗺️ Loading interactive map...</Text>
            <Text style={styles.loadingSubText}>Please wait</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(245, 245, 245, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  loadingSubText: {
    fontSize: 14,
    color: '#666',
  },
  webFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  webFallbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationDetails: {
    alignItems: 'center',
    gap: 12,
  },
  coordinates: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  address: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 300,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  webNote: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  noLocation: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default LiveMapView;
