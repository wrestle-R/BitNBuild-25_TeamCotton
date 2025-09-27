import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDriverContext } from '../context/DriverContext';
import LocationService from '../services/LocationService';

const LocationStatusComponent = () => {
  const { driver, isLocationTracking, locationPermission, getCurrentLocation, initializeLocationTracking } = useDriverContext();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('unknown');

  useEffect(() => {
    // Update location status based on tracking state
    if (isLocationTracking) {
      setLocationStatus('tracking');
    } else if (locationPermission?.foreground) {
      setLocationStatus('permission-granted');
    } else if (locationPermission === false) {
      setLocationStatus('permission-denied');
    } else {
      setLocationStatus('unknown');
    }
  }, [isLocationTracking, locationPermission]);

  useEffect(() => {
    // Get current location when component mounts
    if (isLocationTracking) {
      getCurrentLocationData();
    }
  }, [isLocationTracking]);

  const getCurrentLocationData = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting current location in component:', error);
    }
  };

  const handleLocationPress = async () => {
    try {
      if (!isLocationTracking) {
        if (!driver) {
          Alert.alert('Error', 'Driver data not available');
          return;
        }
        
        Alert.alert(
          'Enable Location Tracking',
          'Location tracking is required to receive ride requests and provide accurate service.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Enable',
              onPress: async () => {
                try {
                  await initializeLocationTracking(driver);
                } catch (error) {
                  Alert.alert('Error', 'Failed to enable location tracking');
                }
              },
            },
          ]
        );
      } else {
        // Show current location
        await getCurrentLocationData();
        if (currentLocation) {
          Alert.alert(
            'Current Location',
            `Latitude: ${currentLocation.latitude.toFixed(6)}\nLongitude: ${currentLocation.longitude.toFixed(6)}\nAccuracy: ${currentLocation.accuracy?.toFixed(2)}m`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error handling location press:', error);
      Alert.alert('Error', 'Failed to handle location action');
    }
  };

  const getLocationIcon = () => {
    switch (locationStatus) {
      case 'tracking':
        return 'location';
      case 'permission-granted':
        return 'location-outline';
      case 'permission-denied':
        return 'location-off';
      default:
        return 'location-outline';
    }
  };

  const getLocationColor = () => {
    switch (locationStatus) {
      case 'tracking':
        return '#22c55e'; // Green
      case 'permission-granted':
        return '#eab308'; // Yellow
      case 'permission-denied':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getLocationText = () => {
    switch (locationStatus) {
      case 'tracking':
        return 'Location Active';
      case 'permission-granted':
        return 'Location Ready';
      case 'permission-denied':
        return 'Location Denied';
      default:
        return 'Location Unknown';
    }
  };

  const getLocationSubtext = () => {
    switch (locationStatus) {
      case 'tracking':
        return currentLocation 
          ? `Lat: ${currentLocation.latitude.toFixed(4)}, Lng: ${currentLocation.longitude.toFixed(4)}`
          : 'Tracking your location...';
      case 'permission-granted':
        return 'Tap to enable tracking';
      case 'permission-denied':
        return 'Enable in app settings';
      default:
        return 'Setting up location...';
    }
  };

  return (
    <TouchableOpacity 
      className="bg-white rounded-xl p-4 shadow-sm mb-4"
      onPress={handleLocationPress}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${getLocationColor()}20` }}>
            <Ionicons 
              name={getLocationIcon()} 
              size={20} 
              color={getLocationColor()} 
            />
          </View>
          
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              {getLocationText()}
            </Text>
            <Text className="text-sm text-gray-600 mt-0.5">
              {getLocationSubtext()}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          {isLocationTracking && (
            <View className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse" />
          )}
          <Ionicons name="chevron-forward-outline" size={20} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LocationStatusComponent;