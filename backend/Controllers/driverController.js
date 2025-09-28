const Driver = require('../Models/Driver');
const Vendor = require('../Models/Vendor');
const Customer = require('../Models/Customer');
const ConsumerSubscription = require('../Models/ConsumerSubscription');
const Delivery = require('../Models/Delivery');

// Get all drivers for vendor selection
const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find(
      {}, // Remove verified: true requirement
      {
        _id: 1,
        name: 1,
        email: 1,
        vehicleType: 1,
        vehicleNumber: 1,
        available: 1,
        rating: 1,
        location: 1,
        contactNumber: 1,
        verified: 1
      }
    );

    console.log('All drivers found:', drivers.length);
    console.log('Drivers data:', drivers);

    res.status(200).json({
      success: true,
      drivers
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers'
    });
  }
};

// Get available drivers only
const getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find(
      { 
        available: true, // Remove verified requirement for now
        'location.coordinates.0': { $exists: true, $ne: 0 },
        'location.coordinates.1': { $exists: true, $ne: 0 }
      },
      {
        _id: 1,
        name: 1,
        email: 1,
        vehicleType: 1,
        vehicleNumber: 1,
        rating: 1,
        location: 1,
        available: 1,
        contactNumber: 1,
        verified: 1
      }
    );

    console.log('Available drivers found:', drivers.length);
    console.log('Available drivers data:', drivers);

    res.status(200).json({
      success: true,
      drivers
    });
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available drivers'
    });
  }
};

// Get driver details by ID
const getDriverById = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const driver = await Driver.findById(driverId, {
      name: 1,
      email: 1,
      contactNumber: 1,
      vehicleType: 1,
      vehicleNumber: 1,
      available: 1,
      rating: 1,
      location: 1,
      verified: 1
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.status(200).json({
      success: true,
      driver
    });
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver details'
    });
  }
};

// Get vendor subscribers with their locations
const getVendorSubscribersWithLocations = async (req, res) => {
  try {
    const { vendorId } = req.params;

    console.log('Fetching subscribers for vendor:', vendorId);

    // First get vendor location
    const vendor = await Vendor.findOne({ firebaseUid: vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    console.log('Vendor found:', vendor.name, 'Address:', vendor.address);

    // Find all active subscriptions for this vendor
    const subscriptions = await ConsumerSubscription.find({
      vendor_id: vendor._id,
      active: true,
      end_date: { $gt: new Date() } // Only active subscriptions
    }).populate('consumer_id', 'name email contactNumber address');

    console.log('Found subscriptions:', subscriptions.length);

    // Extract customer data with locations
    const subscribersWithLocations = subscriptions
      .map(sub => {
        const customer = sub.consumer_id;
        if (!customer) return null;

        // Check if customer has address with coordinates
        if (customer.address && 
            customer.address.coordinates && 
            typeof customer.address.coordinates.lat === 'number' && 
            typeof customer.address.coordinates.lng === 'number') {
          
          return {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            contactNumber: customer.contactNumber,
            address: `${customer.address.street || ''}, ${customer.address.city || ''}, ${customer.address.state || ''}`.trim(),
            coordinates: [customer.address.coordinates.lng, customer.address.coordinates.lat], // [longitude, latitude] for Leaflet
            lastUpdated: customer.updatedAt
          };
        }
        return null;
      })
      .filter(subscriber => subscriber !== null);

    console.log('Subscribers with valid locations:', subscribersWithLocations.length);

    // Prepare vendor location in the same format
    const vendorLocation = vendor.address && 
                          vendor.address.coordinates && 
                          typeof vendor.address.coordinates.lat === 'number' && 
                          typeof vendor.address.coordinates.lng === 'number' 
      ? {
          coordinates: [vendor.address.coordinates.lng, vendor.address.coordinates.lat],
          address: `${vendor.address.street || ''}, ${vendor.address.city || ''}, ${vendor.address.state || ''}`.trim(),
          name: vendor.name
        }
      : null;

    res.status(200).json({
      success: true,
      subscribers: subscribersWithLocations,
      vendorLocation: vendorLocation,
      count: subscribersWithLocations.length,
      vendorInfo: {
        name: vendor.name,
        hasLocation: !!vendorLocation
      }
    });
  } catch (error) {
    console.error('Error fetching subscribers with locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscribers with locations'
    });
  }
};

// Assign driver to vendor for delivery
const assignDriverToVendor = async (req, res) => {
  try {
    const { vendorId, driverId } = req.body;

    // Validate vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Validate driver exists and is available
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!driver.available) {
      return res.status(400).json({
        success: false,
        message: 'Driver is not available'
      });
    }

    // Update driver status to busy
    await Driver.findByIdAndUpdate(driverId, { available: false });

    // You might want to create a delivery assignment model here
    // For now, we'll just return success

    res.status(200).json({
      success: true,
      message: 'Driver assigned successfully',
      assignment: {
        vendorId,
        driverId,
        assignedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign driver'
    });
  }
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Distance in meters
};

// Solve TSP using nearest neighbor heuristic
const solveTSP = (vendorLocation, customerLocations) => {
  const startPoint = vendorLocation;
  const unvisited = [...customerLocations];
  const route = [];
  let currentLocation = startPoint;
  let totalDistance = 0;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(
      currentLocation.coordinates[1], currentLocation.coordinates[0],
      unvisited[0].coordinates[1], unvisited[0].coordinates[0]
    );

    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(
        currentLocation.coordinates[1], currentLocation.coordinates[0],
        unvisited[i].coordinates[1], unvisited[i].coordinates[0]
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const nextCustomer = unvisited.splice(nearestIndex, 1)[0];
    route.push(nextCustomer);
    currentLocation = nextCustomer.location;
    totalDistance += nearestDistance;
  }

  return { route, totalDistance };
};

// Create delivery assignment
const createDelivery = async (req, res) => {
  try {
    const { vendorId, driverId, customers } = req.body;

    console.log('Creating delivery with:', { 
      vendorId, 
      driverId, 
      customersCount: customers?.length,
      vendorIdType: typeof vendorId
    });

    // Find vendor by Firebase UID (not MongoDB _id)
    const vendor = await Vendor.findOne({ firebaseUid: vendorId });
    const driver = await Driver.findById(driverId);

    console.log('Vendor lookup result:', {
      vendorFound: !!vendor,
      vendorId: vendor?._id,
      vendorName: vendor?.name
    });

    console.log('Driver lookup result:', {
      driverFound: !!driver,
      driverId: driver?._id,
      driverName: driver?.name,
      driverAvailable: driver?.available
    });

    if (!vendor) {
      console.error('Vendor not found with firebaseUid:', vendorId);
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (!driver) {
      console.error('Driver not found with _id:', driverId);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!driver.available) {
      return res.status(400).json({
        success: false,
        message: 'Driver is not available'
      });
    }

    // Use customers from request body if provided
    let deliveryCustomers = [];
    
    if (customers && customers.length > 0) {
      // Use customers provided in the request
      deliveryCustomers = customers.map((customer, index) => ({
        customerId: customer.customerId,
        address: customer.address,
        location: customer.location,
        deliveryOrder: index + 1,
        estimatedArrival: new Date(Date.now() + (index + 1) * 15 * 60 * 1000), // 15 mins per delivery
        status: 'pending'
      }));
    } else {
      // Fallback: fetch from subscriptions
      const subscriptions = await ConsumerSubscription.find({
        vendor_id: vendor._id,
        active: true,
        end_date: { $gt: new Date() }
      }).populate('consumer_id', 'name email contactNumber address');

      deliveryCustomers = subscriptions
        .map(sub => sub.consumer_id)
        .filter(customer => customer && customer.address && customer.address.coordinates)
        .map((customer, index) => ({
          customerId: customer._id,
          address: `${customer.address.street || ''}, ${customer.address.city || ''}, ${customer.address.state || ''}`.trim(),
          location: {
            type: 'Point',
            coordinates: [customer.address.coordinates.lng, customer.address.coordinates.lat]
          },
          deliveryOrder: index + 1,
          estimatedArrival: new Date(Date.now() + (index + 1) * 15 * 60 * 1000),
          status: 'pending'
        }));
    }

    if (deliveryCustomers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No customers with valid locations found'
      });
    }

    console.log('Delivery customers prepared:', deliveryCustomers.length);

    // Calculate basic route info
    let totalDistance = 0;
    if (vendor.address && vendor.address.coordinates) {
      // Calculate rough distance from vendor to all customers
      deliveryCustomers.forEach(customer => {
        if (customer.location && customer.location.coordinates) {
          const distance = calculateDistance(
            vendor.address.coordinates.lat,
            vendor.address.coordinates.lng,
            customer.location.coordinates[1],
            customer.location.coordinates[0]
          );
          totalDistance += distance;
        }
      });
    }

    // Create delivery with vendor MongoDB _id (not Firebase UID)
    const delivery = new Delivery({
      vendorId: vendor._id, // Use MongoDB _id for internal references
      driverId: driver._id,
      customers: deliveryCustomers,
      totalDistance: totalDistance,
      estimatedTotalTime: Math.ceil(totalDistance / 1000 * 3) + (deliveryCustomers.length * 5), // 3 min per km + 5 min per stop
      driverLocation: driver.location || {
        type: 'Point',
        coordinates: [0, 0],
        lastUpdated: new Date()
      }
    });

    await delivery.save();
    console.log('Delivery created with ID:', delivery._id);

    // Update driver availability
    await Driver.findByIdAndUpdate(driverId, { available: false });

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      delivery: {
        id: delivery._id,
        status: delivery.status,
        totalDistance: delivery.totalDistance,
        estimatedTotalTime: delivery.estimatedTotalTime,
        customersCount: delivery.customers.length,
        optimizedRoute: delivery.customers,
        vendorId: vendor._id,
        driverId: driver._id
      }
    });
  } catch (error) {
    console.error('Error creating delivery:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create delivery',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Check if driver is within 500m of vendor
const checkDriverVendorProximity = async (req, res) => {
  try {
    const { driverId, vendorId } = req.params;

    const driver = await Driver.findById(driverId);
    const vendor = await Vendor.findById(vendorId);

    if (!driver || !vendor) {
      return res.status(404).json({
        success: false,
        message: 'Driver or vendor not found'
      });
    }

    if (!driver.location.coordinates || !vendor.location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Location data not available'
      });
    }

    const distance = calculateDistance(
      driver.location.coordinates[1], driver.location.coordinates[0],
      vendor.location.coordinates[1], vendor.location.coordinates[0]
    );

    const isWithinRange = distance <= 500; // 500 meters

    res.status(200).json({
      success: true,
      isWithinRange,
      distance: Math.round(distance),
      message: isWithinRange 
        ? 'Driver is within delivery range' 
        : `Driver is ${Math.round(distance)}m away from vendor. Must be within 500m to start delivery.`
    });
  } catch (error) {
    console.error('Error checking proximity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check proximity'
    });
  }
};

// Start delivery (only if driver is within 500m of vendor)
const startDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { driverLocation } = req.body;

    const delivery = await Delivery.findById(deliveryId).populate('vendorId');
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (delivery.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Delivery cannot be started'
      });
    }

    // Check proximity
    const vendor = delivery.vendorId;
    const distance = calculateDistance(
      driverLocation.coordinates[1], driverLocation.coordinates[0],
      vendor.location.coordinates[1], vendor.location.coordinates[0]
    );

    if (distance > 500) {
      return res.status(400).json({
        success: false,
        message: `You are ${Math.round(distance)}m away from vendor. Must be within 500m to start delivery.`,
        distance: Math.round(distance)
      });
    }

    // Start delivery
    delivery.status = 'started';
    delivery.startedAt = new Date();
    delivery.driverLocation = driverLocation;
    await delivery.save();

    res.status(200).json({
      success: true,
      message: 'Delivery started successfully',
      delivery: {
        id: delivery._id,
        status: delivery.status,
        customers: delivery.customers,
        startedAt: delivery.startedAt
      }
    });
  } catch (error) {
    console.error('Error starting delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start delivery'
    });
  }
};

// Update driver location during delivery
const updateDriverLocationInDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { location } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Update driver location in delivery
    delivery.driverLocation = {
      type: 'Point',
      coordinates: location.coordinates,
      lastUpdated: new Date()
    };
    await delivery.save();

    // Also update driver's main location
    await Driver.findByIdAndUpdate(delivery.driverId, {
      'location.coordinates': location.coordinates,
      'location.lastUpdated': new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
};

// Get active delivery for driver
const getActiveDelivery = async (req, res) => {
  try {
    const { driverId } = req.params;

    console.log('🔍 Fetching active delivery for driverId:', driverId);

    // Convert string ID to MongoDB ObjectId for proper comparison
    const mongoose = require('mongoose');
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(driverId);
      console.log('✅ Successfully created ObjectId:', objectId);
    } catch (error) {
      console.error('❌ Invalid ObjectId format:', driverId);
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID format'
      });
    }

    const delivery = await Delivery.findOne({
      driverId: objectId,
      status: { $in: ['assigned', 'started', 'in_progress'] }
    }).populate('vendorId', 'name address location')
      .populate('customers.customerId', 'name address contactNumber');

    console.log('🚚 Found active delivery:', delivery ? 'Yes' : 'No');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'No active delivery found'
      });
    }

    res.status(200).json({
      success: true,
      delivery
    });
  } catch (error) {
    console.error('Error fetching active delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active delivery'
    });
  }
};

// Get all deliveries for a driver (including completed ones)
const getAllDriverDeliveries = async (req, res) => {
  try {
    const { driverId } = req.params;
    console.log('🔍 Fetching deliveries for driverId:', driverId);

    // Convert string ID to MongoDB ObjectId for proper comparison
    const mongoose = require('mongoose');
    let driverObjectId;
    try {
      driverObjectId = new mongoose.Types.ObjectId(driverId);
      console.log('✅ Successfully created ObjectId:', driverObjectId.toString());
    } catch (error) {
      console.error('❌ Invalid ObjectId format:', driverId);
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID format'
      });
    }

    // Step 1: Verify the driver exists
    const driver = await Driver.findById(driverObjectId);
    if (!driver) {
      console.log('❌ Driver not found with ID:', driverId);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    console.log('✅ Driver found:', driver.name, driver.email);

    // Step 2: Find all deliveries where driverId matches
    const deliveries = await Delivery.find({ driverId: driverObjectId })
      .populate('vendorId', 'name address location email contactNumber')
      .populate('customers.customerId', 'name address contactNumber email')
      .sort({ createdAt: -1 }); // Most recent first

    // Format the deliveries to ensure address objects are converted to strings for display
    // while preserving the original coordinate data
    const formattedDeliveries = deliveries.map(delivery => {
      const deliveryObj = delivery.toObject();
      
      // Preserve vendor coordinates before formatting address
      if (deliveryObj.vendorId && deliveryObj.vendorId.address) {
        const originalCoords = deliveryObj.vendorId.address.coordinates;
        
        // Format vendor address string for display
        if (typeof deliveryObj.vendorId.address === 'object') {
          const addr = deliveryObj.vendorId.address;
          const parts = [];
          if (addr.street) parts.push(addr.street);
          if (addr.city) parts.push(addr.city);
          if (addr.state) parts.push(addr.state);
          if (addr.pincode) parts.push(addr.pincode);
          
          // Create both formatted string and preserve original structure
          deliveryObj.vendorId.addressString = parts.length > 0 ? parts.join(', ') : 'Address not available';
          // Keep original address object with coordinates
          deliveryObj.vendorId.address = {
            ...addr,
            coordinates: originalCoords,
            formatted: deliveryObj.vendorId.addressString
          };
        }
      }

      // Format customer addresses while preserving coordinates
      if (deliveryObj.customers) {
        deliveryObj.customers = deliveryObj.customers.map(customer => {
          if (customer.customerId && customer.customerId.address && typeof customer.customerId.address === 'object') {
            const addr = customer.customerId.address;
            const originalCoords = addr.coordinates;
            const parts = [];
            if (addr.street) parts.push(addr.street);
            if (addr.city) parts.push(addr.city);
            if (addr.state) parts.push(addr.state);
            if (addr.pincode) parts.push(addr.pincode);
            
            // Create both formatted string and preserve original structure
            const addressString = parts.length > 0 ? parts.join(', ') : 'Address not available';
            customer.customerId.addressString = addressString;
            // Keep original address object with coordinates
            customer.customerId.address = {
              ...addr,
              coordinates: originalCoords,
              formatted: addressString
            };
          }
          return customer;
        });
      }

      return deliveryObj;
    });

    console.log('📦 Found', formattedDeliveries.length, 'deliveries for driver:', driver.name);

    // Step 3: Log some debug info
    formattedDeliveries.forEach((delivery, index) => {
      console.log(`📝 Delivery ${index + 1}:`, {
        id: delivery._id.toString(),
        vendor: delivery.vendorId?.name,
        vendorAddress: delivery.vendorId?.address,
        customers: delivery.customers.length,
        status: delivery.status,
        createdAt: delivery.createdAt
      });
    });

    // Step 4: Return the deliveries with driver info
    res.status(200).json({
      success: true,
      driver: {
        id: driver._id.toString(),
        name: driver.name,
        email: driver.email,
        contactNumber: driver.contactNumber,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber
      },
      deliveries: formattedDeliveries,
      totalDeliveries: formattedDeliveries.length,
      message: `Found ${formattedDeliveries.length} deliveries for ${driver.name}`
    });

  } catch (error) {
    console.error('❌ Error fetching driver deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver deliveries',
      error: error.message
    });
  }
};

// Get delivery tracking info for customers
const getDeliveryTracking = async (req, res) => {
  try {
    const { customerId } = req.params; // This is actually the Firebase UID

    console.log('Fetching delivery tracking for customerId (Firebase UID):', customerId);

    // First, find the customer by Firebase UID to get their MongoDB _id
    const customer = await Customer.findOne({ firebaseUid: customerId });
    
    if (!customer) {
      console.log('Customer not found with Firebase UID:', customerId);
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    console.log('Found customer:', {
      mongoId: customer._id,
      firebaseUid: customer.firebaseUid,
      name: customer.name
    });

    // Now use the customer's MongoDB _id to find deliveries
    const delivery = await Delivery.findOne({
      'customers.customerId': customer._id, // Use MongoDB _id instead of Firebase UID
      status: { $in: ['started', 'in_progress'] }
    }).populate('driverId', 'name contactNumber vehicleType vehicleNumber rating')
      .populate('vendorId', 'name address');

    if (!delivery) {
      console.log('No active delivery found for customer MongoDB _id:', customer._id);
      return res.status(404).json({
        success: false,
        message: 'No active delivery found for this customer'
      });
    }

    const customerDelivery = delivery.customers.find(
      c => c.customerId.toString() === customer._id.toString() // Compare MongoDB _ids
    );

    console.log('Found delivery tracking:', {
      deliveryId: delivery._id,
      customerDelivery: customerDelivery ? 'Found' : 'Not found'
    });

    res.status(200).json({
      success: true,
      tracking: {
        deliveryId: delivery._id,
        driver: delivery.driverId,
        vendor: delivery.vendorId,
        driverLocation: delivery.driverLocation,
        estimatedArrival: customerDelivery.estimatedArrival,
        deliveryOrder: customerDelivery.deliveryOrder,
        status: customerDelivery.status,
        totalCustomers: delivery.customers.length
      }
    });
  } catch (error) {
    console.error('Error fetching delivery tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery tracking'
    });
  }
};

module.exports = {
  getAllDrivers,
  getAvailableDrivers,
  getDriverById,
  getVendorSubscribersWithLocations,
  assignDriverToVendor,
  createDelivery,
  checkDriverVendorProximity,
  startDelivery,
  updateDriverLocationInDelivery,
  getActiveDelivery,
  getAllDriverDeliveries,
  getDeliveryTracking
};