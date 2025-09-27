import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class LocationService {
  constructor() {
    this.watchSubscription = null;
    this.updateInterval = null;
    this.isTracking = false;
    this.currentLocation = null;
    this.API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  }

  // Request location permissions
  async requestLocationPermission() {
    try {
      console.log('📍 Requesting location permission on platform:', Platform.OS);
      
      // Request foreground permission first
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log('🔐 Foreground permission status:', status);
      
      if (status !== 'granted') {
        console.log('❌ Foreground location permission denied');
        return { foreground: false, background: false };
      }

      console.log('✅ Foreground location permission granted');

      // Request background permission for continuous tracking (mobile only)
      let backgroundStatus = { status: 'denied' };
      if (Platform.OS !== 'web') {
        backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        console.log('🔐 Background permission status:', backgroundStatus.status);
        
        if (backgroundStatus.status !== 'granted') {
          console.warn('⚠️ Background location permission not granted, using foreground only');
        } else {
          console.log('✅ Background location permission granted');
        }
      }

      return { 
        foreground: status === 'granted',
        background: backgroundStatus.status === 'granted'
      };
    } catch (error) {
      console.error('💥 Error requesting location permission:', error);
      return { foreground: false, background: false };
    }
  }

  // Get current location
  async getCurrentLocation() {
    try {
      console.log('📍 Getting current location...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
        maximumAge: 5000
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp
      };

      console.log('✅ Current location obtained:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy
      });

      return this.currentLocation;
    } catch (error) {
      console.error('💥 Error getting current location:', error);
      throw error;
    }
  }

  // Update location in database
  async updateLocationInDatabase(latitude, longitude, address = '') {
    try {
      console.log('🌐 Sending location update to backend:', {
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      });

      const token = await AsyncStorage.getItem('driver_token');
      const driverData = await AsyncStorage.getItem('driver_data');
      
      if (!token || !driverData) {
        console.warn('⚠️ Driver authentication data not found, skipping database update');
        return;
      }

      const driver = JSON.parse(driverData);
      console.log('👤 Driver info for location update:', {
        email: driver.email,
        firebaseUid: driver.firebaseUid
      });
      
      const response = await fetch(`${this.API_BASE}/api/auth/update-location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firebaseUid: driver.firebaseUid,
          latitude: latitude,
          longitude: longitude,
          address: address
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend location update failed:', errorData);
        throw new Error(errorData.message || 'Failed to update location');
      }

      const result = await response.json();
      console.log('✅ Location updated in database successfully:', {
        message: result.message,
        coordinates: result.location?.coordinates,
        lastUpdated: result.location?.lastUpdated
      });
      
      return result;
    } catch (error) {
      console.error('💥 Error updating location in database:', error.message);
      console.error('🔍 Full error details:', error);
      // Don't throw error to prevent stopping location tracking
    }
  }

  // Start location tracking with database updates
  async startTracking(driverData, onLocationUpdate = null) {
    try {
      if (this.isTracking) {
        console.log('📍 Location tracking already active');
        return;
      }

      console.log('🚀 Starting location tracking...');
      
      // Store driver data for API calls
      await AsyncStorage.setItem('driver_data', JSON.stringify(driverData));
      
      // Store callback for location updates
      this.locationUpdateCallback = onLocationUpdate;
      
      // Start watching location changes
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds for testing
          distanceInterval: 5, // Update if moved 5 meters
        },
        async (location) => {
          console.log('📍 Location update received:', {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: new Date(location.timestamp).toISOString(),
            speed: location.coords.speed,
            heading: location.coords.heading
          });

          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp
          };

          // Call the location update callback if provided
          if (this.locationUpdateCallback) {
            console.log('🔄 Calling location update callback...');
            this.locationUpdateCallback({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            });
          }

          // Update location in database
          console.log('💾 Updating location in database...');
          await this.updateLocationInDatabase(
            location.coords.latitude,
            location.coords.longitude
          );
        }
      );

      // Set up periodic database updates (every 10 seconds for testing)
      this.updateInterval = setInterval(async () => {
        if (this.currentLocation) {
          console.log('⏰ Periodic location update triggered');
          await this.updateLocationInDatabase(
            this.currentLocation.latitude,
            this.currentLocation.longitude
          );
        }
      }, 10000);

      this.isTracking = true;
      console.log('✅ Location tracking started successfully');
      
    } catch (error) {
      console.error('💥 Error starting location tracking:', error);
      throw error;
    }
  }

  // Stop location tracking
  async stopTracking() {
    try {
      console.log('🛑 Stopping location tracking...');
      
      if (this.watchSubscription) {
        this.watchSubscription.remove();
        this.watchSubscription = null;
      }

      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      this.isTracking = false;
      this.currentLocation = null;
      this.locationUpdateCallback = null;
      
      // Clear stored driver data
      await AsyncStorage.removeItem('driver_data');
      
      console.log('✅ Location tracking stopped');
      
    } catch (error) {
      console.error('💥 Error stopping location tracking:', error);
    }
  }

  // Get tracking status
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      currentLocation: this.currentLocation,
      hasWatchSubscription: !!this.watchSubscription,
      hasUpdateInterval: !!this.updateInterval
    };
  }
}

export default new LocationService();