import { auth } from '../firebase.config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VITE_BACKEND_URL } from '@env';

// Backend API URL from .env
const API_URL = VITE_BACKEND_URL || 'http://10.0.2.2:5000'; // Use env variable first, fallback to Android emulator localhost

console.log('🔗 API_URL configured as:', API_URL);

/**
 * Test API connectivity
 */
export const testApiConnection = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    console.log('🧪 Testing API connection to:', `${API_URL}/api/auth/test`);
    console.log('🔍 Using API_URL from env:', API_URL);
    
    const response = await fetch(`${API_URL}/api/auth/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API connection successful:', data);
      return true;
    } else {
      console.error('❌ API connection failed with status:', response.status);
      const errorText = await response.text();
      console.error('❌ Response body:', errorText);
      return false;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ API connection error type:', error.name);
    console.error('❌ API connection error message:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
};

/**
 * Login with email/password using Firebase Auth and validate with backend
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} User data including token
 */
export const loginUser = async (email, password) => {
  try {
    // Step 0: Test API connectivity first (non-blocking for debugging)
    console.log('🔍 Testing backend connectivity...');
    const isConnected = await testApiConnection();
    if (!isConnected) {
      console.warn('⚠️  Connectivity test failed, but attempting login anyway for debugging...');
    } else {
      console.log('✅ Connectivity test passed!');
    }

    // Step 1: Authenticate with Firebase
    console.log('🔐 Authenticating with Firebase...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log('✅ Firebase authentication successful');
    
    // Step 2: Validate role with backend and get user data
    console.log('🔄 Validating role with backend...');
    console.log('🔗 Making request to:', `${API_URL}/api/auth/validate-role`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(`${API_URL}/api/auth/validate-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseUid: firebaseUser.uid,
        role: 'customer', // Always login as customer in userApp
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log('📡 Backend response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to validate user role');
    }

    // Step 3: Store user data and token in AsyncStorage
    await AsyncStorage.setItem('userToken', data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(data.user));
    
    // Log successful user login with detailed information
    console.log('🎉 USER LOGIN SUCCESSFUL 🎉');
    console.log('👤 User Details:');
    console.log('  - User ID:', data.user.id || 'N/A');
    console.log('  - Name:', data.user.name || 'N/A');
    console.log('  - Email:', data.user.email || 'N/A');
    console.log('  - Role:', data.user.role || 'N/A');
    console.log('  - Firebase UID:', firebaseUser.uid || 'N/A');
    console.log('  - Login Time:', new Date().toISOString());
    console.log('  - Token Generated:', !!data.token);
    console.log('📱 Device Info:');
    console.log('  - Platform: React Native (UserApp)');
    console.log('  - Authentication Method: Email/Password');
    console.log('🔐 Session Details:');
    console.log('  - Token Length:', data.token ? data.token.length : 0, 'characters');
    console.log('  - Session Storage: AsyncStorage');
    console.log('===============================================');
    
    return {
      user: data.user,
      token: data.token
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register new user with email/password
 * @param {Object} userData - User registration data
 * @returns {Promise} User data including token
 */
export const registerUser = async (userData) => {
  try {
    // Step 1: Create Firebase account
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const firebaseUser = userCredential.user;
    
    // Step 2: Create user in backend
    const response = await fetch(`${API_URL}/api/auth/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseUid: firebaseUser.uid,
        name: userData.name,
        email: userData.email,
        role: 'customer', // Always register as customer in userApp
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // If backend registration fails, delete the Firebase user
      await firebaseUser.delete();
      throw new Error(data.message || 'Failed to create user');
    }

    // Step 3: Store user data and token
    await AsyncStorage.setItem('userToken', data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(data.user));
    
    return {
      user: data.user,
      token: data.token
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Logout user and clear storage
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Check if user is logged in
 * @returns {Promise<boolean>} True if logged in
 */
export const isLoggedIn = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

/**
 * Get current user data from storage
 * @returns {Promise<Object|null>} User data or null
 */
export const getCurrentUser = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};
