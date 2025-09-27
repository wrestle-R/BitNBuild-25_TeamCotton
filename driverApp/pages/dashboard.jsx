import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDriverContext } from '../context/DriverContext';
import { Ionicons } from '@expo/vector-icons';
import DriverDetailsForm from '../components/DriverDetailsForm';
import LiveMapView from '../components/LiveMapView';
import * as Location from 'expo-location';
import '../global.css';

export default function Dashboard() {
  // Add error boundary and logging
  console.log('📊 Dashboard component rendering...');
  
  let driverContextData;
  try {
    driverContextData = useDriverContext();
    console.log('✅ Dashboard - Successfully got driver context:', {
      hasDriver: !!driverContextData.driver,
      loading: driverContextData.loading,
      contextReady: driverContextData.contextReady
    });
  } catch (error) {
    console.error('💥 Dashboard - Error getting driver context:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', fontSize: 16 }}>
          Error loading driver context: {error.message}
        </Text>
        <Text style={{ color: '#666', textAlign: 'center', marginTop: 10 }}>
          Please restart the app or contact support.
        </Text>
      </View>
    );
  }

  const { 
    driver, 
    loading, 
    locationPermission, 
    isLocationTracking,
    initializeLocationTracking 
  } = driverContextData;
  const router = useRouter();

  // Manual location permission request
  const requestLocationPermission = async () => {
    try {
      console.log('🔄 Manual location permission request triggered');
      
      Alert.alert(
        'Enable Location Tracking',
        'This will enable live location tracking for your driver services. You will be prompted to allow location access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable Now', 
            onPress: async () => {
              try {
                console.log('🚀 Starting manual location initialization...');
                await initializeLocationTracking(driver);
              } catch (error) {
                console.error('💥 Manual location setup failed:', error);
                Alert.alert('Error', 'Failed to enable location tracking. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in manual location request:', error);
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  // Check if driver profile is complete
  const isProfileComplete = (driver) => {
    if (!driver) return false;
    
    const requiredFields = ['contactNumber', 'vehicleType', 'vehicleNumber'];
    const fieldStatus = {};
    
    requiredFields.forEach(field => {
      fieldStatus[field] = {
        value: driver[field],
        hasValue: !!driver[field],
        isNotEmpty: driver[field] && driver[field].toString().trim() !== ''
      };
    });
    
    console.log('🔍 Profile Completion Check:', {
      driverEmail: driver.email,
      fieldStatus,
      isComplete: requiredFields.every(field => 
        driver[field] && driver[field].toString().trim() !== ''
      )
    });
    
    return requiredFields.every(field => 
      driver[field] && driver[field].toString().trim() !== ''
    );
  };

  // Redirect to auth if not authenticated
  useEffect(() => {
    console.log('🔍 Dashboard Auth Check:', { 
      loading, 
      hasDriver: !!driver, 
      driverEmail: driver?.email,
      profileComplete: driver ? isProfileComplete(driver) : false,
      timestamp: new Date().toISOString()
    });
    
    // If not loading and no driver, immediately redirect
    if (!loading && !driver) {
      console.log('🚨 No authenticated driver found - redirecting to login immediately');
      router.replace('/auth/login');
      return;
    }
    
    // Extra safety check - if driver becomes null while not loading
    if (!loading && driver === null) {
      console.log('🚨 Driver state is explicitly null - forcing redirect');
      router.replace('/auth/login');
    }
  }, [driver, loading, router]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Ionicons name="car-outline" size={48} color="#007AFF" />
        <Text className="text-base text-gray-600 mt-4">Loading your dashboard...</Text>
        <Text className="text-sm text-gray-400 mt-2">Setting up your driver profile</Text>
      </View>
    );
  }

  if (!driver) return null;

  // Show profile completion form if profile is incomplete
  if (!isProfileComplete(driver)) {
    console.log('📝 Driver profile incomplete - showing details form');
    return <DriverDetailsForm />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Header */}
          <View className="mb-8 mt-10">
            <Text className="text-base text-gray-600">Welcome back sir,</Text>
            <Text className="text-2xl font-bold text-gray-900">{driver.name}!</Text>
          </View>

          {/* Location Permission Notice */}
          {!isLocationTracking && (
            <TouchableOpacity 
              style={styles.locationBanner}
              onPress={requestLocationPermission}
            >
              <Ionicons name="location-outline" size={28} color="#FF6B35" />
              <View style={styles.locationBannerContent}>
                <Text style={styles.locationBannerTitle}>Enable Location Tracking</Text>
                <Text style={styles.locationBannerSubtitle}>
                  Tap to enable GPS tracking for ride services
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FF6B35" />
            </TouchableOpacity>
          )}

          {/* Live Map View */}
          <View className="mb-5">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Your Location</Text>
            <LiveMapView height={250} />
          </View>

      {/* Status Card */}
      <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm">
        <View className="flex-row justify-between items-center mb-5">
          <Text className="text-lg font-semibold text-gray-900">Driver Status</Text>
          <View className="flex-row items-center bg-green-100 px-3 py-1.5 rounded-full">
            <View className="w-2 h-2 rounded-full bg-green-600 mr-1.5" />
            <Text className="text-sm text-green-600 font-medium">Available</Text>
          </View>
        </View>
        
        <View className="flex-row justify-around">
          <View className="items-center">
            <Ionicons name="star" size={24} color="#ffd700" />
            <Text className="text-xl font-bold text-gray-900 mt-2">5.0</Text>
            <Text className="text-xs text-gray-600 mt-1">Rating</Text>
          </View>
          
          <View className="items-center">
            <Ionicons name="car" size={24} color="#007AFF" />
            <Text className="text-xl font-bold text-gray-900 mt-2">0</Text>
            <Text className="text-xs text-gray-600 mt-1">Rides Today</Text>
          </View>
          
          <View className="items-center">
            <Ionicons name="cash" size={24} color="#28a745" />
            <Text className="text-xl font-bold text-gray-900 mt-2">$0</Text>
            <Text className="text-xs text-gray-600 mt-1">Earnings</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row flex-wrap justify-between">
        <TouchableOpacity className="w-[48%] bg-white rounded-xl p-5 items-center mb-4 shadow-sm">
          <Ionicons name="person-circle-outline" size={24} color="#007AFF" />
          <Text className="text-sm text-blue-500 mt-2 font-medium">Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="w-[48%] bg-white rounded-xl p-5 items-center mb-4 shadow-sm">
          <Ionicons name="car-outline" size={24} color="#007AFF" />
          <Text className="text-sm text-blue-500 mt-2 font-medium">Vehicle Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="w-[48%] bg-white rounded-xl p-5 items-center mb-4 shadow-sm">
          <Ionicons name="document-text-outline" size={24} color="#007AFF" />
          <Text className="text-sm text-blue-500 mt-2 font-medium">Trip History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="w-[48%] bg-white rounded-xl p-5 items-center mb-4 shadow-sm">
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
          <Text className="text-sm text-blue-500 mt-2 font-medium">Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View className="mt-8 pb-5">
        <View className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <Text className="text-xs text-gray-500 mb-0.5">Logged in as: {driver?.email}</Text>
          <Text className="text-xs text-gray-500">Driver ID: {driver?.mongoid || driver?.id}</Text>
        </View>
      </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  locationBanner: {
    backgroundColor: '#fff3f0',
    borderColor: '#FF6B35',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationBannerContent: {
    flex: 1,
    marginLeft: 12,
  },
  locationBannerTitle: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  locationBannerSubtitle: {
    color: '#FF6B35',
    fontSize: 14,
    marginTop: 4,
  },
});