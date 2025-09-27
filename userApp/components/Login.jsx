import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  useColorScheme,
  StyleSheet,
  StatusBar,
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { getColors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { loginUser } from '../api/authApi';
import GoogleSignInButton from './GoogleSignInButton';
import ApiTestComponent from './ApiTestComponent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Login = ({ navigation }) => {
  const router = useRouter();
  const systemColorScheme = useColorScheme(); // Ensure useColorScheme is properly imported
  const isDarkMode = systemColorScheme === 'dark';
  const colors = getColors(isDarkMode); // Initialize colors using getColors

  // Create styles inside component to access colors
  const styles = StyleSheet.create({
    fullScreen: {
      width: screenWidth,
      height: screenHeight,
      backgroundColor: colors.background,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    keyboardAvoidingView: {
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      width: '100%',
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 20,
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    // Log login attempt initiation
    console.log('🚀 LOGIN ATTEMPT INITIATED');
    console.log('📧 Email:', formData.email);
    console.log('⏰ Attempt Time:', new Date().toISOString());
    console.log('📱 Component: Login.jsx');

    setIsLoading(true);

    try {
      // Call the actual login API
      const { user } = await loginUser(formData.email, formData.password);
      
      // Log successful login completion in UI
      console.log('✅ LOGIN UI FLOW COMPLETED SUCCESSFULLY');
      console.log('👋 Welcome message for:', user.name);
      console.log('🧭 Navigating to: /(tabs)/explore');
      
      // Successful login
      Alert.alert(
        'Login Successful!',
        `Welcome back, ${user.name}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              console.log('🏠 User navigated to home screen after login');
              // Navigate to home/dashboard
              router.replace('/(tabs)/explore');
            }
          }
        ]
      );
    } catch (error) {
      // Log failed login attempt with details
      console.log('❌ LOGIN ATTEMPT FAILED');
      console.log('📧 Email:', formData.email);
      console.log('🚫 Error Type:', error.code || 'Unknown');
      console.log('💬 Error Message:', error.message || 'No message');
      console.log('⏰ Failed At:', new Date().toISOString());
      console.log('🔍 Full Error:', error);
      
      console.error('Login error:', error);
      
      let errorMessage = 'Please check your credentials and try again.';
      
      // Handle specific error messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // navigation.navigate('ForgotPassword');
    Alert.alert('Forgot Password', 'Password reset functionality coming soon!');
  };

  const handleSignUp = () => {
    // Use expo-router to navigate to the signup route
    router.push('/signup');
  };

  return (
    <View style={styles.fullScreen}>
      <StatusBar 
        barStyle={'light-content'}
        backgroundColor={colors.background}
        translucent={true}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View style={{ width: 80, height: 80, backgroundColor: colors.primary, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="home" size={32} color={colors.primaryForeground} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground, marginBottom: 8 }}>
              NourishNet
            </Text>
            <Text style={{ fontSize: 16, color: colors.mutedForeground, textAlign: 'center' }}>
              Your daily tiffin, delivered fresh
            </Text>
          </View>

          {/* Login Form */}
          <View style={{ gap: 24 }}>
            {/* Email Input */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
                Email Address
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    width: '100%',
                    padding: 16,
                    paddingLeft: 48,
                    backgroundColor: colors.input,
                    borderColor: errors.email ? colors.destructive : colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Feather
                  name="mail"
                  size={20}
                  color={colors.mutedForeground}
                  style={{ position: 'absolute', left: 16, top: 16 }}
                />
              </View>
              {errors.email && (
                <Text style={{ color: colors.destructive, fontSize: 14, marginTop: 4 }}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
                Password
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    width: '100%',
                    padding: 16,
                    paddingLeft: 48,
                    paddingRight: 48,
                    backgroundColor: colors.input,
                    borderColor: errors.password ? colors.destructive : colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <Feather
                  name="lock"
                  size={20}
                  color={colors.mutedForeground}
                  style={{ position: 'absolute', left: 16, top: 16 }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 16, top: 16 }}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={{ color: colors.destructive, fontSize: 14, marginTop: 4 }}>{errors.password}</Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: 'flex-end' }}>
              <Text style={{ color: colors.primary, fontWeight: '500' }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={{
                width: '100%',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: isLoading ? colors.muted : colors.primary,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primaryForeground} size="small" />
              ) : (
                <Text style={{ color: colors.primaryForeground, fontSize: 18, fontWeight: '600' }}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Social Login Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ marginHorizontal: 16, color: colors.mutedForeground }}>
                or continue with
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            {/* Social Login Buttons */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <GoogleSignInButton 
                colors={colors} 
                onSuccess={(data) => {
                  Alert.alert(
                    'Google Sign In Successful!',
                    `Welcome, ${data.user.name}`,
                    [{ text: 'Continue', onPress: () => router.replace('/(tabs)/explore') }]
                  );
                }}
                onError={(error) => {
                  Alert.alert('Google Sign In Failed', error?.message || 'Failed to sign in with Google');
                }}
              />
            </View>
          </View>

          {/* Sign Up Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
            <Text style={{ color: colors.mutedForeground }}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Login;