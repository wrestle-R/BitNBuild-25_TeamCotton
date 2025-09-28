import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useDriverContext } from '../context/DriverContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyDeliveries = () => {
  const { driver } = useDriverContext();
  const [deliveries, setDeliveries] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [proximityDistance, setProximityDistance] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedTab, setSelectedTab] = useState('active'); // active, completed, all
  const locationIntervalRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (driver) {
      fetchAllDeliveries();
      fetchActiveDelivery();
    }
  }, [driver]);

  useEffect(() => {
    if (activeDelivery && activeDelivery.status === 'started') {
      startLocationTracking();
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [activeDelivery]);

  const fetchAllDeliveries = async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) {
        console.error('❌ No token found in AsyncStorage');
        setLoading(false);
        return;
      }

      if (!driver?.mongoid) {
        console.error('❌ No driver mongoid available');
        setLoading(false);
        return;
      }

      console.log('� Driver mongoid:', driver.mongoid);
      console.log('📞 Making API call to fetch deliveries...');

      // Fetch all deliveries for the driver using their MongoDB ObjectId
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/drivers/deliveries/${driver.mongoid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API call failed:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to fetch deliveries');
        return;
      }

      const data = await response.json();
      console.log('📦 Fetch deliveries response:', data);

      if (data.success) {
        setDeliveries(data.deliveries || []);
        console.log('✅ Successfully loaded', data.deliveries?.length || 0, 'deliveries');
        console.log('👤 Driver info:', data.driver);
        
        // Show success message if deliveries found
        if (data.deliveries && data.deliveries.length > 0) {
          console.log('🎉', data.message);
        } else {
          console.log('ℹ️ No deliveries found for this driver');
        }
      } else {
        console.error('❌ API returned unsuccessful response:', data.message);
        Alert.alert('Error', data.message || 'Failed to fetch deliveries');
      }
    } catch (error) {
      console.error('❌ Error fetching all deliveries:', error);
      Alert.alert('Network Error', 'Unable to fetch deliveries. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveDelivery = async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) {
        console.error('No token found in AsyncStorage');
        setLoading(false);
        return;
      }

      // Use the driver's mongoid instead of uid
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/drivers/delivery/active/${driver.mongoid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📦 Fetch active delivery response:', data);
      if (data.success) {
        setActiveDelivery(data.delivery);
      }
    } catch (error) {
      console.error('Error fetching active delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkProximityToVendor = async () => {
    if (!activeDelivery || !currentLocation) return;

    try {
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) {
        console.error('No token found for proximity check');
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/drivers/delivery/proximity/${driver.mongoid}/${activeDelivery.vendorId._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setIsWithinRange(data.isWithinRange);
        setProximityDistance(data.distance);
      }
    } catch (error) {
      console.error('Error checking proximity:', error);
    }
  };

  const startDelivery = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available');
      return;
    }

    if (!isWithinRange) {
      Alert.alert(
        'Not in Range', 
        `You are ${proximityDistance}m away from the vendor. You must be within 500m to start delivery.`
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/drivers/delivery/${activeDelivery._id}/start`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            driverLocation: {
              type: 'Point',
              coordinates: [currentLocation.longitude, currentLocation.latitude]
            }
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Delivery started successfully!');
        setActiveDelivery(prev => ({ ...prev, status: 'started', startedAt: new Date() }));
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error starting delivery:', error);
      Alert.alert('Error', 'Failed to start delivery');
    }
  };

  // Fix the location tracking interval
  const startLocationTracking = () => {
    locationIntervalRef.current = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setCurrentLocation(location.coords);

        // Update location on server
        const token = await AsyncStorage.getItem('driver_token');
        if (token) {
          await fetch(
            `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/drivers/delivery/${activeDelivery._id}/location`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                location: {
                  type: 'Point',
                  coordinates: [location.coords.longitude, location.coords.latitude]
                }
              })
            }
          );
        }
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }, 15000); // Update every 15 seconds
  };

  useEffect(() => {
    if (activeDelivery && currentLocation) {
      checkProximityToVendor();
    }
  }, [activeDelivery, currentLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location.coords);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Filter deliveries based on selected tab
  const getFilteredDeliveries = () => {
    switch (selectedTab) {
      case 'active':
        return deliveries.filter(d => ['assigned', 'started', 'in_progress'].includes(d.status));
      case 'completed':
        return deliveries.filter(d => d.status === 'completed');
      case 'all':
      default:
        return deliveries;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return '#f59e0b'; // amber
      case 'started': 
      case 'in_progress': return '#3b82f6'; // blue
      case 'completed': return '#10b981'; // green
      case 'cancelled': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned': return 'time-outline';
      case 'started': 
      case 'in_progress': return 'car-outline';
      case 'completed': return 'checkmark-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  // Function to format address object into readable string
  const formatAddress = (addressObj) => {
    if (!addressObj) return 'Address not available';
    
    // If it's already a string, return it
    if (typeof addressObj === 'string') return addressObj;
    
    // If it's an object, format it properly
    const parts = [];
    if (addressObj.street) parts.push(addressObj.street);
    if (addressObj.city) parts.push(addressObj.city);
    if (addressObj.state) parts.push(addressObj.state);
    if (addressObj.pincode) parts.push(addressObj.pincode);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  // Function to safely render any value as string
  const safeRender = (value, fallback = 'Not available') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') {
      // If it's an address object, format it
      if (value.street || value.city || value.state || value.pincode) {
        return formatAddress(value);
      }
      // For other objects, return fallback
      return fallback;
    }
    return String(value);
  };

  const DeliveryCard = ({ delivery }) => (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.1)',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(139, 92, 246, 0.1)'
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4c1d95' }}>
            {safeRender(delivery.vendorId?.name, 'Unknown Vendor')}
          </Text>
          <Text style={{ fontSize: 12, color: '#8b5cf6', marginTop: 2 }}>
            ID: {delivery._id?.toString()?.substring(0, 8)}...
          </Text>
        </View>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: `${getStatusColor(delivery.status)}15`,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
        }}>
          <Ionicons name={getStatusIcon(delivery.status)} size={16} color={getStatusColor(delivery.status)} />
          <Text style={{
            color: getStatusColor(delivery.status),
            fontSize: 12,
            fontWeight: '600',
            marginLeft: 4,
            textTransform: 'uppercase'
          }}>
            {delivery.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 20 }}>
        {/* Vendor Address */}
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#4c1d95', marginBottom: 5 }}>
            📍 Pickup Location
          </Text>
          <Text style={{ fontSize: 14, color: '#8b5cf6' }}>
            {safeRender(delivery.vendorId?.address)}
          </Text>
          {delivery.vendorId?.contactNumber && (
            <Text style={{ fontSize: 14, color: '#8b5cf6', marginTop: 2 }}>
              📞 {safeRender(delivery.vendorId.contactNumber)}
            </Text>
          )}
        </View>
        
        {/* Delivery Info */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          marginBottom: 15,
          backgroundColor: '#f8f7ff',
          padding: 12,
          borderRadius: 8
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#6b46c1', fontWeight: '600' }}>
              👥 {delivery.customers?.length || 0}
            </Text>
            <Text style={{ fontSize: 12, color: '#8b5cf6' }}>Customers</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#6b46c1', fontWeight: '600' }}>
              ⏱️ {delivery.estimatedTotalTime || 'N/A'}
            </Text>
            <Text style={{ fontSize: 12, color: '#8b5cf6' }}>Minutes</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#6b46c1', fontWeight: '600' }}>
              📏 {delivery.totalDistance ? (delivery.totalDistance / 1000).toFixed(1) : 'N/A'}
            </Text>
            <Text style={{ fontSize: 12, color: '#8b5cf6' }}>KM</Text>
          </View>
        </View>

        {/* Customer List Preview */}
        {delivery.customers && delivery.customers.length > 0 && (
          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#4c1d95', marginBottom: 8 }}>
              🚚 Delivery Route
            </Text>
            {delivery.customers.slice(0, 2).map((customer, index) => (
              <View key={customer.customerId?._id || index} style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: 6,
                paddingHorizontal: 8
              }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#8b5cf6',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 8
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {customer.deliveryOrder || index + 1}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, color: '#4c1d95', flex: 1 }}>
                  {safeRender(customer.customerId?.name, 'Unknown Customer')}
                </Text>
                <Text style={{ fontSize: 12, color: '#8b5cf6' }}>
                  {safeRender(customer.status?.replace('_', ' ')?.toUpperCase(), 'PENDING')}
                </Text>
              </View>
            ))}
            {delivery.customers.length > 2 && (
              <Text style={{ fontSize: 12, color: '#8b5cf6', textAlign: 'center', marginTop: 4 }}>
                +{delivery.customers.length - 2} more customers
              </Text>
            )}
          </View>
        )}

        {/* Timestamps */}
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 12, color: '#a78bfa' }}>
            📅 Created: {new Date(delivery.createdAt).toLocaleDateString()} {new Date(delivery.createdAt).toLocaleTimeString()}
          </Text>
          {delivery.startedAt && (
            <Text style={{ fontSize: 12, color: '#a78bfa', marginTop: 2 }}>
              🚀 Started: {new Date(delivery.startedAt).toLocaleDateString()} {new Date(delivery.startedAt).toLocaleTimeString()}
            </Text>
          )}
          {delivery.completedAt && (
            <Text style={{ fontSize: 12, color: '#10b981', marginTop: 2 }}>
              ✅ Completed: {new Date(delivery.completedAt).toLocaleDateString()} {new Date(delivery.completedAt).toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* Action button for active deliveries */}
        {['assigned', 'started', 'in_progress'].includes(delivery.status) && (
          <TouchableOpacity
            style={{
              backgroundColor: '#8b5cf6',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              elevation: 2,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={() => {
              setActiveDelivery(delivery);
              Alert.alert(
                'Active Delivery',
                `This is your ${delivery.status} delivery from ${safeRender(delivery.vendorId?.name, 'Unknown Vendor')}`,
                [{ text: 'OK' }]
              );
            }}
          >
            <Ionicons name="eye-outline" size={18} color="white" />
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
              View Details
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f7ff' }}>
        <Ionicons name="refresh-outline" size={48} color="#8b5cf6" />
        <Text style={{ fontSize: 18, color: '#8b5cf6', marginTop: 16 }}>Loading deliveries...</Text>
      </View>
    );
  }

  const refreshData = () => {
    setLoading(true);
    fetchAllDeliveries();
    fetchActiveDelivery();
  };

  const filteredDeliveries = getFilteredDeliveries();

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f7ff' }}>
      {/* Header */}
      <View style={{ paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#4c1d95' }}>
          My Deliveries
        </Text>
        <Text style={{ fontSize: 16, color: '#8b5cf6', marginTop: 5 }}>
          Manage and track all your deliveries
        </Text>
      </View>

      {/* Tabs */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
      }}>
        {[
          { key: 'active', label: 'Active', count: deliveries.filter(d => ['assigned', 'started', 'in_progress'].includes(d.status)).length },
          { key: 'completed', label: 'Completed', count: deliveries.filter(d => d.status === 'completed').length },
          { key: 'all', label: 'All', count: deliveries.length }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginHorizontal: 4,
              borderRadius: 12,
              backgroundColor: selectedTab === tab.key ? '#8b5cf6' : 'white',
              elevation: selectedTab === tab.key ? 3 : 1,
              shadowColor: selectedTab === tab.key ? '#8b5cf6' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={{
              color: selectedTab === tab.key ? 'white' : '#6b46c1',
              fontSize: 14,
              fontWeight: '600',
              textAlign: 'center'
            }}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Delivery List */}
      <FlatList
        data={filteredDeliveries}
        renderItem={({ item }) => <DeliveryCard delivery={item} />}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} />
        }
        ListEmptyComponent={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 }}>
            <Ionicons 
              name={selectedTab === 'active' ? "car-outline" : selectedTab === 'completed' ? "checkmark-circle-outline" : "list-outline"} 
              size={64} 
              color="#8b5cf6" 
            />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#4c1d95', marginTop: 20, textAlign: 'center' }}>
              No {selectedTab} deliveries
            </Text>
            <Text style={{ fontSize: 16, color: '#6b46c1', marginTop: 10, textAlign: 'center', marginHorizontal: 40 }}>
              {selectedTab === 'active' 
                ? "You don't have any active deliveries at the moment." 
                : selectedTab === 'completed'
                ? "You haven't completed any deliveries yet."
                : "No deliveries found for your account."}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#8b5cf6',
                paddingHorizontal: 30,
                paddingVertical: 12,
                borderRadius: 8,
                marginTop: 20,
                elevation: 3,
                shadowColor: '#8b5cf6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                Go to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default MyDeliveries;