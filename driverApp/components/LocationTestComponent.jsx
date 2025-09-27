import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const LocationTestComponent = () => {
  const [locationStatus, setLocationStatus] = useState('Not tested');
  const [currentLocation, setCurrentLocation] = useState(null);

  const testLocationPermissions = async () => {
    try {
      setLocationStatus('Testing permissions...');
      
      // Request foreground permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        setLocationStatus('Permission denied');
        Alert.alert('Permission Denied', 'Location permission was denied');
        return;
      }
      
      setLocationStatus('Permission granted, getting location...');
      
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });
      
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      };
      
      setCurrentLocation(coords);
      setLocationStatus('Location obtained successfully!');
      
      console.log('Location obtained:', coords);
      Alert.alert(
        'Location Obtained!', 
        `Lat: ${coords.latitude.toFixed(6)}\nLng: ${coords.longitude.toFixed(6)}\nAccuracy: ${coords.accuracy}m`
      );
      
    } catch (error) {
      console.error('Location test error:', error);
      setLocationStatus(`Error: ${error.message}`);
      Alert.alert('Location Error', error.message);
    }
  };

  return (
    <View style={{
      backgroundColor: '#fff',
      margin: 20,
      padding: 20,
      borderRadius: 12,
      elevation: 3,
    }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Location Test
      </Text>
      
      <Text style={{ color: '#666', marginBottom: 15 }}>
        Status: {locationStatus}
      </Text>
      
      {currentLocation && (
        <View style={{ backgroundColor: '#f0f9f0', padding: 12, borderRadius: 8, marginBottom: 15 }}>
          <Text style={{ fontWeight: 'bold', color: '#28a745' }}>Current Location:</Text>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
            Lat: {currentLocation.latitude.toFixed(6)}
          </Text>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
            Lng: {currentLocation.longitude.toFixed(6)}
          </Text>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
            Accuracy: {currentLocation.accuracy}m
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        onPress={testLocationPermissions}
        style={{
          backgroundColor: '#007AFF',
          padding: 12,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Ionicons name="location" size={20} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>
          Test Location
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LocationTestComponent;