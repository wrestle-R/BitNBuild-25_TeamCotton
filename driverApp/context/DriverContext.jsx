import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase.config';
import { Alert, Platform, View, Text, ActivityIndicator } from 'react-native';
import LocationService from '../services/LocationService';

const DriverContext = createContext();

export const useDriverContext = () => {
  const context = useContext(DriverContext);
  
  // Enhanced debugging
  console.log('🔍 useDriverContext called:', {
    contextExists: !!context,
    contextKeys: context ? Object.keys(context) : null,
    contextReady: context ? context.contextReady : null,
    stackTrace: new Error().stack?.split('\n')[1]?.trim()
  });
  
  if (!context) {
    console.error('❌ useDriverContext called outside of DriverProvider!');
    console.error('🔍 Call stack:', new Error().stack);
    throw new Error('useDriverContext must be used within a DriverProvider');
  }

  // Additional check for context readiness
  if (!context.contextReady) {
    console.log('⏳ Context exists but not ready yet');
    return {
      ...context,
      loading: true, // Ensure loading state is true when context isn't ready
    };
  }

  return context;
};

export const DriverProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationPermission, setLocationPermission] = useState(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [contextReady, setContextReady] = useState(false);

  const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // Enhanced logging for debugging
  console.log('🔧 DriverContext State:', {
    driver: driver ? {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      contactNumber: driver.contactNumber,
      address: driver.address,
      role: driver.role,
      firebaseUid: driver.firebaseUid,
      mongoid: driver.mongoid
    } : null,
    loading,
    error,
    contextReady,
    API_BASE
  });

  // Mark context as ready after first render
  useEffect(() => {
    console.log('🚀 DriverProvider initializing...');
    setContextReady(true);
  }, []);

  // Configure Google Sign-In (temporarily disabled for testing)
  // useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  //   });
  // }, []);

  // Create driver profile in backend
  const createDriverProfile = async (firebaseUser, userData) => {
    try {
      console.log('🏗️ Creating driver profile for:', firebaseUser.uid);
      console.log('📡 API_BASE:', API_BASE);
      
      const requestData = {
        firebaseUid: firebaseUser.uid,
        name: userData.name || firebaseUser.displayName,
        email: firebaseUser.email,
        role: 'driver',
        contactNumber: '',
        address: '',
      };
      
      console.log('📤 Sending request data:', requestData);
      
      const response = await fetch(`${API_BASE}/api/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 Backend response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.message || 'Profile creation failed');
      }

      const result = await response.json();
      console.log('✅ Backend profile created successfully:', result);
      return result;
    } catch (error) {
      console.error('💥 Profile creation error:', error);
      console.error('💥 Error details:', error.message);
      throw error;
    }
  };

  // Validate driver role during login
  const validateDriverRole = async (firebaseUid) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/validate-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUid,
          role: 'driver',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Role validation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Role validation error:', error);
      throw error;
    }
  };

  // Handle authentication errors
  const handleAuthError = (error) => {
    console.error('Authentication error:', error);
    setError(error.message);
    Alert.alert('Authentication Error', error.message);
  };

  // Email registration
  const registerWithEmail = async (email, password, displayName) => {
    console.log('🚀 Starting email registration for:', email);
    setLoading(true);
    setError('');

    try {
      console.log('📧 Creating Firebase user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase user created:', firebaseUser.uid);

      console.log('👤 Updating profile...');
      await updateProfile(firebaseUser, {
        displayName: displayName,
      });
      console.log('✅ Profile updated');

      console.log('🏗️ Creating driver profile in backend...');
      const profileData = await createDriverProfile(firebaseUser, {
        name: displayName,
        role: 'driver',
      });
      console.log('✅ Backend profile created:', profileData);

      // Store token and user data (including mongoid)
      await AsyncStorage.setItem('driver_token', profileData.token);
      const driverWithMongoId = {
        ...profileData.user,
        mongoid: profileData.user.id // MongoDB _id is returned as 'id' from backend
      };
      setDriver(driverWithMongoId);
      console.log('✅ Driver data set in context');

      Alert.alert('Success', 'Account created successfully!');
      return { success: true };
    } catch (error) {
      console.error('💥 Registration error:', error);
      console.error('💥 Error code:', error.code);
      console.error('💥 Error message:', error.message);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account already exists with this email. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters long.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Error', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Email login
  const loginWithEmail = async (email, password) => {
    console.log('🚀 Starting email login for:', email);
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Signing in with Firebase...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase sign-in successful:', firebaseUser.uid);

      // Get driver data from backend to include mongoid
      try {
        console.log('🔍 Fetching driver data from backend...');
        const response = await fetch(`${API_BASE}/api/auth/user/${firebaseUser.uid}`);
        console.log('📡 Backend response status:', response.status);
        
        if (response.ok) {
          const backendDriverData = await response.json();
          console.log('✅ Backend data received:', backendDriverData);
          
          console.log('🔍 Login - Backend driver data received:', {
            user: backendDriverData.user,
            hasVehicleType: !!backendDriverData.user.vehicleType,
            hasVehicleNumber: !!backendDriverData.user.vehicleNumber,
            hasContactNumber: !!backendDriverData.user.contactNumber
          });
          
          // Check if user is actually a driver
          if (backendDriverData.user.role !== 'driver') {
            console.log('🚫 User is not a driver, role:', backendDriverData.user.role);
            throw new Error('You are not registered as a driver. Please use the correct app for your role.');
          }
          
          // Store token and driver data (including mongoid)
          await AsyncStorage.setItem('driver_token', backendDriverData.token);
          const driverWithMongoId = {
            ...backendDriverData.user,
            mongoid: backendDriverData.user.id // MongoDB _id is returned as 'id' from backend
          };
          
          console.log('🔍 Login - Final driver object being set:', {
            email: driverWithMongoId.email,
            contactNumber: driverWithMongoId.contactNumber,
            vehicleType: driverWithMongoId.vehicleType,
            vehicleNumber: driverWithMongoId.vehicleNumber,
            role: driverWithMongoId.role
          });
          
          setDriver(driverWithMongoId);
          console.log('✅ Driver data set in context');
          
          // Initialize location tracking for the authenticated driver (more aggressive)
          try {
            await initializeLocationTracking(driverWithMongoId);
          } catch (error) {
            console.warn('⚠️ Location tracking initialization failed:', error);
            // Continue anyway, user can enable manually
          }
        } else {
          console.log('❌ Backend fetch failed, trying validation...');
          // Try to validate as driver
          const validatedData = await validateDriverRole(firebaseUser.uid);
          await AsyncStorage.setItem('driver_token', validatedData.token);
          const driverWithMongoId = {
            ...validatedData.user,
            mongoid: validatedData.user.id
          };
          setDriver(driverWithMongoId);
          console.log('✅ Driver validated and data set');
        }
      } catch (backendError) {
        console.error('💥 Error fetching driver data from backend:', backendError);
        throw backendError;
      }

      Alert.alert('Success', 'Welcome back!');
      return { success: true };
    } catch (error) {
      console.error('💥 Login error:', error);
      console.error('💥 Error code:', error.code);
      console.error('💥 Error message:', error.message);
      
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Error', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google authentication (temporarily simplified)
  const loginWithGoogle = async () => {
    setLoading(true);
    setError('');

    try {
      // For now, show a message that Google Sign-in will be implemented
      Alert.alert(
        'Google Sign-in',
        'Google Sign-in will be available soon. Please use email authentication for now.',
        [{ text: 'OK', style: 'default' }]
      );
      
      return { success: false };
    } catch (error) {
      console.error('Google authentication error:', error);
      Alert.alert('Google Sign-in Error', 'Google Sign-in is not available at the moment.');
      setError('Google Sign-in not available');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout - direct and simple
  const logout = async () => {
    try {
      console.log('🚪 Starting direct logout...');
      
      // Stop location tracking first
      await stopLocationTracking();
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('driver_token');
      console.log('✅ AsyncStorage cleared');
      
      // Sign out from Firebase
      await signOut(auth);
      console.log('✅ Firebase signed out');
      
      // Clear driver state immediately
      setDriver(null);
      setError('');
      console.log('✅ Driver context cleared');
      
    } catch (err) {
      console.error('💥 Logout error (continuing anyway):', err);
      // Even if there's an error, clear the local state for security
      await stopLocationTracking().catch(() => {});
      setDriver(null);
      setError('');
      await AsyncStorage.removeItem('driver_token').catch(() => {});
    }
  };

  // Test connection
  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/test`);
      const result = await response.json();
      return { success: true, message: result.message || 'Connected' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Firebase auth state listener
  useEffect(() => {
    console.log('🔥 Setting up Firebase auth state listener for driver app');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', {
        user: firebaseUser ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified
        } : null
      });

      try {
        if (firebaseUser) {
          // User is signed in
          console.log('✅ Driver is authenticated, setting up driver data');
          
          // Get or refresh the token
          const token = await firebaseUser.getIdToken();
          
          // Try to get driver data from backend to include mongoid
          try {
            const response = await fetch(`${API_BASE}/api/auth/user/${firebaseUser.uid}`);
            if (response.ok) {
              const backendDriverData = await response.json();
              
              console.log('🔍 Backend driver data received:', {
                user: backendDriverData.user,
                hasVehicleType: !!backendDriverData.user.vehicleType,
                hasVehicleNumber: !!backendDriverData.user.vehicleNumber,
                hasContactNumber: !!backendDriverData.user.contactNumber
              });
              
              // Check if user is actually a driver
              if (backendDriverData.user.role !== 'driver') {
                console.log('🚫 User is not a driver, logging out');
                await signOut(auth);
                Alert.alert('Access Denied', 'You are not registered as a driver. Please use the correct app for your role.');
                return;
              }
              
              // Store token and driver data with mongoid
              await AsyncStorage.setItem('driver_token', backendDriverData.token);
              const driverWithMongoId = {
                ...backendDriverData.user,
                mongoid: backendDriverData.user.id,
                emailVerified: firebaseUser.emailVerified
              };
              
              console.log('🔍 Final driver object being set:', {
                email: driverWithMongoId.email,
                contactNumber: driverWithMongoId.contactNumber,
                vehicleType: driverWithMongoId.vehicleType,
                vehicleNumber: driverWithMongoId.vehicleNumber,
                role: driverWithMongoId.role
              });
              
              setDriver(driverWithMongoId);
              
              // Initialize location tracking for the authenticated driver (more aggressive)
              try {
                await initializeLocationTracking(driverWithMongoId);
              } catch (error) {
                console.warn('⚠️ Location tracking initialization failed:', error);
                // Continue anyway, user can enable manually
              }
            } else {
              // Try to validate as driver
              try {
                const validatedData = await validateDriverRole(firebaseUser.uid);
                await AsyncStorage.setItem('driver_token', validatedData.token);
                const driverWithMongoId = {
                  ...validatedData.user,
                  mongoid: validatedData.user.id,
                  emailVerified: firebaseUser.emailVerified
                };
                setDriver(driverWithMongoId);
              } catch (validationError) {
                console.log('🚫 Driver validation failed, logging out');
                await signOut(auth);
                Alert.alert('Access Denied', 'You are not registered as a driver. Please register first.');
                return;
              }
            }
          } catch (backendError) {
            console.error('Error fetching driver data from backend in auth state listener:', backendError);
            // Try to validate as driver
            try {
              const validatedData = await validateDriverRole(firebaseUser.uid);
              await AsyncStorage.setItem('driver_token', validatedData.token);
              const driverWithMongoId = {
                ...validatedData.user,
                mongoid: validatedData.user.id,
                emailVerified: firebaseUser.emailVerified
              };
              setDriver(driverWithMongoId);
            } catch (validationError) {
              console.log('🚫 Driver validation failed, logging out');
              await signOut(auth);
              Alert.alert('Access Denied', 'You are not registered as a driver.');
              return;
            }
          }
          
          console.log('✅ Driver data set from Firebase auth state');
        } else {
          // User is signed out
          console.log('🚫 Driver is not authenticated, clearing driver data');
          
          // Clear async storage and driver state
          await AsyncStorage.removeItem('driver_token');
          setDriver(null);
          setError('');
        }
      } catch (error) {
        console.error('💥 Error handling auth state change:', error);
        setError('Authentication state error');
        // Clear everything on error
        await AsyncStorage.removeItem('driver_token');
        setDriver(null);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔥 Cleaning up Firebase auth state listener');
      unsubscribe();
    };
  }, []);

  // Update driver profile with additional details
  const updateDriverProfile = async (profileData) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔧 Updating driver profile with:', profileData);
      
      if (!driver || !driver.firebaseUid) {
        throw new Error('No authenticated driver found');
      }
      
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE}/api/auth/update-driver`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firebaseUid: driver.firebaseUid,
          ...profileData
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update local driver state
      const updatedDriver = {
        ...driver,
        ...profileData,
        ...data.user
      };
      
      setDriver(updatedDriver);
      console.log('✅ Driver profile updated successfully');
      
      return { success: true, user: updatedDriver };
      
    } catch (error) {
      console.error('💥 Error updating driver profile:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Initialize location tracking for authenticated driver
  const initializeLocationTracking = async (driverData) => {
    try {
      console.log('🚀 Initializing location tracking for driver:', driverData.email);
      
      // Always try to request location permissions (don't skip on web for testing)
      console.log('📍 Requesting location permissions...');
      const permissions = await LocationService.requestLocationPermission();
      setLocationPermission(permissions);
      
      console.log('� Location permissions result:', permissions);
      
      if (!permissions.foreground) {
        console.log('⚠️ Location permission denied, showing alert');
        Alert.alert(
          'Location Permission Required',
          'Location access is required for drivers to receive ride requests and navigate to customers. Please enable location access.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Enable Location', 
              onPress: async () => {
                // Try again
                const retryPermissions = await LocationService.requestLocationPermission();
                setLocationPermission(retryPermissions);
                if (retryPermissions.foreground) {
                  // Start tracking after permission granted
                  await startLocationTracking(driverData);
                }
              }
            }
          ]
        );
        return;
      }

      // Start location tracking immediately
      await startLocationTracking(driverData);
      
    } catch (error) {
      console.error('💥 Error initializing location tracking:', error);
      Alert.alert(
        'Location Error',
        'Failed to initialize location tracking. Please try enabling location manually.',
        [{ text: 'OK' }]
      );
    }
  };

  // Separate function to start location tracking
  const startLocationTracking = async (driverData) => {
    try {
      console.log('🎯 Starting location tracking...');
      
      // Define location update callback
      const onLocationUpdate = (coordinates) => {
        console.log('📍 Location updated in context:', coordinates);
        setDriver(prevDriver => {
          if (!prevDriver) return prevDriver;
          return {
            ...prevDriver,
            location: {
              type: 'Point',
              coordinates: [coordinates.longitude, coordinates.latitude],
              address: prevDriver.location?.address || 'Location updated',
              lastUpdated: new Date()
            }
          };
        });
      };

      // Start location tracking with callback
      await LocationService.startTracking(driverData, onLocationUpdate);
      setIsLocationTracking(true);
      
      console.log('✅ Location tracking started successfully');
      
    } catch (error) {
      console.error('💥 Error starting location tracking:', error);
      setIsLocationTracking(false);
      throw error;
    }
  };

  // Stop location tracking
  const stopLocationTracking = async () => {
    try {
      console.log('🛑 Stopping location tracking...');
      await LocationService.stopTracking();
      setIsLocationTracking(false);
      console.log('✅ Location tracking stopped');
    } catch (error) {
      console.error('💥 Error stopping location tracking:', error);
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      return await LocationService.getCurrentLocation();
    } catch (error) {
      console.error('💥 Error getting current location:', error);
      throw error;
    }
  };

  const contextValue = {
    driver,
    loading,
    error,
    locationPermission,
    isLocationTracking,
    contextReady,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    testConnection,
    updateDriverProfile,
    initializeLocationTracking,
    stopLocationTracking,
    getCurrentLocation,
  };

  // Don't render children until context is ready, but always provide the context
  if (!contextReady) {
    console.log('⏳ DriverContext not ready yet, showing loading...');
    return (
      <DriverContext.Provider value={contextValue}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 10, fontSize: 16, color: '#666' }}>Initializing Driver App...</Text>
        </View>
      </DriverContext.Provider>
    );
  }

  console.log('✅ DriverContext ready, rendering children');
  return (
    <DriverContext.Provider value={contextValue}>
      {children}
    </DriverContext.Provider>
  );
};