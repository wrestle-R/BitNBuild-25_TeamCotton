import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DriverDeliveryMap = ({ delivery, driverLocation }) => {
  const [routeInfo, setRouteInfo] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);

  // Hardcoded chat messages
  const chatMessages = [
    { id: 1, sender: 'RusselDaniel', message: 'Where are you', type: 'customer', timestamp: '2:45 PM' },
    { id: 2, sender: 'You', message: 'i am stuck in traffic', type: 'driver', timestamp: '2:46 PM' },
    { id: 3, sender: 'RusselDaniel', message: 'okay', type: 'customer', timestamp: '2:47 PM' }
  ];

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
        padding: 15,
        alignItems: 'center'
      }}>
        <Ionicons name="map-outline" size={32} color="white" />
        <Text style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: 'white',
          marginTop: 4
        }}>
          🗺️ Delivery Route Map
        </Text>
        <Text style={{
          fontSize: 12,
          color: '#e0e7ff',
          marginTop: 2,
          textAlign: 'center'
        }}>
          Mobile app has interactive map with live tracking
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15 }}>
        {/* Route Info Cards */}
        {routeInfo && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#4c1d95',
              marginBottom: 12
            }}>
              📊 Route Summary
            </Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {/* Route Stats */}
              <View style={{
                backgroundColor: 'white',
                padding: 12,
                borderRadius: 10,
                borderLeftWidth: 3,
                borderLeftColor: '#8b5cf6',
                flex: 1,
                minWidth: 180,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1
              }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#4c1d95', marginBottom: 6 }}>
                  📍 Route Info
                </Text>
                <Text style={{ fontSize: 11, color: '#6b46c1', marginBottom: 3 }}>
                  Stops: {routeInfo.customers} | Time: {routeInfo.totalTime}m
                </Text>
                <Text style={{ fontSize: 11, color: '#6b46c1' }}>
                  Distance: {routeInfo.totalDistance} km
                </Text>
              </View>

              {/* Delivery Status */}
              <View style={{
                backgroundColor: 'white',
                padding: 12,
                borderRadius: 10,
                borderLeftWidth: 3,
                borderLeftColor: '#f59e0b',
                flex: 1,
                minWidth: 180,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1
              }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#92400e', marginBottom: 6 }}>
                  📦 Status
                </Text>
                <Text style={{ fontSize: 11, color: '#b45309', marginBottom: 3 }}>
                  {delivery.status?.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 10, color: '#b45309' }} numberOfLines={1} ellipsizeMode="tail">
                  {safeRender(delivery.vendorId?.name)} • {delivery._id?.toString()?.substring(0, 6)}...
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Vendor Information */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#4c1d95',
            marginBottom: 12
          }}>
            🏪 Vendor Details
          </Text>
          
          <View style={{
            backgroundColor: 'white',
            padding: 12,
            borderRadius: 10,
            borderLeftWidth: 3,
            borderLeftColor: '#10b981',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1
          }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#065f46', marginBottom: 6 }} numberOfLines={1} ellipsizeMode="tail">
              {safeRender(delivery.vendorId?.name)}
            </Text>
            <Text style={{ fontSize: 12, color: '#047857', marginBottom: 3 }} numberOfLines={2} ellipsizeMode="tail">
              📍 {formatAddress(delivery.vendorId?.address)}
            </Text>
            {delivery.vendorId?.contactNumber && (
              <Text style={{ fontSize: 12, color: '#047857' }}>
                📞 {delivery.vendorId.contactNumber}
              </Text>
            )}
          </View>
        </View>

        {/* Customer List */}
        {routeInfo && routeInfo.optimizedOrder.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#4c1d95',
              marginBottom: 12
            }}>
              🛣️ Delivery Route ({routeInfo.optimizedOrder.length} stops)
            </Text>
            
            {routeInfo.optimizedOrder.map((customer, index) => (
              <View 
                key={`customer-web-${index}-${customer.id || `customer-${index}`}-${customer.name?.replace(/\s+/g, '-') || 'unknown'}`}
                style={{
                  backgroundColor: 'white',
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: '#3b82f6',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{
                    backgroundColor: '#3b82f6',
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e40af', flex: 1 }} numberOfLines={1} ellipsizeMode="tail">
                    {customer.name}
                  </Text>
                </View>
                
                <Text style={{ fontSize: 12, color: '#1d4ed8', marginLeft: 30 }} numberOfLines={2} ellipsizeMode="tail">
                  📍 {formatAddress(customer.address)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Driver Location Info */}
        {driverLocation && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#4c1d95',
              marginBottom: 12
            }}>
              🚚 Driver Location
            </Text>
            
            <View style={{
              backgroundColor: 'white',
              padding: 12,
              borderRadius: 10,
              borderLeftWidth: 3,
              borderLeftColor: '#f59e0b',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1
            }}>
              <Text style={{ fontSize: 12, color: '#b45309', marginBottom: 3 }}>
                📍 Lat: {driverLocation.latitude?.toFixed(4)}
              </Text>
              <Text style={{ fontSize: 12, color: '#b45309' }}>
                📍 Lng: {driverLocation.longitude?.toFixed(4)}
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

      {/* Chat Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: '#3b82f6',
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5
        }}
        onPress={() => setChatVisible(true)}
      >
        <Ionicons name="chatbubble" size={24} color="white" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={chatVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end'
        }}>
          <View style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingBottom: 40,
            paddingHorizontal: 20,
            maxHeight: '70%'
          }}>
            {/* Chat Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb'
            }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                  Chat with Customer
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#10b981',
                    marginRight: 6
                  }} />
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>
                    WebSocket Connected
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setChatVisible(false)}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: '#f3f4f6'
                }}
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <ScrollView style={{ maxHeight: 300 }}>
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={{
                    marginBottom: 12,
                    alignItems: msg.type === 'driver' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <View style={{
                    backgroundColor: msg.type === 'driver' ? '#3b82f6' : '#f3f4f6',
                    padding: 12,
                    borderRadius: 16,
                    maxWidth: '80%',
                    borderBottomRightRadius: msg.type === 'driver' ? 4 : 16,
                    borderBottomLeftRadius: msg.type === 'customer' ? 4 : 16
                  }}>
                    {msg.type === 'customer' && (
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#4b5563', marginBottom: 4 }}>
                        {msg.sender}
                      </Text>
                    )}
                    <Text style={{
                      color: msg.type === 'driver' ? 'white' : '#1f2937',
                      fontSize: 14
                    }}>
                      {msg.message}
                    </Text>
                    <Text style={{
                      color: msg.type === 'driver' ? 'rgba(255,255,255,0.7)' : '#6b7280',
                      fontSize: 10,
                      marginTop: 4,
                      textAlign: 'right'
                    }}>
                      {msg.timestamp}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Chat Input Area (Disabled/Fake) */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 15,
              backgroundColor: '#f9fafb',
              borderRadius: 25,
              paddingHorizontal: 15,
              paddingVertical: 10,
              opacity: 0.6
            }}>
              <Text style={{ flex: 1, color: '#9ca3af', fontSize: 14 }}>
                Type a message...
              </Text>
              <Ionicons name="send" size={20} color="#9ca3af" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DriverDeliveryMap;