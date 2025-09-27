import { Image } from 'expo-image';
import { View, Text } from 'react-native';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '../../components/HelloWave';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import '../../global.css';

export default function HomeScreen() {
  return (
   <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-blue-500 text-2xl font-bold">
        NativeWind is working! 🎉
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
