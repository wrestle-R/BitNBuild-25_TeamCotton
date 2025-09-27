import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useDriverContext } from '../context/DriverContext';

export default function IndexPage() {
  // Add error boundary and logging
  console.log('🏠 Index component rendering...');
  
  let driverContextData;
  try {
    driverContextData = useDriverContext();
    console.log('✅ Index - Successfully got driver context:', {
      hasDriver: !!driverContextData.driver,
      loading: driverContextData.loading,
      contextReady: driverContextData.contextReady
    });
  } catch (error) {
    console.error('💥 Index - Error getting driver context:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: 'red', textAlign: 'center', fontSize: 16, marginTop: 10 }}>
          Error loading app: {error.message}
        </Text>
        <Text style={{ color: '#666', textAlign: 'center', marginTop: 10 }}>
          Please restart the app
        </Text>
      </View>
    );
  }

  const { driver, loading } = driverContextData;
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (driver) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [driver, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}