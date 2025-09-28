import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import { lightColors, darkColors, shadows } from '../constants/Colors';

export function StatCard({ 
  title, 
  value, 
  icon: IconComponent, 
  iconBgColor, 
  gradientColors, 
  onPress,
  style 
}) {
  const backgroundColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'border');
  const isDark = backgroundColor === darkColors.card;
  
  const cardStyle = [
    styles.card,
    { 
      backgroundColor,
      borderColor: cardBorderColor,
    },
    shadows.md,
    style
  ];

  const content = (
    <ThemedView style={cardStyle}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.title, { color: isDark ? darkColors.mutedForeground : lightColors.mutedForeground }]}>
            {title}
          </ThemedText>
          <ThemedText style={styles.value}>
            {value}
          </ThemedText>
        </View>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          {IconComponent && <IconComponent size={24} color="white" />}
        </View>
      </View>
    </ThemedView>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    flex: 1,
    minHeight: 100,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
});