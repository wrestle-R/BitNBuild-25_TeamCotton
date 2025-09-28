import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('🔐 User authenticated:', firebaseUser.email);
          
          // Get fresh ID token
          const token = await firebaseUser.getIdToken(true);
          
          // Store token in AsyncStorage
          await AsyncStorage.setItem('idToken', token);
          
          // Set user data
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          });
          
          setIdToken(token);
          
          console.log('✅ Token stored successfully');
        } else {
          console.log('🚪 User logged out');
          
          // Clear stored token
          await AsyncStorage.removeItem('idToken');
          
          setUser(null);
          setIdToken(null);
        }
      } catch (error) {
        console.error('🔥 Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Refresh token periodically
  useEffect(() => {
    let tokenRefreshInterval;
    
    if (user) {
      tokenRefreshInterval = setInterval(async () => {
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const freshToken = await currentUser.getIdToken(true);
            await AsyncStorage.setItem('idToken', freshToken);
            setIdToken(freshToken);
            console.log('🔄 Token refreshed');
          }
        } catch (error) {
          console.error('🔥 Token refresh error:', error);
        }
      }, 50 * 60 * 1000); // Refresh every 50 minutes (Firebase tokens expire in 1 hour)
    }

    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [user]);

  const value = {
    user,
    loading,
    idToken,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};