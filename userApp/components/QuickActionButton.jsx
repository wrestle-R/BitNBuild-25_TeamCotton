import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import { shadows } from '../constants/Colors';

export function QuickActionButton({ 
  title, 
  icon: IconComponent, 
  onPress, 
  variant = 'primary',
  style 
}) {
  const backgroundColor = useThemeColor(
    variant === 'primary' ? { light: '#8b5cf6', dark: '#a855f7' } : {},
    variant === 'primary' ? 'primary' : 'card'
  );
  const textColor = useThemeColor(
    variant === 'primary' ? { light: '#ffffff', dark: '#ffffff' } : {},
    variant === 'primary' ? 'primaryForeground' : 'foreground'
  );
  const borderColor = useThemeColor({}, 'border');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={style}>
      <ThemedView 
        style={[
          styles.container,
          {
            backgroundColor,
            borderColor: variant === 'outline' ? borderColor : 'transparent',
            borderWidth: variant === 'outline' ? 1 : 0,
          },
          shadows.sm
        ]}
      >
        <View style={styles.content}>
          {IconComponent && (
            <IconComponent 
              size={28} 
              color={textColor} 
              style={styles.icon}
            />
          )}
          <ThemedText 
            style={[styles.title, { color: textColor }]}
          >
            {title}
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    minHeight: 80,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});