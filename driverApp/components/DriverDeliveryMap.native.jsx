import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const DriverDeliveryMap = ({ delivery, driverLocation }) => {
  const mapRef = useRef(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [polylineCoords, setPolylineCoords] = useState([]);
  const [mapError, setMapError] = useState(null);

  // TSP Solver for route optimization
  const solveTSP = (startPoint, points) => {
    if (!points || points.length === 0) return { route: [], totalDistance: 0 };
    
    const calculateDistance = (p1, p2) => {
      if (!p1?.coordinates || !p2?.coordinates) return 0;
      
      const R = 6371000; // Earth radius in meters
      const lat1 = p1.coordinates.length === 2 ? p1.coordinates[1] : p1.coordinates.latitude;
      const lng1 = p1.coordinates.length === 2 ? p1.coordinates[0] : p1.coordinates.longitude;
      const lat2 = p2.coordinates.length === 2 ? p2.coordinates[1] : p2.coordinates.latitude;
      const lng2 = p2.coordinates.length === 2 ? p2.coordinates[0] : p2.coordinates.longitude;
      
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const route = [];
    const unvisited = [...points];
    let currentPoint = startPoint;
    let totalDistance = 0;
    let cumulativeTime = 0;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = calculateDistance(currentPoint, unvisited[0]);

      for (let i = 1; i < unvisited.length; i++) {
        const distance = calculateDistance(currentPoint, unvisited[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      
      const nextPoint = unvisited.splice(nearestIndex, 1)[0];
      
      cumulativeTime += (nearestDistance / 1000) / 30 * 60 + 5;
      
      route.push({ 
        ...nextPoint, 
        estimatedTime: Math.round(cumulativeTime),
        distanceFromPrev: nearestDistance
      });
      
      currentPoint = nextPoint;
      totalDistance += nearestDistance;
    }

    return { route, totalDistance };
  };

  // Process delivery data and create optimized route
  useEffect(() => {
    if (!delivery || !delivery.vendorId?.address) {
      console.log('❌ Missing delivery or vendor address data');
      return;
    }

    console.log('Processing delivery for map:', delivery._id);

    // Extract vendor location
    let vendorCoordinates;
    if (delivery.vendorId.address.coordinates) {
      const coords = delivery.vendorId.address.coordinates;
      if (coords.lat !== undefined && coords.lng !== undefined) {
        vendorCoordinates = [coords.lng, coords.lat];
      } else if (Array.isArray(coords) && coords.length === 2) {
        vendorCoordinates = coords;
      }
    }
    
    if (!vendorCoordinates || vendorCoordinates[0] === 0 && vendorCoordinates[1] === 0) {
      console.log('❌ Invalid vendor coordinates:', vendorCoordinates);
      return;
    }

    const vendorLocation = {
      coordinates: vendorCoordinates
    };

    // Extract customer locations
    const customers = delivery.customers?.map(customer => {
      if (!customer.customerId?.address?.coordinates) {
        console.log('❌ Missing customer coordinates for:', customer.customerId?.name);
        return null;
      }
      
      const coords = customer.customerId.address.coordinates;
      let customerCoordinates;
      
      if (coords.lat !== undefined && coords.lng !== undefined) {
        customerCoordinates = [coords.lng, coords.lat];
      } else if (Array.isArray(coords) && coords.length === 2) {
        customerCoordinates = coords;
      }
      
      if (!customerCoordinates || customerCoordinates[0] === 0 && customerCoordinates[1] === 0) {
        console.log('❌ Invalid customer coordinates for:', customer.customerId?.name);
        return null;
      }

      return {
        id: customer.customerId?._id,
        name: customer.customerId?.name || 'Unknown Customer',
        coordinates: customerCoordinates,
        address: customer.customerId?.address,
        contactNumber: customer.customerId?.contactNumber,
        status: customer.status,
        deliveryOrder: customer.deliveryOrder
      };
    }).filter(c => c !== null) || [];

    if (customers.length === 0) {
      console.log('⚠️ No valid customer locations found');
      setRouteInfo({
        totalTime: 0,
        totalDistance: '0',
        customers: 0,
        optimizedOrder: []
      });
      
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: vendorLocation.coordinates[1],
            longitude: vendorLocation.coordinates[0],
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
      }, 1000);
      return;
    }

    // Solve TSP for optimal delivery route
    const tspResult = solveTSP(vendorLocation, customers);
    setOptimizedRoute(tspResult.route);

    // Create polyline coordinates for the route
    const coords = [
      {
        latitude: vendorLocation.coordinates[1],
        longitude: vendorLocation.coordinates[0]
      }
    ];

    tspResult.route.forEach(customer => {
      coords.push({
        latitude: customer.coordinates[1],
        longitude: customer.coordinates[0]
      });
    });

    coords.push({
      latitude: vendorLocation.coordinates[1],
      longitude: vendorLocation.coordinates[0]
    });

    setPolylineCoords(coords);

    setRouteInfo({
      totalTime: tspResult.route.length > 0 ? tspResult.route[tspResult.route.length - 1].estimatedTime : 0,
      totalDistance: (tspResult.totalDistance / 1000).toFixed(1),
      customers: tspResult.route.length,
      optimizedOrder: tspResult.route
    });

    // Auto-fit map to show all markers
    setTimeout(() => {
      if (mapRef.current && coords.length > 1) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          },
          animated: true,
        });
      }
    }, 1000);
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

  if (mapError) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f8f7ff',
        padding: 20
      }}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: '#dc2626', 
          marginTop: 16,
          textAlign: 'center'
        }}>
          Map Loading Error
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: '#7f1d1d', 
          marginTop: 8,
          textAlign: 'center'
        }}>
          {mapError}
        </Text>
      </View>
    );
  }

  // Extract vendor coordinates for initial region
  let vendorCoords = [0, 0];
  if (delivery.vendorId.address.coordinates) {
    const coords = delivery.vendorId.address.coordinates;
    if (coords.lat !== undefined && coords.lng !== undefined) {
      vendorCoords = [coords.lng, coords.lat];
    } else if (Array.isArray(coords) && coords.length === 2) {
      vendorCoords = coords;
    }
  }
  
  const initialRegion = {
    latitude: vendorCoords[1],
    longitude: vendorCoords[0],
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f7ff' }}>
      {/* Route Info Panel */}
      {routeInfo && (
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 120, backgroundColor: 'white', paddingVertical: 10 }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          <View style={{ flexDirection: 'row', gap: 15 }}>
            {/* TSP Route Info */}
            <View style={{
              backgroundColor: '#f0f0ff',
              padding: 15,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#8b5cf6',
              minWidth: 160
            }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#4c1d95', marginBottom: 8 }}>
                📍 Route Optimization
              </Text>
              <Text style={{ fontSize: 12, color: '#6b46c1', marginBottom: 3 }}>
                🚚 Stops: {routeInfo.customers}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b46c1', marginBottom: 3 }}>
                ⏱️ Time: {routeInfo.totalTime} min
              </Text>
              <Text style={{ fontSize: 12, color: '#6b46c1' }}>
                📏 Distance: {routeInfo.totalDistance} km
              </Text>
            </View>

            {/* Delivery Sequence */}
            <View style={{
              backgroundColor: '#f0fff4',
              padding: 15,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#10b981',
              minWidth: 200
            }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#065f46', marginBottom: 8 }}>
                🛣️ Optimized Sequence
              </Text>
              {routeInfo.optimizedOrder?.slice(0, 2).map((customer, index) => (
                <Text key={`route-order-${customer.id || index}-${customer.name}`} style={{ fontSize: 11, color: '#047857', marginBottom: 2 }}>
                  {index + 1}. {customer.name}
                </Text>
              ))}
              {routeInfo.optimizedOrder?.length > 2 && (
                <Text style={{ fontSize: 10, color: '#6b7280', fontStyle: 'italic' }}>
                  +{routeInfo.optimizedOrder.length - 2} more stops
                </Text>
              )}
            </View>

            {/* Delivery Info */}
            <View style={{
              backgroundColor: '#fff7ed',
              padding: 15,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#f59e0b',
              minWidth: 160
            }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#92400e', marginBottom: 8 }}>
                📦 Delivery Status
              </Text>
              <Text style={{ fontSize: 12, color: '#b45309', marginBottom: 3 }}>
                Status: {delivery.status?.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 12, color: '#b45309', marginBottom: 3 }}>
                Vendor: {safeRender(delivery.vendorId?.name)}
              </Text>
              <Text style={{ fontSize: 12, color: '#b45309' }}>
                ID: {delivery._id?.toString()?.substring(0, 8)}...
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        onError={(error) => {
          console.error('Map error:', error);
          setMapError('Failed to load map. Please check your internet connection.');
        }}
        onMapReady={() => {
          console.log('Map is ready');
          setMapError(null);
        }}
      >
        {/* Vendor Marker */}
        <Marker
          coordinate={{
            latitude: vendorCoords[1],
            longitude: vendorCoords[0]
          }}
          title="🏪 Vendor (START)"
          description={`${safeRender(delivery.vendorId?.name)}\n${formatAddress(delivery.vendorId?.address)}`}
          pinColor="#10B981"
        />

        {/* Customer Markers in Optimized Order */}
        {optimizedRoute.map((customer, index) => {
          const coords = customer.coordinates;
          if (!coords || coords[0] === 0 || coords[1] === 0) return null;
          
          return (
            <Marker
              key={`customer-marker-${index}-${customer.id || 'unknown'}-${Date.now()}-${Math.random()}`}
              coordinate={{
                latitude: coords[1],
                longitude: coords[0]
              }}
              title={`📍 Stop #${index + 1}: ${customer.name}`}
              description={`${formatAddress(customer.address)}\nContact: ${customer.contactNumber || 'N/A'}\nETA: ${customer.estimatedTime} minutes`}
              pinColor="#3B82F6"
            >
              <View style={{
                backgroundColor: '#3B82F6',
                width: 30,
                height: 30,
                borderRadius: 15,
                borderWidth: 3,
                borderColor: 'white',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
                elevation: 5
              }}>
                <Text style={{ 
                  color: 'white', 
                  fontSize: 12, 
                  fontWeight: 'bold' 
                }}>
                  {index + 1}
                </Text>
              </View>
            </Marker>
          );
        })}

        {/* Driver Location Marker (if available) */}
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude
            }}
            title="🚚 Your Location"
            description="Current driver position"
            pinColor="#F59E0B"
          >
            <View style={{
              backgroundColor: '#F59E0B',
              width: 35,
              height: 35,
              borderRadius: 17.5,
              borderWidth: 3,
              borderColor: 'white',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 5
            }}>
              <Ionicons name="car" size={16} color="white" />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#8B5CF6"
            strokeWidth={4}
            strokePattern={[10, 5]}
            geodesic={true}
          />
        )}
      </MapView>

      {/* Map Legend */}
      <View style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#4c1d95', marginBottom: 6 }}>
          Map Legend
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', marginRight: 6 }} />
          <Text style={{ fontSize: 10, color: '#374151' }}>Vendor</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6', marginRight: 6 }} />
          <Text style={{ fontSize: 10, color: '#374151' }}>Delivery Order</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#F59E0B', marginRight: 6 }} />
          <Text style={{ fontSize: 10, color: '#374151' }}>Your Location</Text>
        </View>
      </View>

      {/* Live Tracking Indicator */}
      {delivery.status === 'started' && (
        <View style={{
          position: 'absolute',
          top: 20,
          left: 20,
          backgroundColor: 'rgba(16, 185, 129, 0.9)',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: 'white',
            marginRight: 6
          }} />
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
            🚛 Live Tracking Active
          </Text>
        </View>
      )}
    </View>
  );
};

export default DriverDeliveryMap;