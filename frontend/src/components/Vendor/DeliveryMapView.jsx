import React, { useEffect, useState, useRef } from 'react';
import { auth } from '../../../firebase.config';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { 
  FaMapMarkerAlt, 
  FaHome, 
  FaTruck, 
  FaClock, 
  FaRoute, 
  FaPhone,
  FaStar,
  FaCircle
} from 'react-icons/fa';
import { MdLocationOn, MdDeliveryDining } from 'react-icons/md';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DeliveryMapView = ({ selectedDriver, subscribers, vendorLocation, activeDelivery }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const routingControlRef = useRef(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [driverLocationMarker, setDriverLocationMarker] = useState(null);

  console.log('DeliveryMapView Props:', {
    selectedDriver: selectedDriver ? selectedDriver.name : 'None',
    subscribersCount: subscribers ? subscribers.length : 0,
    vendorLocation: vendorLocation ? 'Has location' : 'No location',
    activeDelivery: activeDelivery ? 'Has active delivery' : 'No active delivery'
  });

  // Create custom icons
  const createCustomIcon = (color, type, size = 20) => {
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: ${size-8}px; color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${type}</div>`,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  const vendorIcon = createCustomIcon('#10B981', 'V', 28);
  const customerIcon = createCustomIcon('#3B82F6', 'C', 20);
  const driverIcon = createCustomIcon('#F59E0B', 'D', 32);

  // TSP Solver - Nearest Neighbor Heuristic
  const solveTSP = (startPoint, points) => {
    if (points.length === 0) return { route: [], totalDistance: 0 };
    
    const calculateDistance = (p1, p2) => {
      const R = 6371000; // Earth radius in meters
      const dLat = (p2.coordinates[1] - p1.coordinates[1]) * Math.PI / 180;
      const dLon = (p2.coordinates[0] - p1.coordinates[0]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(p1.coordinates[1] * Math.PI / 180) * Math.cos(p2.coordinates[1] * Math.PI / 180) *
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
      
      // Calculate cumulative time (assuming 30 km/h avg speed + 5 min per stop)
      cumulativeTime += (nearestDistance / 1000) / 30 * 60 + 5; // minutes
      
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

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Use vendor location if available, otherwise use India center
    const defaultLat = vendorLocation?.coordinates?.[1] || 20.5937;
    const defaultLng = vendorLocation?.coordinates?.[0] || 78.9629;
    
    mapInstance.current = L.map(mapRef.current).setView([defaultLat, defaultLng], 10);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [vendorLocation]);

  // Update markers and routes when data changes
  useEffect(() => {
    if (!mapInstance.current) return;

    console.log('Updating map with:', {
      vendorLocation: vendorLocation ? `[${vendorLocation.coordinates}]` : 'No vendor location',
      subscribersCount: subscribers.length,
      selectedDriver: selectedDriver ? selectedDriver.name : 'No driver'
    });

    // Clear existing markers safely
    markersRef.current.forEach(marker => {
      if (mapInstance.current && mapInstance.current.hasLayer && mapInstance.current.hasLayer(marker)) {
        mapInstance.current.removeLayer(marker);
      }
    });
    markersRef.current = [];
    
    // Clear existing routing control safely
    if (routingControlRef.current && mapInstance.current) {
      try {
        mapInstance.current.removeControl(routingControlRef.current);
      } catch (error) {
        console.warn('Error removing routing control:', error);
      }
      routingControlRef.current = null;
    }

    const bounds = L.latLngBounds();
    let hasValidData = false;

    // Add vendor marker FIRST
    if (vendorLocation && vendorLocation.coordinates && vendorLocation.coordinates.length === 2) {
      const [lng, lat] = vendorLocation.coordinates;
      console.log('Adding vendor marker at:', [lat, lng]);
      
      const vendorMarker = L.marker([lat, lng], { icon: vendorIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div>
            <strong>🏪 Vendor Location (START)</strong><br>
            <p>This is where delivery begins</p>
            <small>Drivers must be within 500m to start delivery</small>
          </div>
        `);
      markersRef.current.push(vendorMarker);
      bounds.extend([lat, lng]);
      hasValidData = true;
    }

    // Process subscribers and create TSP route
    if (subscribers.length > 0 && vendorLocation?.coordinates) {
      console.log('Processing subscribers:', subscribers.length);
      
      // Solve TSP for optimal delivery route
      const tspResult = solveTSP(
        { coordinates: vendorLocation.coordinates },
        subscribers.map(sub => ({ 
          ...sub, 
          coordinates: sub.coordinates 
        }))
      );

      console.log('TSP Result:', {
        routeLength: tspResult.route.length,
        totalDistance: `${(tspResult.totalDistance / 1000).toFixed(2)} km`
      });

      // Add customer markers in optimal order
      tspResult.route.forEach((subscriber, index) => {
        if (subscriber.coordinates && subscriber.coordinates.length === 2) {
          const [lng, lat] = subscriber.coordinates;
          const orderIcon = createCustomIcon('#3B82F6', (index + 1).toString(), 24);
          
          const customerMarker = L.marker([lat, lng], { icon: orderIcon })
            .addTo(mapInstance.current)
            .bindPopup(`
              <div>
                <strong>📍 Stop #${index + 1}: ${subscriber.name}</strong><br>
                <p><strong>Address:</strong> ${subscriber.address || 'No address'}</p>
                <p><strong>Contact:</strong> ${subscriber.contactNumber || 'No contact'}</p>
                <hr style="margin: 8px 0;">
                <p><strong>⏰ ETA:</strong> ${subscriber.estimatedTime} minutes</p>
                <p><strong>📏 Distance:</strong> ${(subscriber.distanceFromPrev / 1000).toFixed(2)} km from previous</p>
                <small>From start of delivery</small>
              </div>
            `);
          markersRef.current.push(customerMarker);
          bounds.extend([lat, lng]);
          hasValidData = true;
        }
      });

      // Create the TSP route on map
      if (tspResult.route.length > 0) {
        createTSPRoute(vendorLocation.coordinates, tspResult.route);
      }

      // Update route info
      setRouteInfo({
        totalTime: tspResult.route.length > 0 ? tspResult.route[tspResult.route.length - 1].estimatedTime : 0,
        totalDistance: (tspResult.totalDistance / 1000).toFixed(1),
        subscribers: tspResult.route.length,
        optimizedOrder: tspResult.route
      });
    }

    // Add driver marker (separate from route)
    if (selectedDriver && selectedDriver.location && selectedDriver.location.coordinates && selectedDriver.location.coordinates.length === 2) {
      const [lng, lat] = selectedDriver.location.coordinates;
      console.log('Adding driver marker at:', [lat, lng]);
      
      const driverMarker = L.marker([lat, lng], { icon: driverIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div>
            <strong>🚚 Driver: ${selectedDriver.name}</strong><br>
            <p><strong>Vehicle:</strong> ${selectedDriver.vehicleType} - ${selectedDriver.vehicleNumber}</p>
            <p><strong>Rating:</strong> ⭐ ${selectedDriver.rating}</p>
            <p><strong>Status:</strong> ${selectedDriver.available ? 'Available' : 'Busy'}</p>
            <small>Last updated: ${new Date(selectedDriver.location.lastUpdated).toLocaleTimeString()}</small>
          </div>
        `);
      markersRef.current.push(driverMarker);
      bounds.extend([lat, lng]);
      setDriverLocationMarker(driverMarker);
      hasValidData = true;
    }

    // Fit map to show all markers
    if (bounds.isValid() && hasValidData) {
      mapInstance.current.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [selectedDriver, subscribers, vendorLocation]);

  const createTSPRoute = (vendorCoords, optimizedRoute) => {
    if (!mapInstance.current || !vendorCoords || optimizedRoute.length === 0) {
      console.log('Cannot create route - missing data');
      return;
    }

    console.log('Creating TSP route from vendor to', optimizedRoute.length, 'customers');

    // Clear any existing routing control first
    if (routingControlRef.current) {
      try {
        mapInstance.current.removeControl(routingControlRef.current);
      } catch (error) {
        console.warn('Error removing existing routing control:', error);
      }
      routingControlRef.current = null;
    }

    // Create waypoints: Vendor -> All customers in optimal order -> Back to vendor
    const waypoints = [
      L.latLng(vendorCoords[1], vendorCoords[0]),  // Start at vendor
      ...optimizedRoute.map(customer => L.latLng(customer.coordinates[1], customer.coordinates[0])),
      L.latLng(vendorCoords[1], vendorCoords[0])   // Return to vendor
    ];

    console.log('Route waypoints:', waypoints.length);

    // Create routing control with TSP path
    routingControlRef.current = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      createMarker: () => null, // Don't create default markers
      lineOptions: {
        styles: [{ 
          color: '#8B5CF6', 
          weight: 5, 
          opacity: 0.8, 
          dashArray: '10, 5' 
        }]
      },
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      show: false, // Hide the route instructions panel
    }).on('routesfound', function(e) {
      console.log('Route found by OSRM');
      const routes = e.routes;
      const summary = routes[0].summary;
      
      // Update route info with actual routing data
      const actualTotalTime = Math.round(summary.totalTime / 60);
      const actualTotalDistance = (summary.totalDistance / 1000).toFixed(1);
      
      setRouteInfo(prev => ({
        ...prev,
        actualTotalTime,
        actualTotalDistance
      }));
    }).on('routingerror', function(e) {
      console.error('Routing error:', e);
    });

    // Add to map only if map still exists
    if (mapInstance.current) {
      routingControlRef.current.addTo(mapInstance.current);
    }
  };

  // Real-time driver location updates (if active delivery)
  useEffect(() => {
    if (!activeDelivery || activeDelivery.status !== 'started') return;

    const updateDriverLocation = setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers/delivery/active/${activeDelivery.driverId}`, {
          headers: {
            'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        
        if (data.success && data.delivery.driverLocation) {
          const [lng, lat] = data.delivery.driverLocation.coordinates;
          
          if (driverLocationMarker && mapInstance.current) {
            driverLocationMarker.setLatLng([lat, lng]);
            driverLocationMarker.bindPopup(`
              <div>
                <strong>🚚 Driver Live Location</strong><br>
                <p><strong>Status:</strong> ${data.delivery.status}</p>
                <small>Updated: ${new Date().toLocaleTimeString()}</small>
              </div>
            `);
          }
        }
      } catch (error) {
        console.error('Error updating driver location:', error);
      }
    }, 15000); // Update every 15 seconds

    return () => clearInterval(updateDriverLocation);
  }, [activeDelivery, driverLocationMarker]);

  return (
    <div className="w-full h-[500px] relative mt-4">
      <div ref={mapRef} className="w-full h-full rounded-lg border-2 border-gray-200" />
      
      {/* Debug Info */}
      <div className="absolute top-2 left-2 bg-black/70 text-white p-2 rounded text-xs z-[1000]">
        <p>V: {vendorLocation ? '✓' : '✗'} | S: {subscribers.length} | D: {selectedDriver ? '✓' : '✗'}</p>
      </div>
      
      {routeInfo && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-[1000] max-w-xs border">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FaRoute className="text-purple-600" />
            TSP Route Optimization
          </h4>
          <div className="text-sm space-y-2">
            <p className="flex items-center gap-2">
              <MdLocationOn className="text-red-500" />
              <strong>Delivery Stops:</strong> {routeInfo.subscribers}
            </p>
            <p className="flex items-center gap-2">
              <FaClock className="text-green-500" />
              <strong>Estimated Time:</strong> {routeInfo.totalTime} min
            </p>
            {routeInfo.actualTotalTime && (
              <p className="flex items-center gap-2">
                <FaRoute className="text-purple-500" />
                <strong>Actual Route Time:</strong> {routeInfo.actualTotalTime} min
              </p>
            )}
            <p className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-orange-500" />
              <strong>Total Distance:</strong> {routeInfo.actualTotalDistance || routeInfo.totalDistance} km
            </p>
            <hr className="my-2" />
            <p className="text-xs text-gray-600">
              <strong>Algorithm:</strong> Traveling Salesman Problem solved using Nearest Neighbor heuristic
            </p>
          </div>
        </div>
      )}
      
      {routeInfo && routeInfo.optimizedOrder && (
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000] max-w-xs max-h-60 overflow-y-auto border">
          <h4 className="font-semibold mb-3 flex items-center gap-2 sticky top-0 bg-white">
            <MdDeliveryDining className="text-blue-600" />
            Optimized Delivery Sequence
          </h4>
          <div className="text-xs space-y-2">
            {routeInfo.optimizedOrder.map((customer, index) => (
              <div key={customer.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 border-l-4 border-blue-500">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{customer.name}</p>
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    <FaClock className="text-xs" />
                    ETA: {customer.estimatedTime} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000] border">
        <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
          <FaMapMarkerAlt className="text-gray-600" />
          Map Legend
        </h4>
        <div className="text-xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">V</div>
            <span>Vendor (Start/End Point)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">1</div>
            <span>Customers (Delivery Order)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">D</div>
            <span>Driver Current Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-purple-500 rounded" style={{background: 'linear-gradient(90deg, #8B5CF6 50%, transparent 50%)', backgroundSize: '10px 1px'}}></div>
            <span>TSP Optimized Route</span>
          </div>
        </div>
      </div>

      {activeDelivery && activeDelivery.status === 'started' && (
        <div className="absolute top-4 left-4 bg-green-100 border border-green-300 p-3 rounded-lg shadow-lg z-[1000]">
          <div className="flex items-center gap-2">
            <FaCircle className="w-3 h-3 text-green-500 animate-pulse" />
            <span className="text-green-800 font-semibold text-sm flex items-center gap-1">
              <FaTruck className="text-green-600" />
              Live Delivery Tracking Active
            </span>
          </div>
          <p className="text-green-700 text-xs mt-1">Driver location updates every 15 seconds</p>
        </div>
      )}

      {/* Show message if no data */}
      {(!vendorLocation || subscribers.length === 0) && (
        <div className="absolute inset-0 bg-gray-100/90 flex items-center justify-center z-[999]">
          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <FaMapMarkerAlt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">No Route Data Available</h3>
            <p className="text-sm text-gray-500">
              {!vendorLocation && "Vendor location is required to create routes."}
              {vendorLocation && subscribers.length === 0 && "No subscribers found with valid locations."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMapView;