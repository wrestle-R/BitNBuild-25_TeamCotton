import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDriverContext } from '../context/DriverContext';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  // Add error boundary and logging
  console.log('👤 Profile component rendering...');
  
  let driverContextData;
  try {
    driverContextData = useDriverContext();
    console.log('✅ Profile - Successfully got driver context:', {
      hasDriver: !!driverContextData.driver,
      loading: driverContextData.loading,
      contextReady: driverContextData.contextReady
    });
  } catch (error) {
    console.error('💥 Profile - Error getting driver context:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', fontSize: 16 }}>
          Error loading driver context: {error.message}
        </Text>
        <Text style={{ color: '#666', textAlign: 'center', marginTop: 10 }}>
          Please restart the app or contact support.
        </Text>
      </View>
    );
  }

  const { driver, loading, logout } = driverContextData;
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log('🚪 Direct logout initiated from profile');
      
      // Call logout to clear everything
      await logout();
      
      // Immediately navigate to login
      console.log('🧭 Navigating to login page from profile');
      router.replace('/auth/login');
      
    } catch (error) {
      console.error('💥 Logout error:', error);
      // Even if logout fails, navigate to login for security
      router.replace('/auth/login');
    }
  };

  const handleEditProfile = () => {
    console.log('Edit Profile clicked - feature coming soon');
  };

  const handleChangePassword = () => {
    console.log('Change Password clicked - feature coming soon');
  };

  const handleSupport = () => {
    console.log('Support clicked - feature coming soon');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!driver) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please log in to view your profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Driver Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account settings</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            {/* Profile Picture */}
            <View style={styles.profilePictureSection}>
              <View style={styles.profilePicture}>
                <Ionicons name="person" size={45} color="#8b5cf6" />
              </View>
              <TouchableOpacity style={styles.changePhotoButton}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={22} color="#8b5cf6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>
                    {driver.name || 'Not provided'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={22} color="#8b5cf6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{driver.email}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={22} color="#8b5cf6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>
                    {driver.contactNumber || 'Not provided'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="car-outline" size={22} color="#8b5cf6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Vehicle Type</Text>
                  <Text style={[styles.infoValue, styles.capitalize]}>
                    {driver.vehicleType || 'Not provided'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="car-sport-outline" size={22} color="#8b5cf6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Vehicle Number</Text>
                  <Text style={styles.infoValue}>
                    {driver.vehicleNumber || 'Not provided'}
                  </Text>
                </View>
              </View>

              {driver.address && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={22} color="#8b5cf6" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>
                      {driver.address}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleEditProfile}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="create-outline" size={24} color="#8b5cf6" />
                <Text style={styles.actionButtonText}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#8b5cf6" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleChangePassword}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="lock-closed-outline" size={24} color="#8b5cf6" />
                <Text style={styles.actionButtonText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#8b5cf6" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSupport}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="help-circle-outline" size={24} color="#8b5cf6" />
                <Text style={styles.actionButtonText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#8b5cf6" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLogout}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="log-out-outline" size={24} color="#dc2626" />
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>
              Driver App v1.0.0
            </Text>
            <Text style={styles.appInfoText}>
              Logged in as: {driver.email}
            </Text>
            <Text style={styles.appInfoText}>
              Driver ID: {driver.mongoid || driver.id || 'N/A'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f7ff', // Light purple-tinted background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f7ff',
  },
  loadingText: {
    fontSize: 16,
    color: '#8b5cf6', // Purple text
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.05)', // Subtle purple background
    borderRadius: 20,
    marginHorizontal: -4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6b46c1', // Deep purple
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8b5cf6', // Medium purple
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  profilePicture: {
    width: 110,
    height: 110,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  changePhotoButton: {
    backgroundColor: '#8b5cf6', // Purple button
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  changePhotoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileInfo: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.04)', // Very light purple
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#8b5cf6', // Purple labels
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4c1d95', // Dark purple text
    marginTop: 2,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  actionButtons: {
    gap: 14,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4c1d95', // Dark purple text
    marginLeft: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626', // Red for logout
    marginLeft: 12,
  },
  appInfo: {
    marginTop: 32,
    padding: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  appInfoText: {
    fontSize: 12,
    color: '#6b46c1', // Deep purple
    textAlign: 'center',
    marginVertical: 2,
    fontWeight: '500',
  },
});