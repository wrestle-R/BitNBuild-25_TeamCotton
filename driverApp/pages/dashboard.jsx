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
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: '#f8f7ff' }}>
        <Ionicons name="car-outline" size={48} color="#8b5cf6" />
        <Text className="text-base mt-4" style={{ color: '#6b46c1' }}>Loading your dashboard...</Text>
        <Text className="text-sm mt-2" style={{ color: '#8b5cf6' }}>Setting up your driver profile</Text>
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
    <View className="flex-1" style={{ backgroundColor: '#f8f7ff' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Header */}
          <View className="mb-8 mt-10" style={styles.headerSection}>
            <Text className="text-base" style={{ color: '#8b5cf6' }}>Welcome back sir,</Text>
            <Text className="text-2xl font-bold" style={{ color: '#4c1d95' }}>{driver.name}!</Text>
          </View>

          {/* Location Permission Notice */}
          {!isLocationTracking && (
            <TouchableOpacity 
              style={styles.locationBanner}
              onPress={requestLocationPermission}
            >
              <Ionicons name="location-outline" size={28} color="#8b5cf6" />
              <View style={styles.locationBannerContent}>
                <Text style={styles.locationBannerTitle}>Enable Location Tracking</Text>
                <Text style={styles.locationBannerSubtitle}>
                  Tap to enable GPS tracking for ride services
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#8b5cf6" />
            </TouchableOpacity>
          )}

          {/* Live Map View */}
          <View className="mb-5">
            <Text className="text-lg font-semibold mb-3" style={{ color: '#4c1d95' }}>Your Location</Text>
            <LiveMapView height={250} />
          </View>

      {/* Status Card */}
      <View className="rounded-2xl p-5 mb-5" style={styles.statusCard}>
        <View className="flex-row justify-between items-center mb-5">
          <Text className="text-lg font-semibold" style={{ color: '#4c1d95' }}>Driver Status</Text>
          <View className="flex-row items-center px-3 py-1.5 rounded-full" style={styles.statusBadge}>
            <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: '#10b981' }} />
            <Text className="text-sm font-medium" style={{ color: '#059669' }}>Available</Text>
          </View>
        </View>
        
        <View className="flex-row justify-around">
          <View className="items-center">
            <Ionicons name="star" size={24} color="#fbbf24" />
            <Text className="text-xl font-bold mt-2" style={{ color: '#4c1d95' }}>5.0</Text>
            <Text className="text-xs mt-1" style={{ color: '#8b5cf6' }}>Rating</Text>
          </View>
          
          <View className="items-center">
            <Ionicons name="car" size={24} color="#8b5cf6" />
            <Text className="text-xl font-bold mt-2" style={{ color: '#4c1d95' }}>0</Text>
            <Text className="text-xs mt-1" style={{ color: '#8b5cf6' }}>Rides Today</Text>
          </View>
          
          <View className="items-center">
            <Ionicons name="cash" size={24} color="#10b981" />
            <Text className="text-xl font-bold mt-2" style={{ color: '#4c1d95' }}>$0</Text>
            <Text className="text-xs mt-1" style={{ color: '#8b5cf6' }}>Earnings</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row flex-wrap justify-between">
        <TouchableOpacity className="w-[48%] rounded-xl p-5 items-center mb-4" style={styles.actionButton}>
          <Ionicons name="person-circle-outline" size={24} color="#8b5cf6" />
          <Text className="text-sm mt-2 font-medium" style={{ color: '#6b46c1' }}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="w-[48%] rounded-xl p-5 items-center mb-4" style={styles.actionButton}>
          <Ionicons name="car-outline" size={24} color="#8b5cf6" />
          <Text className="text-sm mt-2 font-medium" style={{ color: '#6b46c1' }}>Vehicle Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="w-[48%] rounded-xl p-5 items-center mb-4" style={styles.actionButton}>
          <Ionicons name="document-text-outline" size={24} color="#8b5cf6" />
          <Text className="text-sm mt-2 font-medium" style={{ color: '#6b46c1' }}>Trip History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="w-[48%] rounded-xl p-5 items-center mb-4" style={styles.actionButton}>
          <Ionicons name="settings-outline" size={24} color="#8b5cf6" />
          <Text className="text-sm mt-2 font-medium" style={{ color: '#6b46c1' }}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View className="mt-8 pb-5">
        <View className="p-4 rounded-lg" style={styles.quickStats}>
          <Text className="text-xs mb-0.5" style={{ color: '#6b46c1' }}>Logged in as: {driver?.email}</Text>
          <Text className="text-xs" style={{ color: '#6b46c1' }}>Driver ID: {driver?.mongoid || driver?.id}</Text>
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
    backgroundColor: '#f8f7ff',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 20,
    marginHorizontal: -4,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  actionButton: {
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  quickStats: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  locationBanner: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: '#8b5cf6',
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  locationBannerContent: {
    flex: 1,
    marginLeft: 12,
  },
  locationBannerTitle: {
    color: '#6b46c1',
    fontSize: 16,
    fontWeight: '600',
  },
  locationBannerSubtitle: {
    color: '#8b5cf6',
    fontSize: 14,
    marginTop: 4,
  },
});