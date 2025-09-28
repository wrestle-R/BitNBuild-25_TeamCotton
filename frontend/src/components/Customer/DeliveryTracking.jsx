import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DeliveryTracking = ({ customerId }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);

  useEffect(() => {
    fetchTrackingInfo();
    
    // Poll every 15 seconds
    const interval = setInterval(fetchTrackingInfo, 15000);
    return () => clearInterval(interval);
  }, [customerId]);

  useEffect(() => {
    if (tracking && !mapInstance.current) {
      initializeMap();
    } else if (tracking && mapInstance.current) {
      updateDriverMarker();
    }
  }, [tracking]);

  const fetchTrackingInfo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/delivery/tracking/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setTracking(data.tracking);
      }
    } catch (error) {
      console.error('Error fetching tracking info:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !tracking) return;

    mapInstance.current = L.map(mapRef.current).setView(
      [tracking.driverLocation.coordinates[1], tracking.driverLocation.coordinates[0]], 
      14
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance.current);

    // Add driver marker
    const driverIcon = L.divIcon({
      html: `<div style="background-color: #F59E0B; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; font-weight: bold;">🚚</div>`,
      className: 'driver-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([
      tracking.driverLocation.coordinates[1], 
      tracking.driverLocation.coordinates[0]
    ], { icon: driverIcon })
      .addTo(mapInstance.current)
      .bindPopup(`
        <div>
          <strong>Your Delivery Driver</strong><br>
          ${tracking.driver.name}<br>
          ${tracking.driver.vehicleType} - ${tracking.driver.vehicleNumber}<br>
          ⭐ ${tracking.driver.rating}
        </div>
      `);
  };

  const updateDriverMarker = () => {
    if (!mapInstance.current || !tracking) return;

    // Clear existing markers
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstance.current.removeLayer(layer);
      }
    });

    // Add updated driver marker
    const driverIcon = L.divIcon({
      html: `<div style="background-color: #F59E0B; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; font-weight: bold;">🚚</div>`,
      className: 'driver-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([
      tracking.driverLocation.coordinates[1], 
      tracking.driverLocation.coordinates[0]
    ], { icon: driverIcon })
      .addTo(mapInstance.current);

    // Center map on driver
    mapInstance.current.setView([
      tracking.driverLocation.coordinates[1], 
      tracking.driverLocation.coordinates[0]
    ]);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tracking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No active delivery found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Delivery Tracking
          <Badge variant="secondary">
            Order #{tracking.deliveryOrder} of {tracking.totalCustomers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Driver Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800">Your Driver</h4>
            <p className="text-blue-700">{tracking.driver.name}</p>
            <p className="text-blue-600 text-sm">
              {tracking.driver.vehicleType} - {tracking.driver.vehicleNumber}
            </p>
            <p className="text-blue-600 text-sm">
              📞 {tracking.driver.contactNumber} | ⭐ {tracking.driver.rating}
            </p>
          </div>

          {/* Estimated Arrival */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800">Estimated Arrival</h4>
            <p className="text-green-700 text-lg font-semibold">
              {new Date(tracking.estimatedArrival).toLocaleTimeString()}
            </p>
            <p className="text-green-600 text-sm">
              You are #{tracking.deliveryOrder} in the delivery queue
            </p>
          </div>

          {/* Live Map */}
          <div className="h-64 w-full rounded-lg overflow-hidden">
            <div ref={mapRef} className="h-full w-full" />
          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-muted-foreground">
            Last updated: {new Date(tracking.driverLocation.lastUpdated).toLocaleTimeString()}
            <br />
            <span className="text-xs">Updates every 15 seconds</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryTracking;