import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import { shadows, lightColors, darkColors } from '../constants/Colors';

export function ActivityItem({ 
  title, 
  description, 
  timestamp, 
  status, 
  icon: IconComponent,
  onPress,
  style 
}) {
  const backgroundColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'mutedForeground');
  const isDark = backgroundColor === darkColors.card;

  const getStatusColor = () => {
    switch (status) {
      case 'success':
      case 'active':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return mutedColor;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const content = (
    <ThemedView 
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
        },
        shadows.sm,
        style
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: mutedColor + '20' }]}>
          {IconComponent && (
            <IconComponent size={18} color={mutedColor} />
          )}
        </View>
        
        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.description, { color: mutedColor }]}>
            {description}
          </ThemedText>
          <ThemedText style={[styles.timestamp, { color: mutedColor }]}>
            {formatTimestamp(timestamp)}
          </ThemedText>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <ThemedText style={[styles.statusText, { color: getStatusColor() }]}>
            {status}
          </ThemedText>
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
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});