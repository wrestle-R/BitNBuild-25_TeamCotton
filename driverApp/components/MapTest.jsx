import React from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

// Simple test component to verify maps are working
const MapTest = () => {
  return (
    <View style={{ flex: 1 }}>
      <Text>Map Test Component</Text>
      <MapView
        style={{ width: 300, height: 200 }}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{ latitude: 37.78825, longitude: -122.4324 }}
          title="Test Marker"
        />
      </MapView>
    </View>
  );
};

export default MapTest;