import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '../../components/HapticTab';
import { Ionicons } from '@expo/vector-icons';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false, // Hide headers across all tab screens
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          position: 'absolute',
          height: Platform.OS === 'ios' ? 80 : 64,
          borderTopWidth: 0,
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          paddingBottom: Platform.OS === 'ios' ? 12 : 6,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Market',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="paper-plane" size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size ?? 24} color={color} />,
        }}
      />
    </Tabs>
  );
}
