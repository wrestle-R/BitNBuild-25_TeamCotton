import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useDriverContext } from '../context/DriverContext';
import { Ionicons } from '@expo/vector-icons';
import '../global.css';

export default function Profile() {
  const { driver, loading, logout } = useDriverContext();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log('🚪 Direct logout initiated from profile');
      
      // Call logout to clear everything
      await logout();
      
      // Immediately navigate to login
      console.log('🧭 Navigating to login page from profile');
      router.replace('/auth/login');
      
    } catch (error) {
      console.error('💥 Logout error:', error);
      // Even if logout fails, navigate to login for security
      router.replace('/auth/login');
    }
  };

  const handleEditProfile = () => {
    console.log('Edit Profile clicked - feature coming soon');
  };

  const handleChangePassword = () => {
    console.log('Change Password clicked - feature coming soon');
  };

  const handleSupport = () => {
    console.log('Support clicked - feature coming soon');
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-base text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!driver) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-base text-gray-600">Please log in to view your profile</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Header */}
          <View className="items-center mt-10 mb-8">
            <Text className="text-2xl font-bold text-gray-900 mb-2">Driver Profile</Text>
            <Text className="text-base text-gray-600">Manage your account settings</Text>
          </View>

          {/* Profile Card */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            {/* Profile Picture */}
            <View className="items-center mb-6">
              <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="person" size={40} color="#007AFF" />
              </View>
              <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-full">
                <Text className="text-white text-sm font-medium">Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View className="space-y-4">
              <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                <Ionicons name="person-outline" size={20} color="#666" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Full Name</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {driver.name || 'Not provided'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                <Ionicons name="mail-outline" size={20} color="#666" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Email</Text>
                  <Text className="text-base font-medium text-gray-900">{driver.email}</Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                <Ionicons name="call-outline" size={20} color="#666" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Phone</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {driver.contactNumber || 'Not provided'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                <Ionicons name="car-outline" size={20} color="#666" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Vehicle Type</Text>
                  <Text className="text-base font-medium text-gray-900 capitalize">
                    {driver.vehicleType || 'Not provided'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                <Ionicons name="car-sport-outline" size={20} color="#666" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Vehicle Number</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {driver.vehicleNumber || 'Not provided'}
                  </Text>
                </View>
              </View>

              {driver.address && (
                <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-600">Address</Text>
                    <Text className="text-base font-medium text-gray-900">
                      {driver.address}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity 
              className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
              onPress={handleEditProfile}
            >
              <View className="flex-row items-center">
                <Ionicons name="create-outline" size={24} color="#007AFF" />
                <Text className="text-base font-medium text-gray-900 ml-3">Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
              onPress={handleChangePassword}
            >
              <View className="flex-row items-center">
                <Ionicons name="lock-closed-outline" size={24} color="#007AFF" />
                <Text className="text-base font-medium text-gray-900 ml-3">Change Password</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
              onPress={handleSupport}
            >
              <View className="flex-row items-center">
                <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
                <Text className="text-base font-medium text-gray-900 ml-3">Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
              onPress={handleLogout}
            >
              <View className="flex-row items-center">
                <Ionicons name="log-out-outline" size={24} color="#dc3545" />
                <Text className="text-base font-medium text-red-600 ml-3">Sign Out</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#dc3545" />
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View className="mt-8 p-4 bg-gray-100 rounded-lg">
            <Text className="text-xs text-gray-500 text-center">
              Driver App v1.0.0
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              Logged in as: {driver.email}
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              Driver ID: {driver.mongoid || driver.id || 'N/A'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}