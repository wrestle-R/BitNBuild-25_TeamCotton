import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  StyleSheet,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { getColors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { registerUser } from '../api/authApi';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SignUp = ({ navigation }) => {
  const router = useRouter();
  const nav = useNavigation();
  const systemColorScheme = useColorScheme();
  const isDarkMode = systemColorScheme === 'dark';
  const colors = getColors(isDarkMode);

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

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      if (navigation && navigation.setOptions) {
        navigation.setOptions({ headerShown: false });
      }
      if (nav && nav.setOptions) {
        nav.setOptions({ headerShown: false });
      }
    } catch (e) {
      // ignore
    }
  }, [navigation, nav]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'Name is required';
    if (!form.email) e.email = 'Email required';
    if (!form.password) e.password = 'Password required';
    if (form.password !== form.confirm) e.confirm = 'Passwords must match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      console.log('📝 Registering new user...');
      
      // Register user with backend API
      const { user } = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      console.log('✅ Registration successful:', user);
      
      Alert.alert(
        'Registration Successful!',
        `Welcome to NourishNet, ${user.name}! You can now sign in with your credentials.`,
        [
          {
            text: 'Sign In Now',
            onPress: () => router.push('/')
          }
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
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
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View style={{ width: 80, height: 80, backgroundColor: colors.primary, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="home" size={32} color={colors.primaryForeground} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground, marginBottom: 8 }}>
              Create Account
            </Text>
            <Text style={{ fontSize: 16, color: colors.mutedForeground, textAlign: 'center' }}>
              Fill in your details to get started
            </Text>
          </View>

          {/* Sign Up Form */}
          <View style={{ gap: 24 }}>
            {/* Full Name Input */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
                Full Name
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    width: '100%',
                    padding: 16,
                    paddingLeft: 48,
                    backgroundColor: colors.input,
                    borderColor: errors.name ? colors.destructive : colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                  placeholder="Your full name"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.name}
                  onChangeText={(v) => handleChange('name', v)}
                  autoCapitalize="words"
                />
                <Feather
                  name="user"
                  size={20}
                  color={colors.mutedForeground}
                  style={{ position: 'absolute', left: 16, top: 16 }}
                />
              </View>
              {errors.name && (
                <Text style={{ color: colors.destructive, fontSize: 14, marginTop: 4 }}>{errors.name}</Text>
              )}
            </View>

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
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.email}
                  onChangeText={(v) => handleChange('email', v)}
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
                  placeholder="Create a password"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.password}
                  onChangeText={(v) => handleChange('password', v)}
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

            {/* Confirm Password Input */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
                Confirm Password
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    width: '100%',
                    padding: 16,
                    paddingLeft: 48,
                    paddingRight: 48,
                    backgroundColor: colors.input,
                    borderColor: errors.confirm ? colors.destructive : colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.confirm}
                  onChangeText={(v) => handleChange('confirm', v)}
                  secureTextEntry
                />
                <Feather
                  name="lock"
                  size={20}
                  color={colors.mutedForeground}
                  style={{ position: 'absolute', left: 16, top: 16 }}
                />
              </View>
              {errors.confirm && (
                <Text style={{ color: colors.destructive, fontSize: 14, marginTop: 4 }}>{errors.confirm}</Text>
              )}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              style={{
                width: '100%',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: loading ? colors.muted : colors.primary,
              }}
            >
              <Text style={{ color: colors.primaryForeground, fontSize: 18, fontWeight: '600' }}>
                {loading ? 'Creating...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            {/* Social Login Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ marginHorizontal: 16, color: colors.mutedForeground }}>or continue with</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            {/* Google Button only */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12 }}>
                <FontAwesome name="google" size={18} color={colors.foreground} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.foreground, fontWeight: '500' }}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
            <Text style={{ color: colors.mutedForeground }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/') }>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignUp;
