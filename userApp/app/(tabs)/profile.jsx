import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, Alert, ActivityIndicator, DeviceEventEmitter, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile } from '../../api/customerApi';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../../constants/Colors';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('profileUpdated', () => {
      fetchProfile();
    });
    return () => sub.remove();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      Alert.alert('Error', 'Failed to fetch profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Read-only profile view; editing is handled in the separate edit screen.

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>No profile available.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.avatarWrap}>
        {profile.photoUrl ? (
          <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ color: '#fff' }}>{(profile.name || 'U').charAt(0)}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.label, { color: colors.foreground }]}>Name</Text>
      <Text style={[styles.readonly, { color: colors.foreground }]}>{profile.name || ''}</Text>

      <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
      <Text style={[styles.readonly, { color: colors.foreground }]}>{profile.email || ''}</Text>

      <Text style={[styles.label, { color: colors.foreground }]}>Contact Number</Text>
      <Text style={[styles.readonly, { color: colors.foreground }]}>{profile.contactNumber || ''}</Text>

      <Text style={[styles.label, { color: colors.foreground }]}>Address</Text>
      <Text style={[styles.readonly, { color: colors.foreground }]}>{[profile.address?.street, profile.address?.city, profile.address?.state, profile.address?.pincode].filter(Boolean).join(', ')}</Text>

  <View style={{ height: 24 }} />
  
  <TouchableOpacity
    style={styles.profileButton}
    onPress={() => router.push('/edit-profile')}
  >
    <Ionicons name="create-outline" size={20} color="#fff" style={styles.buttonIcon} />
    <Text style={styles.buttonText}>Edit Profile</Text>
  </TouchableOpacity>
  
  <View style={{ height: 16 }} />
  
  <TouchableOpacity
    style={[styles.profileButton, { backgroundColor: '#6C63FF' }]}
    onPress={() => router.push('/subscriptions')}
  >
    <Ionicons name="cart-outline" size={20} color="#fff" style={styles.buttonIcon} />
    <Text style={styles.buttonText}>My Subscriptions</Text>
  </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { alignSelf: 'center', marginBottom: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { backgroundColor: '#999', alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 8, marginBottom: 4, fontWeight: '600' },
  readonly: { marginBottom: 12, fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 8 },
  locationRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  profileButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  buttonIcon: {
    marginRight: 8
  }
});
