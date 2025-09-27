import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { useDriverContext } from '../context/DriverContext';
import { Ionicons } from '@expo/vector-icons';

// Only import MapView on native platforms
let MapView, Marker;
if (Platform.OS !== 'web') {
  try {
    const mapModule = require('react-native-maps');
    MapView = mapModule.default;
    Marker = mapModule.Marker;
  } catch (error) {
    console.warn('react-native-maps not available:', error);
  }
}

const { width } = Dimensions.get('window');

const LiveMapView = ({ height = 200 }) => {
  const { driver } = useDriverContext();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    // Get current location from driver context
    if (driver?.location?.coordinates && driver.location.coordinates.length >= 2) {
      const [longitude, latitude] = driver.location.coordinates;
      
      const newLocation = {
        latitude,
        longitude,
      };

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.005, // Zoom level (smaller = more zoomed in)
        longitudeDelta: 0.005,
      };

      setCurrentLocation(newLocation);
      setRegion(newRegion);
      
      console.log('📍 Map updated with location:', { latitude, longitude });
    }
  }, [driver?.location]);

  // Web fallback component
  const WebMapFallback = () => (
    <View style={[styles.container, { height }]}>
      <View style={styles.webFallbackContainer}>
        <Ionicons name="map-outline" size={48} color="#007AFF" />
        <Text style={styles.webFallbackTitle}>Location Tracking</Text>
        {currentLocation ? (
          <>
            <Text style={styles.webFallbackCoords}>
              📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
            {driver.location?.address && (
              <Text style={styles.webFallbackAddress} numberOfLines={2}>
                📍 {driver.location.address}
              </Text>
            )}
            <Text style={styles.webFallbackNote}>
              🗺️ Interactive map available on mobile
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.webFallbackNote}>
              📱 Enable location permissions on mobile for live tracking
            </Text>
          </>
        )}
      </View>
    </View>
  );

  // If no location data
  if (!currentLocation || !region) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.noLocationContainer}>
          <Ionicons name="location-outline" size={24} color="#666" />
          <Text style={styles.noLocationText}>Location tracking not active</Text>
          <Text style={styles.noLocationSubText}>Enable location to see map</Text>
        </View>
      </View>
    );
  }

  // Web platform - return fallback
  if (Platform.OS === 'web' || !MapView) {
    return <WebMapFallback />;
  }

  // Native platforms - return actual map

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation={false} // We'll use custom marker
        showsMyLocationButton={false}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
        onRegionChangeComplete={(newRegion) => {
          // Optional: Update region when user manually moves map
          setRegion(newRegion);
        }}
      >
        {/* Custom driver marker */}
        <Marker
          coordinate={currentLocation}
          title="Your Location"
          description="Driver Position"
          pinColor="#007AFF"
        >
          <View style={styles.markerContainer}>
            <View style={styles.markerInner}>
              <Ionicons name="car" size={16} color="#fff" />
            </View>
          </View>
        </Marker>
      </MapView>
      
      {/* Location info overlay */}
      <View style={styles.infoOverlay}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={12} color="#007AFF" />
          <Text style={styles.coordinatesText}>
            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </Text>
        </View>
        {driver.location?.address && (
          <Text style={styles.addressText} numberOfLines={1}>
            {driver.location.address}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    flex: 1,
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  noLocationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
  },
  noLocationSubText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  webFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  webFallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 12,
    marginBottom: 16,
  },
  webFallbackCoords: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  webFallbackAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  webFallbackNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  coordinatesText: {
    fontSize: 10,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  addressText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '400',
  },
});

export default LiveMapView;