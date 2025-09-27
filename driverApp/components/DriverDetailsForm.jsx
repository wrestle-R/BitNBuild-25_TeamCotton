import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDriverContext } from '../context/DriverContext';
import { Ionicons } from '@expo/vector-icons';
import '../global.css';

const DriverDetailsForm = () => {
  const router = useRouter();
  const { driver, updateDriverProfile, loading } = useDriverContext();
  
  console.log('🔍 DriverDetailsForm - Current driver data:', {
    email: driver?.email,
    contactNumber: driver?.contactNumber,
    vehicleType: driver?.vehicleType,
    vehicleNumber: driver?.vehicleNumber,
  });
  
  const [formData, setFormData] = useState({
    contactNumber: driver?.contactNumber || '',
    vehicleType: driver?.vehicleType || 'bike',
    vehicleNumber: driver?.vehicleNumber || ''
  });
  
  const [formLoading, setFormLoading] = useState(false);

  const vehicleTypes = [
    { value: 'bike', label: '🏍️ Bike', icon: 'bicycle-outline' },
    { value: 'car', label: '🚗 Car', icon: 'car-outline' },
    { value: 'truck', label: '🚚 Truck', icon: 'bus-outline' },
    { value: 'van', label: '🚐 Van', icon: 'car-sport-outline' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.contactNumber.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return false;
    }
    
    if (formData.contactNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number (at least 10 digits)');
      return false;
    }
    
    if (!formData.vehicleNumber.trim()) {
      Alert.alert('Error', 'Vehicle number is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setFormLoading(true);
      console.log('📝 Submitting driver details:', formData);

      const result = await updateDriverProfile(formData);
      
      console.log('📝 Profile update result:', result);
      
      if (result.success) {
        console.log('✅ Profile updated successfully, updated driver:', result.user);
        Alert.alert(
          'Profile Updated!',
          'Your driver profile has been completed successfully.',
          [
            {
              text: 'Continue',
              onPress: () => {
                console.log('✅ Driver details completed, navigating to dashboard');
                router.replace('/(tabs)');
              }
            }
          ]
        );
      } else {
        console.error('❌ Profile update failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('💥 Error submitting driver details:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Completion?',
      'You can complete your profile later from the Profile tab. Some features may be limited until your profile is complete.',
      [
        {
          text: 'Complete Now',
          style: 'cancel'
        },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            console.log('⏭️ Skipping driver details form');
            router.replace('/(tabs)');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="text-base text-gray-600 mt-3">Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Header */}
          <View className="items-center mt-12 mb-8">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="car" size={32} color="#007AFF" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</Text>
            <Text className="text-base text-gray-600 text-center">
              Please provide your phone number and vehicle details to start accepting rides
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-5">
            {/* Phone Number */}
            <View>
              <Text className="text-base font-medium text-gray-900 mb-2">Phone Number *</Text>
              <View className="flex-row items-center bg-white rounded-xl px-4 py-4 border border-gray-200">
                <Ionicons name="call-outline" size={20} color="#666" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  value={formData.contactNumber}
                  onChangeText={(value) => handleInputChange('contactNumber', value)}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
            </View>

            {/* Vehicle Type */}
            <View>
              <Text className="text-base font-medium text-gray-900 mb-3">Vehicle Type *</Text>
              <View className="flex-row flex-wrap justify-between">
                {vehicleTypes.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.value}
                    className={`w-[48%] p-4 rounded-xl border-2 mb-3 ${
                      formData.vehicleType === vehicle.value
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white border-gray-200'
                    }`}
                    onPress={() => handleInputChange('vehicleType', vehicle.value)}
                  >
                    <View className="items-center">
                      <Ionicons 
                        name={vehicle.icon} 
                        size={24} 
                        color={formData.vehicleType === vehicle.value ? '#007AFF' : '#666'} 
                      />
                      <Text className={`text-sm font-medium mt-2 ${
                        formData.vehicleType === vehicle.value ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {vehicle.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Vehicle Number */}
            <View>
              <Text className="text-base font-medium text-gray-900 mb-2">Vehicle Number *</Text>
              <View className="flex-row items-center bg-white rounded-xl px-4 py-4 border border-gray-200">
                <Ionicons name="car-outline" size={20} color="#666" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="e.g., MH12AB1234"
                  placeholderTextColor="#999"
                  value={formData.vehicleNumber}
                  onChangeText={(value) => handleInputChange('vehicleNumber', value.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={12}
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mt-8 space-y-3">
            <TouchableOpacity
              className={`bg-blue-600 rounded-xl py-4 items-center ${
                formLoading ? 'opacity-50' : ''
              }`}
              onPress={handleSubmit}
              disabled={formLoading}
            >
              {formLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white text-base font-semibold ml-2">
                    Updating Profile...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-base font-semibold">
                  Complete Profile
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-200 rounded-xl py-4 items-center"
              onPress={handleSkip}
              disabled={formLoading}
            >
              <Text className="text-gray-700 text-base font-medium">
                Skip for Now
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle-outline" size={20} color="#f59e0b" />
              <Text className="text-sm font-medium text-yellow-800 ml-2">
                Profile Completion Required
              </Text>
            </View>
            <Text className="text-sm text-yellow-700">
              Complete your profile to start accepting ride requests and access all driver features.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DriverDetailsForm;