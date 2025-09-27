// colors.js - React Native theme colors converted from OKLCH to hex/rgb

export const lightColors = {
  background: '#fefefe',
  foreground: '#000000',
  card: '#fefefe',
  cardForeground: '#000000',
  popover: '#fdfdfd',
  popoverForeground: '#000000',
  primary: '#8b5cf6', // Purple primary
  primaryForeground: '#ffffff',
  secondary: '#f1f5f9',
  secondaryForeground: '#0f172a',
  muted: '#f8fafc',
  mutedForeground: '#64748b',
  accent: '#e2e8f0',
  accentForeground: '#7c3aed',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  border: '#e2e8f0',
  input: '#f1f5f9',
  ring: '#000000',
  
  // Chart colors
  chart1: '#22c55e',
  chart2: '#8b5cf6',
  chart3: '#f59e0b',
  chart4: '#3b82f6',
  chart5: '#64748b',
  
  // Sidebar colors
  sidebar: '#f8fafc',
  sidebarForeground: '#000000',
  sidebarPrimary: '#000000',
  sidebarPrimaryForeground: '#ffffff',
  sidebarAccent: '#f1f5f9',
  sidebarAccentForeground: '#000000',
  sidebarBorder: '#f1f5f9',
  sidebarRing: '#000000',
};

export const darkColors = {
  background: '#0f0f23',
  foreground: '#f1f5f9',
  card: '#1e1e3f',
  cardForeground: '#f1f5f9',
  popover: '#1e1e3f',
  popoverForeground: '#f1f5f9',
  primary: '#a855f7', // Purple primary for dark mode
  primaryForeground: '#ffffff',
  secondary: '#27272a',
  secondaryForeground: '#f1f5f9',
  muted: '#27272a',
  mutedForeground: '#94a3b8',
  accent: '#1e293b',
  accentForeground: '#c084fc',
  destructive: '#f87171',
  destructiveForeground: '#ffffff',
  border: '#374151',
  input: '#374151',
  ring: '#a855f7',
  
  // Chart colors
  chart1: '#4ade80',
  chart2: '#a855f7',
  chart3: '#fb923c',
  chart4: '#60a5fa',
  chart5: '#94a3b8',
  
  // Sidebar colors
  sidebar: '#0a0a18',
  sidebarForeground: '#f1f5f9',
  sidebarPrimary: '#a855f7',
  sidebarPrimaryForeground: '#ffffff',
  sidebarAccent: '#27272a',
  sidebarAccentForeground: '#a855f7',
  sidebarBorder: '#374151',
  sidebarRing: '#a855f7',
};

// Legacy Colors export for backward compatibility with existing code
export const Colors = {
  light: {
    text: lightColors.foreground,
    background: lightColors.background,
    tint: lightColors.primary,
    icon: lightColors.mutedForeground,
    tabIconDefault: lightColors.mutedForeground,
    tabIconSelected: lightColors.primary,
  },
  dark: {
    text: darkColors.foreground,
    background: darkColors.background,
    tint: darkColors.primary,
    icon: darkColors.mutedForeground,
    tabIconDefault: darkColors.mutedForeground,
    tabIconSelected: darkColors.primary,
  },
};

// Font families (you'll need to install these fonts in your React Native project)
export const fonts = {
  sans: 'Plus Jakarta Sans',
  serif: 'Lora',
  mono: 'IBM Plex Mono',
};

// Spacing and other values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 18,
};

// Shadow configurations for React Native
export const shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1, // Android
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
  },
};

// Usage helper function
export const getColors = (isDark = false) => {
  return isDark ? darkColors : lightColors;
};
