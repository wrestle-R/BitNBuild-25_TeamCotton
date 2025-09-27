import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useDriverContext } from '../context/DriverContext';

export default function IndexPage() {
  const { driver, loading } = useDriverContext();
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