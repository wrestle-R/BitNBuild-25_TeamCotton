import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../firebase.config';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Initialize WebBrowser for mobile auth redirect
WebBrowser.maybeCompleteAuthSession();

const GoogleSignInButton = ({ colors, onSuccess, onError }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      // For mobile, we should use the AuthSession approach
      // But for simplicity, this is a placeholder
      // In a real app, you'd implement this with expo-auth-session Google provider
      
      // Simulate successful login for demo
      setTimeout(() => {
        setIsLoading(false);
        onSuccess && onSuccess({
          user: {
            name: "Google User",
            email: "googleuser@example.com"
          }
        });
        
        // Navigate after successful login
        router.replace('/(tabs)/explore');
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      console.error('Google sign in error:', error);
      onError && onError(error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { borderColor: colors.border }
      ]}
      onPress={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.foreground} size="small" />
      ) : (
        <>
          <FontAwesome name="google" size={18} color={colors.foreground} style={styles.icon} />
          <Text style={[styles.text, { color: colors.foreground }]}>Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12
  },
  icon: {
    marginRight: 8
  },
  text: {
    fontWeight: '500'
  }
});

export default GoogleSignInButton;
