import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useDriverContext } from '../context/DriverContext';

const ActiveDelivery = () => {
  const { driver } = useDriverContext();
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [proximityDistance, setProximityDistance] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const locationIntervalRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (driver) {
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

  const fetchActiveDelivery = async () => {
    try {
      const token = await driver?.getIdToken();
      // Use the driver's firebaseUid instead of uid
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/drivers/delivery/active/${driver.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
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
      const token = await driver?.getIdToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/drivers/delivery/proximity/${driver.uid}/${activeDelivery.vendorId._id}`,
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
      const token = await driver?.getIdToken();
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
        const token = await driver?.getIdToken();
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Loading delivery details...</Text>
      </View>
    );
  }

  if (!activeDelivery) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 20 }}>
        <Ionicons name="car-outline" size={64} color="#FF6B35" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 20, textAlign: 'center' }}>
          No Active Delivery
        </Text>
        <Text style={{ fontSize: 16, color: '#666', marginTop: 10, textAlign: 'center' }}>
          You don't have any active deliveries at the moment.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#FF6B35',
            paddingHorizontal: 30,
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 20
          }}
          onPress={() => router.push('/dashboard')}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            Go to Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f8f9fa' }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchActiveDelivery} />
      }
    >
      <View style={{ padding: 20 }}>
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#333' }}>
            Active Delivery
          </Text>
          <Text style={{ fontSize: 16, color: '#666', marginTop: 5 }}>
            Status: {activeDelivery.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {/* Vendor Info */}
        <View style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>
            Pickup Location
          </Text>
          <Text style={{ fontSize: 16, color: '#333' }}>{activeDelivery.vendorId.name}</Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>
            {activeDelivery.vendorId.address}
          </Text>
        </View>

        {/* Proximity Check */}
        {activeDelivery.status === 'assigned' && (
          <View style={{
            backgroundColor: isWithinRange ? '#d4edda' : '#f8d7da',
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            borderColor: isWithinRange ? '#c3e6cb' : '#f5c6cb',
            borderWidth: 1
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: isWithinRange ? '#155724' : '#721c24',
              marginBottom: 5
            }}>
              {isWithinRange ? '✅ Ready to Start' : '⚠️ Not in Range'}
            </Text>
            <Text style={{ color: isWithinRange ? '#155724' : '#721c24' }}>
              {proximityDistance !== null 
                ? `Distance to vendor: ${proximityDistance}m ${isWithinRange ? '(Within range)' : '(Must be within 500m)'}`
                : 'Checking distance...'}
            </Text>
            
            <TouchableOpacity
              style={{
                backgroundColor: isWithinRange ? '#28a745' : '#6c757d',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                marginTop: 15,
                opacity: isWithinRange ? 1 : 0.6
              }}
              onPress={startDelivery}
              disabled={!isWithinRange}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                {isWithinRange ? 'Start Delivery' : 'Move Closer to Start'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delivery Status */}
        {activeDelivery.status === 'started' && (
          <View style={{
            backgroundColor: '#fff3cd',
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            borderColor: '#ffeaa7',
            borderWidth: 1
          }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#856404', marginBottom: 5 }}>
              🚚 Delivery in Progress
            </Text>
            <Text style={{ color: '#856404' }}>
              Your location is being tracked and shared with customers.
            </Text>
          </View>
        )}

        {/* Customer List */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 12,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
              Delivery Route ({activeDelivery.customers.length} customers)
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>
              Estimated total time: {activeDelivery.estimatedTotalTime} minutes
            </Text>
          </View>
          
          {activeDelivery.customers.map((customer, index) => (
            <View key={customer.customerId._id} style={{
              padding: 20,
              borderBottomWidth: index < activeDelivery.customers.length - 1 ? 1 : 0,
              borderBottomColor: '#eee'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#FF6B35',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                    {customer.deliveryOrder}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', flex: 1 }}>
                  {customer.customerId.name}
                </Text>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: customer.status === 'delivered' ? '#d4edda' : '#fff3cd'
                }}>
                  <Text style={{
                    fontSize: 12,
                    color: customer.status === 'delivered' ? '#155724' : '#856404',
                    fontWeight: '600'
                  }}>
                    {customer.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={{ fontSize: 14, color: '#666', marginLeft: 36, marginBottom: 4 }}>
                📍 {customer.address}
              </Text>
              
              <Text style={{ fontSize: 14, color: '#666', marginLeft: 36 }}>
                📞 {customer.customerId.contactNumber}
              </Text>
              
              <Text style={{ fontSize: 12, color: '#888', marginLeft: 36, marginTop: 4 }}>
                ETA: {new Date(customer.estimatedArrival).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#FF6B35',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 20
          }}
          onPress={getCurrentLocation}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
            <Ionicons name="location-outline" size={16} color="white" /> Update My Location
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ActiveDelivery;