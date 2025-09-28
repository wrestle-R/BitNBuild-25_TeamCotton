import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DriverDeliveryMap = ({ delivery, driverLocation }) => {
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    if (!delivery || !delivery.vendorId?.address) {
      return;
    }

    // Calculate basic route info for web display
    const customers = delivery.customers?.filter(customer => 
      customer.customerId?.address?.coordinates
    ) || [];

    setRouteInfo({
      totalTime: customers.length * 15, // Estimated 15 min per stop
      totalDistance: (customers.length * 2.5).toFixed(1), // Estimated 2.5km per stop
      customers: customers.length,
      optimizedOrder: customers.map((customer, index) => ({
        id: customer.customerId?._id,
        name: customer.customerId?.name || `Customer ${index + 1}`,
        address: customer.customerId?.address
      }))
    });
  }, [delivery]);

  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pincode) parts.push(address.pincode);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  const safeRender = (value, fallback = 'Not available') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') {
      if (value.street || value.city || value.state || value.pincode) {
        return formatAddress(value);
      }
      return fallback;
    }
    return String(value);
  };

  if (!delivery || !delivery.vendorId?.address) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f8f7ff',
        padding: 20
      }}>
        <Ionicons name="map-outline" size={64} color="#8b5cf6" />
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: '#4c1d95', 
          marginTop: 16,
          textAlign: 'center'
        }}>
          Map Data Not Available
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f7ff' }}>
      {/* Web-specific header */}
      <View style={{
        backgroundColor: '#8b5cf6',
        padding: 20,
        alignItems: 'center'
      }}>
        <Ionicons name="map-outline" size={48} color="white" />
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: 'white',
          marginTop: 8
        }}>
          🗺️ Delivery Route Map
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#e0e7ff',
          marginTop: 4,
          textAlign: 'center'
        }}>
          Interactive map with live tracking available on mobile devices
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Route Info Cards */}
        {routeInfo && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#4c1d95',
              marginBottom: 16
            }}>
              📊 Route Summary
            </Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {/* Route Stats */}
              <View style={{
                backgroundColor: 'white',
                padding: 16,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#8b5cf6',
                flex: 1,
                minWidth: 200,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2
              }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#4c1d95', marginBottom: 8 }}>
                  📍 Route Optimization
                </Text>
                <Text style={{ fontSize: 13, color: '#6b46c1', marginBottom: 4 }}>
                  🚚 Total Stops: {routeInfo.customers}
                </Text>
                <Text style={{ fontSize: 13, color: '#6b46c1', marginBottom: 4 }}>
                  ⏱️ Est. Time: {routeInfo.totalTime} minutes
                </Text>
                <Text style={{ fontSize: 13, color: '#6b46c1' }}>
                  📏 Est. Distance: {routeInfo.totalDistance} km
                </Text>
              </View>

              {/* Delivery Status */}
              <View style={{
                backgroundColor: 'white',
                padding: 16,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#f59e0b',
                flex: 1,
                minWidth: 200,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2
              }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#92400e', marginBottom: 8 }}>
                  📦 Delivery Status
                </Text>
                <Text style={{ fontSize: 13, color: '#b45309', marginBottom: 4 }}>
                  Status: {delivery.status?.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 13, color: '#b45309', marginBottom: 4 }}>
                  Vendor: {safeRender(delivery.vendorId?.name)}
                </Text>
                <Text style={{ fontSize: 13, color: '#b45309' }}>
                  ID: {delivery._id?.toString()?.substring(0, 8)}...
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Vendor Information */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#4c1d95',
            marginBottom: 16
          }}>
            🏪 Vendor Details
          </Text>
          
          <View style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#10b981',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2
          }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#065f46', marginBottom: 8 }}>
              {safeRender(delivery.vendorId?.name)}
            </Text>
            <Text style={{ fontSize: 14, color: '#047857', marginBottom: 4 }}>
              📍 {formatAddress(delivery.vendorId?.address)}
            </Text>
            {delivery.vendorId?.contactNumber && (
              <Text style={{ fontSize: 14, color: '#047857' }}>
                📞 {delivery.vendorId.contactNumber}
              </Text>
            )}
          </View>
        </View>

        {/* Customer List */}
        {routeInfo && routeInfo.optimizedOrder.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#4c1d95',
              marginBottom: 16
            }}>
              🛣️ Delivery Sequence ({routeInfo.optimizedOrder.length} stops)
            </Text>
            
            {routeInfo.optimizedOrder.map((customer, index) => (
              <View 
                key={`customer-${customer.id || index}`}
                style={{
                  backgroundColor: 'white',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: '#3b82f6',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{
                    backgroundColor: '#3b82f6',
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e40af', flex: 1 }}>
                    {customer.name}
                  </Text>
                </View>
                
                <Text style={{ fontSize: 14, color: '#1d4ed8', marginLeft: 36 }}>
                  📍 {formatAddress(customer.address)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Driver Location Info */}
        {driverLocation && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#4c1d95',
              marginBottom: 16
            }}>
              🚚 Driver Location
            </Text>
            
            <View style={{
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#f59e0b',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2
            }}>
              <Text style={{ fontSize: 14, color: '#b45309', marginBottom: 4 }}>
                📍 Latitude: {driverLocation.latitude?.toFixed(6)}
              </Text>
              <Text style={{ fontSize: 14, color: '#b45309' }}>
                📍 Longitude: {driverLocation.longitude?.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        {/* Platform Notice */}
        <View style={{
          backgroundColor: '#e0e7ff',
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#c7d2fe',
          marginBottom: 20
        }}>
          <Text style={{
            fontSize: 14,
            color: '#3730a3',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            💡 For the full interactive map experience with live GPS tracking, 
            route optimization, and turn-by-turn navigation, please use the mobile app.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default DriverDeliveryMap;