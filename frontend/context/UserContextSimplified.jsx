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
import { toast } from 'sonner';

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
  const [token, setToken] = useState(localStorage.getItem('nourishnet_token'));

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Enhanced logging for debugging
  console.log('🔧 UserContext State:', {
    user: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      address: user.address,
      role: user.role,
      firebaseUid: user.firebaseUid,
      mongoid: user.mongoid
    } : null,
    userType,
    loading,
    error,
    API_BASE
  });

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
          role: userType,
          contact_number: '',
          address: '',
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
    console.error('Authentication error:', error);
    setError(error.message);
    toast.error(error.message);
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

      // Store token and user data (including mongoid)
      localStorage.setItem('nourishnet_token', profileData.token);
      setToken(profileData.token);
      const userWithMongoId = {
        ...profileData.user,
        mongoid: profileData.user.id // MongoDB _id is returned as 'id' from backend
      };
      setUser(userWithMongoId);

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
        toast.error(error.message || 'Registration failed. Please try again.');
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

      // Get user data from backend to include mongoid
      try {
        const response = await fetch(`${API_BASE}/api/auth/user/${firebaseUser.uid}`);
        if (response.ok) {
          const backendUserData = await response.json();
          
          // Store token and user data (including mongoid)
          localStorage.setItem('nourishnet_token', backendUserData.token);
          setToken(backendUserData.token);
          const userWithMongoId = {
            ...backendUserData.user,
            mongoid: backendUserData.user.id // MongoDB _id is returned as 'id' from backend
          };
          setUser(userWithMongoId);
        } else {
          // Fallback to basic user object if backend call fails
          const userData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            role: userType,
            firebaseUid: firebaseUser.uid,
            mongoid: null // Will be null if we can't get it from backend
          };
          
          const firebaseToken = await firebaseUser.getIdToken();
          localStorage.setItem('nourishnet_token', firebaseToken);
          setToken(firebaseToken);
          setUser(userData);
        }
      } catch (backendError) {
        console.error('Error fetching user data from backend:', backendError);
        // Fallback to basic user object
        const userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          role: userType,
          firebaseUid: firebaseUser.uid,
          mongoid: null
        };
        
        const firebaseToken = await firebaseUser.getIdToken();
        localStorage.setItem('nourishnet_token', firebaseToken);
        setToken(firebaseToken);
        setUser(userData);
      }

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
        toast.error(error.message || 'Login failed. Please try again.');
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

      // Store token and user data (including mongoid)
      localStorage.setItem('nourishnet_token', userData.token);
      setToken(userData.token);
      const userWithMongoId = {
        ...userData.user,
        mongoid: userData.user.id // MongoDB _id is returned as 'id' from backend
      };
      setUser(userWithMongoId);

    } catch (error) {
      console.error('Google authentication error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in was cancelled');
        toast.error('Sign in was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups and try again.');
      } else {
        toast.error(error.message || 'Google sign-in failed. Please try again.');
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
      setToken(null);
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
    console.log('🔥 Setting up Firebase auth state listener');
    
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
          console.log('✅ User is authenticated, setting up user data');
          
          // Get or refresh the token
          const token = await firebaseUser.getIdToken();
          
          // Try to get user data from backend to include mongoid
          try {
            const response = await fetch(`${API_BASE}/api/auth/user/${firebaseUser.uid}`);
            if (response.ok) {
              const backendUserData = await response.json();
              
              // Store token and user data with mongoid
              localStorage.setItem('nourishnet_token', backendUserData.token);
              setToken(backendUserData.token);
              const userWithMongoId = {
                ...backendUserData.user,
                mongoid: backendUserData.user.id,
                emailVerified: firebaseUser.emailVerified
              };
              setUser(userWithMongoId);
            } else {
              // Fallback to Firebase data if backend call fails
              const userData = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName,
                email: firebaseUser.email,
                role: userType,
                firebaseUid: firebaseUser.uid,
                emailVerified: firebaseUser.emailVerified,
                mongoid: null
              };

              localStorage.setItem('nourishnet_token', token);
              setToken(token);
              setUser(userData);
            }
          } catch (backendError) {
            console.error('Error fetching user data from backend in auth state listener:', backendError);
            // Fallback to Firebase data
            const userData = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName,
              email: firebaseUser.email,
              role: userType,
              firebaseUid: firebaseUser.uid,
              emailVerified: firebaseUser.emailVerified,
              mongoid: null
            };

            localStorage.setItem('nourishnet_token', token);
            setToken(token);
            setUser(userData);
          }
          
          console.log('✅ User data set from Firebase auth state');
        } else {
          // User is signed out
          console.log('🚫 User is not authenticated, clearing user data');
          
          // Clear local storage and user state
          localStorage.removeItem('nourishnet_token');
          setUser(null);
          setToken(null);
          setError('');
        }
      } catch (error) {
        console.error('💥 Error handling auth state change:', error);
        setError('Authentication state error');
        // Clear everything on error
        localStorage.removeItem('nourishnet_token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔥 Cleaning up Firebase auth state listener');
      unsubscribe();
    };
  }, [userType]); // Depend on userType so it updates when user switches types

  const contextValue = {
    user,
    userType,
    loading,
    error,
    token,
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
