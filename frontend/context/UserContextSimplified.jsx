import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase.config';
import toast from 'react-hot-toast';

const UserContext = createContext();

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(localStorage.getItem('userType') || 'vendor');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Create user profile in backend
  const createUserProfile = async (firebaseUser, userData) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          name: userData.name || firebaseUser.displayName,
          email: firebaseUser.email,
          profilePicture: firebaseUser.photoURL || '',
          role: userType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Profile creation error:', error);
      throw error;
    }
  };

  // Validate user role during login
  const validateUserRole = async (firebaseUid) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/validate-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUid,
          role: userType,
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
  const handleAuthError = async (error) => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      setError(error.message);
      toast.error(error.message);
      console.error('Authentication error:', error);
    } catch (signOutError) {
      console.error('Error during signout:', signOutError);
      toast.error('An unexpected error occurred during cleanup');
    }
  };

  // Switch user type
  const switchUserType = (newUserType) => {
    console.log('🔄 Switching user type from', userType, 'to', newUserType);
    setUserType(newUserType);
    localStorage.setItem('userType', newUserType);
  };

  // Email registration
  const registerWithEmail = async (email, password, displayName) => {
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: displayName,
      });

      const profileData = await createUserProfile(firebaseUser, {
        name: displayName,
        role: userType,
      });

      // Store token and user data
      localStorage.setItem('nourishnet_token', profileData.token);
      setUser(profileData.user);

      toast.success('Account created successfully!');
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error('An account already exists with this email. Please sign in instead.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password should be at least 6 characters long.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address format.');
      } else {
        await handleAuthError(error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Email login
  const loginWithEmail = async (email, password) => {
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userData = await validateUserRole(firebaseUser.uid);

      // Store token and user data
      localStorage.setItem('nourishnet_token', userData.token);
      setUser(userData.user);

      toast.success('Welcome back!');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address format.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        await handleAuthError(error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google authentication
  const loginWithGoogle = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      let userData;
      try {
        // Try to validate existing user first
        userData = await validateUserRole(firebaseUser.uid);
        toast.success('Welcome back!');
      } catch (validationError) {
        // If validation fails, create new user
        if (validationError.message.includes('not registered as')) {
          userData = await createUserProfile(firebaseUser, {
            role: userType,
          });
          toast.success('Account created successfully!');
        } else {
          throw validationError;
        }
      }

      // Store token and user data
      localStorage.setItem('nourishnet_token', userData.token);
      setUser(userData.user);

    } catch (error) {
      console.error('Google authentication error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in was cancelled');
        setError('Sign in was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups and try again.');
        setError('Popup was blocked. Please allow popups and try again.');
      } else {
        await handleAuthError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async (message = 'Thank you for using NourishNet! 🍽️') => {
    try {
      setLoading(true);
      
      // Clear local storage
      localStorage.removeItem('nourishnet_token');
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear user state
      setUser(null);
      setError('');
      
      toast.success(message);
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Error during logout');
    } finally {
      setLoading(false);
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser && !user) {
          // User is signed in but we don't have user data yet
          // This happens on page refresh - try to validate with backend
          try {
            const userData = await validateUserRole(firebaseUser.uid);
            localStorage.setItem('nourishnet_token', userData.token);
            setUser(userData.user);
          } catch (error) {
            // If validation fails, user needs to re-authenticate
            console.log('User validation failed on refresh:', error.message);
            await signOut(auth);
          }
        } else if (!firebaseUser) {
          // User is signed out
          localStorage.removeItem('nourishnet_token');
          setUser(null);
          setError('');
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user, userType]);

  const contextValue = {
    user,
    userType,
    loading,
    error,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    switchUserType,
    testConnection,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
