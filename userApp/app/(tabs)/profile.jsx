import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, Alert, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { getProfile } from '../../api/customerApi';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        {profile.photoUrl ? (
          <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ color: '#fff' }}>{(profile.name || 'U').charAt(0)}</Text>
          </View>
        )}
      </View>

      <Text style={styles.label}>Name</Text>
      <Text style={styles.readonly}>{profile.name || ''}</Text>

      <Text style={styles.label}>Email</Text>
      <Text style={styles.readonly}>{profile.email || ''}</Text>

      <Text style={styles.label}>Contact Number</Text>
      <Text style={styles.readonly}>{profile.contactNumber || ''}</Text>

      <Text style={styles.label}>Address</Text>
      <Text style={styles.readonly}>{[profile.address?.street, profile.address?.city, profile.address?.state, profile.address?.pincode].filter(Boolean).join(', ')}</Text>

  <View style={{ height: 12 }} />
  <Button title="Edit Profile" onPress={() => router.push('/edit-profile')} />
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
  avatarWrap: { alignSelf: 'center', marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { backgroundColor: '#999', alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 8, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 8 },
  locationRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 }
});
