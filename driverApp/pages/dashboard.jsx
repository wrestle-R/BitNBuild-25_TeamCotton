import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDriverContext } from '../context/DriverContext';
import { Ionicons } from '@expo/vector-icons';
import DriverDetailsForm from '../components/DriverDetailsForm';
import '../global.css';

export default function Dashboard() {
  const { driver, loading } = useDriverContext();
  const router = useRouter();

  // Check if driver profile is complete
  const isProfileComplete = (driver) => {
    if (!driver) return false;
    
    const requiredFields = ['contactNumber', 'vehicleType', 'vehicleNumber'];
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
        <Text className="text-base text-gray-600">Loading...</Text>
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