import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDriverContext } from '../context/DriverContext';

const TestAuth = () => {
  const { testConnection, registerWithEmail, loginWithEmail } = useDriverContext();
  const [testing, setTesting] = useState(false);

  const testBackendConnection = async () => {
    setTesting(true);
    try {
      console.log('🧪 Testing backend connection...');
      const result = await testConnection();
      console.log('🧪 Test result:', result);
      
      if (result.success) {
        Alert.alert('✅ Success', `Backend connected: ${result.message}`);
      } else {
        Alert.alert('❌ Failed', `Backend connection failed: ${result.message}`);
      }
    } catch (error) {
      console.error('🧪 Test error:', error);
      Alert.alert('❌ Error', `Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testRegistration = async () => {
    setTesting(true);
    try {
      console.log('🧪 Testing registration...');
      await registerWithEmail('test@driver.com', 'password123', 'Test Driver');
    } catch (error) {
      console.error('🧪 Registration test error:', error);
    } finally {
      setTesting(false);
    }
  };

  const testLogin = async () => {
    setTesting(true);
    try {
      console.log('🧪 Testing login...');
      await loginWithEmail('test@driver.com', 'password123');
    } catch (error) {
      console.error('🧪 Login test error:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Auth Testing</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testBackendConnection}
        disabled={testing}
      >
        <Text style={styles.buttonText}>Test Backend Connection</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testRegistration}
        disabled={testing}
      >
        <Text style={styles.buttonText}>Test Registration</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testLogin}
        disabled={testing}
      >
        <Text style={styles.buttonText}>Test Login</Text>
      </TouchableOpacity>
      
      {testing && <Text style={styles.loading}>Testing...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  loading: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default TestAuth;