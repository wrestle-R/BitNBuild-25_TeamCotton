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
import { getColors } from '../constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Login = ({ navigation }) => {
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

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful login
      Alert.alert(
        'Login Successful!',
        'Welcome to NourishNet',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to home screen
              // navigation.navigate('Home');
              console.log('Navigating to home...');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // navigation.navigate('ForgotPassword');
    Alert.alert('Forgot Password', 'Password reset functionality coming soon!');
  };

  const handleSignUp = () => {
    // navigation.navigate('SignUp');
    Alert.alert('Sign Up', 'Registration screen coming soon!');
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
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: colors.foreground, fontWeight: '500' }}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: colors.foreground, fontWeight: '500' }}>Facebook</Text>
              </TouchableOpacity>
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