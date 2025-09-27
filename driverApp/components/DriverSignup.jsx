import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDriverContext } from '../context/DriverContext';
import { Ionicons } from '@expo/vector-icons';

const DriverSignup = () => {
  const router = useRouter();
  const { 
    driver, 
    loading, 
    error,
    registerWithEmail, 
    loginWithGoogle
  } = useDriverContext();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (driver) {
      router.replace('/(tabs)');
    }
  }, [driver]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { email, password, confirmPassword, displayName } = formData;
    
    if (!email || !password || !confirmPassword || !displayName) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (displayName.trim().length < 2) {
      Alert.alert('Error', 'Please enter a valid name (at least 2 characters)');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleEmailSignup = async () => {
    if (!validateForm()) return;

    try {
      await registerWithEmail(
        formData.email.trim(), 
        formData.password, 
        formData.displayName.trim()
      );
      // Navigation will be handled by auth state change
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle();
      // Navigation will be handled by auth state change
    } catch (error) {
      console.error('Google signup error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Creating your account...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Background decorative elements */}
        <View style={styles.backgroundDecoration}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="person-add" size={48} color="#8B5CF6" />
            </View>
            <Text style={styles.title}>Join Our Team</Text>
            <Text style={styles.subtitle}>Create your driver account and start earning</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="person" size={20} color="#8B5CF6" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.displayName}
                  onChangeText={(value) => handleInputChange('displayName', value)}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="mail" size={20} color="#8B5CF6" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed" size={20} color="#8B5CF6" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password (min. 6 characters)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye' : 'eye-off'} 
                    size={20} 
                    color="#8B5CF6" 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed" size={20} color="#8B5CF6" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye' : 'eye-off'} 
                    size={20} 
                    color="#8B5CF6" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                onPress={handleEmailSignup}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={styles.signupButtonContent}>
                  {loading && <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonLoader} />}
                  <Text style={styles.signupButtonText}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </View>
              </TouchableOpacity>

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" style={styles.errorIcon} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/auth/login')}
                activeOpacity={0.7}
              >
                <Text style={styles.loginButtonText}>Already have an account?</Text>
                <Ionicons name="arrow-forward" size={18} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By creating an account, you agree to our Terms of Service & Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#8B5CF6',
    opacity: 0.05,
    top: -100,
    right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#8B5CF6',
    opacity: 0.08,
    bottom: -75,
    left: -75,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8B5CF6',
    opacity: 0.06,
    top: '40%',
    right: -50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
    paddingVertical: 12,
    paddingRight: 4,
  },
  eyeIcon: {
    width: 36,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorIcon: {
    marginRight: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  loginButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: -0.2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default DriverSignup;