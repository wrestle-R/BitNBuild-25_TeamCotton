import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { 
  FaTruck, 
  FaMapMarkerAlt, 
  FaRoute, 
  FaExpand, 
  FaCompress,
  FaSyncAlt,
  FaPhone,
  FaDirections
} from 'react-icons/fa';
import { MdMyLocation } from 'react-icons/md';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { useTheme } from '../../../context/ThemeContext';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LiveTrackingMap = ({ delivery, customerLocation, onRefresh }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const routingControlRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const { isDark } = useTheme();

  console.log('🗺️ LiveTrackingMap Props:', {
    delivery: delivery ? 'Has delivery' : 'No delivery',
    driverLocation: delivery?.driverLocation ? 'Has driver location' : 'No driver location',
    customerLocation: customerLocation ? 'Has customer location' : 'No customer location',
    driverCoords: delivery?.driverLocation?.coordinates,
    customerCoords: customerLocation?.coordinates
  });

  // Create custom icons
  const createCustomIcon = (color, iconText, size = 32) => {
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color}; 
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          border: 3px solid white; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: ${size * 0.4}px; 
          color: white; 
          font-weight: bold; 
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          ${iconText}
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid ${color};
          "></div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [size, size + 8],
      iconAnchor: [size/2, size + 8]
    });
  };

  const driverIcon = createCustomIcon('#F59E0B', '🚚', 36);
  const customerIcon = createCustomIcon('#10B981', '🏠', 32);
  const vendorIcon = createCustomIcon('#8B5CF6', '🏪', 32);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    console.log('🎯 Initializing map...');

    // Use customer location or default to Mumbai
    const defaultLat = customerLocation?.coordinates?.lat || 19.248364;
    const defaultLng = customerLocation?.coordinates?.lng || 72.850088;

    mapInstance.current = L.map(mapRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true
    });

    // Add tile layer based on theme
    const tileLayer = isDark 
      ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors, © CartoDB',
          subdomains: 'abcd'
        })
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        });

    tileLayer.addTo(mapInstance.current);

    // Add zoom control to top-right
    mapInstance.current.zoomControl.setPosition('topright');

    setMapReady(true);
    console.log('✅ Map initialized successfully');

    return () => {
      if (mapInstance.current) {
        console.log('🧹 Cleaning up map...');
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isDark]);

  // Update markers and route when delivery data changes
  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;

    console.log('🔄 Updating markers and route...');
    updateMarkersAndRoute();
    setLastUpdate(new Date());
  }, [delivery, customerLocation, mapReady]);

  const updateMarkersAndRoute = () => {
    if (!mapInstance.current) return;

    // Clear existing markers and routes
    markersRef.current.forEach(marker => mapInstance.current.removeLayer(marker));
    markersRef.current = [];

    if (routingControlRef.current) {
      mapInstance.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    const markers = [];

    // Add customer marker
    if (customerLocation?.coordinates) {
      const customerMarker = L.marker(
        [customerLocation.coordinates.lat, customerLocation.coordinates.lng], 
        { icon: customerIcon }
      ).bindPopup(`
        <div class="p-2">
          <strong>📍 Your Location</strong><br/>
          <small>Delivery Address</small><br/>
          <span class="text-xs text-gray-600">
            ${customerLocation.coordinates.lat.toFixed(6)}, ${customerLocation.coordinates.lng.toFixed(6)}
          </span>
        </div>
      `);
      
      customerMarker.addTo(mapInstance.current);
      markers.push(customerMarker);
    }

    // Add vendor marker if available
    if (delivery?.vendor?.address?.coordinates) {
      const vendorCoords = delivery.vendor.address.coordinates;
      let vendorLat, vendorLng;
      
      if (Array.isArray(vendorCoords)) {
        // GeoJSON format [lng, lat]
        vendorLat = vendorCoords[1];
        vendorLng = vendorCoords[0];
      } else if (vendorCoords.lat && vendorCoords.lng) {
        // Object format {lat, lng}
        vendorLat = vendorCoords.lat;
        vendorLng = vendorCoords.lng;
      }

      if (vendorLat && vendorLng) {
        const vendorMarker = L.marker([vendorLat, vendorLng], { icon: vendorIcon })
          .bindPopup(`
            <div class="p-2">
              <strong>🏪 ${delivery.vendor.businessName || delivery.vendor.name}</strong><br/>
              <small>Restaurant/Vendor</small><br/>
              <span class="text-xs text-gray-600">
                ${vendorLat.toFixed(6)}, ${vendorLng.toFixed(6)}
              </span>
            </div>
          `);
        
        vendorMarker.addTo(mapInstance.current);
        markers.push(vendorMarker);
      }
    }

    // Add driver marker if available
    let driverLat = null, driverLng = null;
    
    // Try multiple sources for driver location
    if (delivery?.driverLocation?.coordinates && 
        delivery.driverLocation.coordinates[0] !== 0 && 
        delivery.driverLocation.coordinates[1] !== 0) {
      driverLat = delivery.driverLocation.coordinates[1];
      driverLng = delivery.driverLocation.coordinates[0];
    } else if (delivery?.driver?.location?.coordinates &&
               delivery.driver.location.coordinates[0] !== 0 && 
               delivery.driver.location.coordinates[1] !== 0) {
      driverLat = delivery.driver.location.coordinates[1];
      driverLng = delivery.driver.location.coordinates[0];
    }

    if (driverLat && driverLng) {
      const lastUpdatedText = delivery.driverLocation?.lastUpdated 
        ? new Date(delivery.driverLocation.lastUpdated).toLocaleTimeString()
        : 'Unknown';

      const driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon })
        .bindPopup(`
          <div class="p-3">
            <strong>🚚 ${delivery.driver?.name || 'Your Driver'}</strong><br/>
            <div class="mt-1 space-y-1">
              <div class="text-sm">
                ${delivery.driver?.vehicleType || 'Vehicle'}: ${delivery.driver?.vehicleNumber || 'N/A'}
              </div>
              ${delivery.driver?.rating ? 
                `<div class="text-sm">⭐ Rating: ${delivery.driver.rating}/5</div>` : ''
              }
              ${delivery.driver?.contactNumber ? 
                `<div class="text-sm">📞 ${delivery.driver.contactNumber}</div>` : ''
              }
              <div class="text-xs text-gray-600 mt-2">
                Last Updated: ${lastUpdatedText}<br/>
                Location: ${driverLat.toFixed(6)}, ${driverLng.toFixed(6)}
              </div>
            </div>
          </div>
        `);
      
      driverMarker.addTo(mapInstance.current);
      markers.push(driverMarker);

      // Create route if both driver and customer locations are available
      if (customerLocation?.coordinates) {
        try {
          console.log('🛣️ Creating route from driver to customer...');
          
          routingControlRef.current = L.Routing.control({
            waypoints: [
              L.latLng(driverLat, driverLng),
              L.latLng(customerLocation.coordinates.lat, customerLocation.coordinates.lng)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            createMarker: () => null, // Don't create default markers
            lineOptions: {
              styles: [{
                color: '#3B82F6',
                weight: 4,
                opacity: 0.8
              }]
            },
            show: false, // Hide the routing instructions panel
            router: L.Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1'
            })
          });

          routingControlRef.current.addTo(mapInstance.current);

          // Hide the routing instructions container
          setTimeout(() => {
            const routingContainer = document.querySelector('.leaflet-routing-container');
            if (routingContainer) {
              routingContainer.style.display = 'none';
            }
          }, 100);

        } catch (error) {
          console.error('❌ Error creating route:', error);
        }
      }
    }

    markersRef.current = markers;

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = new L.featureGroup(markers);
      mapInstance.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  const centerOnDriver = () => {
    if (!mapInstance.current || !delivery?.driverLocation?.coordinates) return;
    
    const driverLat = delivery.driverLocation.coordinates[1];
    const driverLng = delivery.driverLocation.coordinates[0];
    
    if (driverLat !== 0 && driverLng !== 0) {
      mapInstance.current.setView([driverLat, driverLng], 16);
      toast.success('Centered on driver location');
    } else {
      toast.error('Driver location not available');
    }
  };

  const centerOnCustomer = () => {
    if (!mapInstance.current || !customerLocation?.coordinates) return;
    
    mapInstance.current.setView(
      [customerLocation.coordinates.lat, customerLocation.coordinates.lng], 
      16
    );
    toast.success('Centered on your location');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInGoogleMaps = () => {
    if (!delivery?.driverLocation?.coordinates || !customerLocation?.coordinates) {
      toast.error('Location data not available');
      return;
    }

    const driverLat = delivery.driverLocation.coordinates[1];
    const driverLng = delivery.driverLocation.coordinates[0];
    const customerLat = customerLocation.coordinates.lat;
    const customerLng = customerLocation.coordinates.lng;

    const googleMapsUrl = `https://www.google.com/maps/dir/${driverLat},${driverLng}/${customerLat},${customerLng}`;
    window.open(googleMapsUrl, '_blank');
  };

  const callDriver = () => {
    if (delivery?.driver?.contactNumber) {
      window.open(`tel:${delivery.driver.contactNumber}`, '_self');
    } else {
      toast.error('Driver phone number not available');
    }
  };

  if (!delivery) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaMapMarkerAlt className="w-5 h-5 text-muted-foreground" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <FaTruck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active delivery to track</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FaTruck className="w-5 h-5 text-primary" />
            Live Tracking
            {lastUpdate && (
              <Badge variant="outline" className="ml-2 text-xs">
                Updated {lastUpdate.toLocaleTimeString()}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-1"
            >
              <FaSyncAlt className="w-3 h-3" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="gap-1"
            >
              {isFullscreen ? (
                <FaCompress className="w-3 h-3" />
              ) : (
                <FaExpand className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`p-0 ${isFullscreen ? 'flex-1' : ''}`}>
        <div className={`relative ${isFullscreen ? 'h-full' : 'h-96'} w-full`}>
          {/* Map Container */}
          <div 
            ref={mapRef} 
            className="h-full w-full rounded-b-lg overflow-hidden"
            style={{ zIndex: 1 }}
          />
          
          {/* Floating Controls */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {delivery?.driverLocation?.coordinates && 
             delivery.driverLocation.coordinates[0] !== 0 && 
             delivery.driverLocation.coordinates[1] !== 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={centerOnDriver}
                className="gap-1 shadow-md"
              >
                <FaTruck className="w-3 h-3" />
                Driver
              </Button>
            )}
            
            <Button
              variant="secondary"
              size="sm"
              onClick={centerOnCustomer}
              className="gap-1 shadow-md"
            >
              <MdMyLocation className="w-3 h-3" />
              Me
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={openInGoogleMaps}
              className="gap-1 shadow-md"
            >
              <FaDirections className="w-3 h-3" />
              Google Maps
            </Button>
            
            {delivery?.driver?.contactNumber && (
              <Button
                variant="default"
                size="sm"
                onClick={callDriver}
                className="gap-1 shadow-md"
              >
                <FaPhone className="w-3 h-3" />
                Call Driver
              </Button>
            )}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-border">
            <h4 className="font-semibold mb-2 text-sm text-card-foreground">Legend</h4>
            <div className="space-y-2 text-xs text-card-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs">🚚</div>
                <span>Driver</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">🏠</div>
                <span>Your Location</span>
              </div>
              {delivery?.vendor && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">🏪</div>
                  <span>Restaurant</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span>Route</span>
              </div>
            </div>
          </div>

          {/* Loading overlay */}
          {!mapReady && (
            <div className="absolute inset-0 bg-muted/90 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTrackingMap;