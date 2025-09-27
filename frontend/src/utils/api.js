const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

import { auth } from '../../firebase.config';

export const apiCall = async (endpoint, options = {}) => {
  try {
    // Get fresh token from Firebase
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken(true); // Force refresh
    console.log('🔑 Using fresh token for API call:', token.substring(0, 20) + '...');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Customer API calls
export const customerApi = {
  getVerifiedVendors: () => apiCall('/api/customer/vendors'),
  getProfile: () => apiCall('/api/customer/profile'),
  updateProfile: (data) => apiCall('/api/customer/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getPreferences: () => apiCall('/api/customer/preferences'),
};

// Vendor API calls
export const vendorApi = {
  getProfile: () => apiCall('/api/vendor/profile'),
  getStats: () => apiCall('/api/vendor/stats'),
  updateProfile: (data) => apiCall('/api/vendor/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};