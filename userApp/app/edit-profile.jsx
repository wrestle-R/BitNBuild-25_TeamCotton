import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { getProfile, updateProfile, uploadProfileImage } from '../api/customerApi';
import { DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';

let Location = null;
let ImagePicker = null;
try {
  Location = require('expo-location');
  ImagePicker = require('expo-image-picker');
} catch (e) {
  // optional
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      Alert.alert('Error', 'Failed to fetch profile.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (!ImagePicker) {
      Alert.alert('Image Picker not installed', 'Install expo-image-picker to pick images.');
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Permission to access media library is required to pick a profile image.');
        return;
      }

      const mediaTypes = ImagePicker.MediaType || ImagePicker.MediaTypeOptions || ImagePicker.MediaTypeOptions;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: mediaTypes.Images || mediaTypes.Image || ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!result.cancelled) {
        let fileUri = result.uri;
        if (Platform.OS === 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
          fileUri = 'file://' + fileUri;
        }
        try {
          const uploadRes = await uploadProfileImage(fileUri);
          console.log('Upload result:', uploadRes);
          if (uploadRes && uploadRes.url) {
            setProfile((p) => ({ ...p, photoUrl: uploadRes.url }));
          }
        } catch (uploadErr) {
          console.error('Upload error:', uploadErr);
          Alert.alert('Upload Error', uploadErr.message || JSON.stringify(uploadErr));
        }
      }
    } catch (error) {
      console.error('Image pick/upload error', error);
      Alert.alert('Image Error', 'Failed to pick or upload image.');
    }
  };

  const useLocation = async () => {
    if (!Location) {
      Alert.alert('Location not installed', 'Install expo-location to use current location.');
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to use current location.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const geo = await res.json();
      const address = geo.address || {};
      const newAddress = {
        street: [address.road, address.house_number].filter(Boolean).join(' '),
        city: address.city || address.town || address.village || '',
        state: address.state || '',
        pincode: address.postcode || '',
        coordinates: { lat: latitude, lng: longitude }
      };
      setProfile((p) => ({ ...p, address: newAddress }));
    } catch (error) {
      console.error('Location error', error);
      Alert.alert('Location Error', 'Failed to get current location.');
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const payload = {
        name: profile.name,
        contactNumber: profile.contactNumber,
        address: profile.address,
        photoUrl: profile.photoUrl,
        preference: profile.preference,
      };
      const updated = await updateProfile(payload);
      setProfile(updated);
  Alert.alert('Success', 'Profile updated successfully');
  // notify profile view to refresh
  try { DeviceEventEmitter.emit('profileUpdated'); } catch (e) { /* ignore */ }
  router.back();
    } catch (error) {
      console.error('Update profile error', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (<View style={styles.center}><ActivityIndicator /></View>);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
        {profile?.photoUrl ? (
          <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ color: '#fff' }}>{(profile?.name || 'U').charAt(0)}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={profile?.name || ''} onChangeText={(t) => setProfile((p) => ({ ...p, name: t }))} />

      <Text style={styles.label}>Contact Number</Text>
      <TextInput style={styles.input} value={profile?.contactNumber || ''} onChangeText={(t) => setProfile((p) => ({ ...p, contactNumber: t }))} />

      <View style={styles.locationRow}>
        <Button title="Use Current Location" onPress={useLocation} />
        <Button title="Enter Manually" onPress={() => {}} />
      </View>

      <Text style={styles.label}>Street</Text>
      <TextInput style={styles.input} value={profile?.address?.street || ''} onChangeText={(t) => setProfile((p) => ({ ...p, address: { ...p.address, street: t } }))} />

      <Text style={styles.label}>City</Text>
      <TextInput style={styles.input} value={profile?.address?.city || ''} onChangeText={(t) => setProfile((p) => ({ ...p, address: { ...p.address, city: t } }))} />

      <Text style={styles.label}>State</Text>
      <TextInput style={styles.input} value={profile?.address?.state || ''} onChangeText={(t) => setProfile((p) => ({ ...p, address: { ...p.address, state: t } }))} />

      <Text style={styles.label}>Pincode</Text>
      <TextInput style={styles.input} value={profile?.address?.pincode || ''} onChangeText={(t) => setProfile((p) => ({ ...p, address: { ...p.address, pincode: t } }))} />

      <View style={{ height: 12 }} />
      {saving ? (<ActivityIndicator />) : (<Button title="Save Profile" onPress={handleSave} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { alignSelf: 'center', marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { backgroundColor: '#999', alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 8, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 8 },
  locationRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 }
});
