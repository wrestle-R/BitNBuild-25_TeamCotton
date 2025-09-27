import { VITE_BACKEND_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = VITE_BACKEND_URL || 'http://192.168.1.40:5000';

export const getAuthHeaders = async () => {
  // The backend middleware expects a Firebase ID token verified by firebase-admin
  const idToken = await AsyncStorage.getItem('idToken');
  const headers = {
    'Content-Type': 'application/json',
  };

  // Only add Authorization header when we actually have a token
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  return headers;
};

export const getVendors = async () => {
  // Try fetching with auth headers if available. If the request fails with 401,
  // retry without the Authorization header so that public endpoints still work.
  const tryUrl = `${API_URL}/api/customer/vendors`;
  const headers = await getAuthHeaders();

  const fetchWithAuthFallback = async (url, init) => {
    // First attempt with provided headers
    let res;
    try {
      res = await fetch(url, init);
    } catch (err) {
      console.error('Network error while fetching:', err);
      throw err;
    }

    // If unauthorized and we had Authorization header, retry without it
    if (res.status === 401 && init && init.headers && init.headers.Authorization) {
      try {
        const initNoAuth = { ...init };
        const headersCopy = { ...init.headers };
        delete headersCopy.Authorization;
        initNoAuth.headers = headersCopy;
        const retryRes = await fetch(url, initNoAuth);
        return retryRes;
      } catch (retryErr) {
        console.error('Retry without auth failed:', retryErr);
        throw retryErr;
      }
    }

    return res;
  };

  try {
    const res = await fetchWithAuthFallback(tryUrl, { method: 'GET', headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to fetch vendors (status ${res.status})`);
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
};

export const getVendorById = async (vendorId) => {
  const tryUrl = `${API_URL}/api/customer/vendors/${vendorId}`;
  const headers = await getAuthHeaders();

  const fetchWithAuthFallback = async (url, init) => {
    let res;
    try {
      res = await fetch(url, init);
    } catch (err) {
      console.error('Network error while fetching:', err);
      throw err;
    }
    if (res.status === 401 && init && init.headers && init.headers.Authorization) {
      try {
        const initNoAuth = { ...init };
        const headersCopy = { ...init.headers };
        delete headersCopy.Authorization;
        initNoAuth.headers = headersCopy;
        const retryRes = await fetch(url, initNoAuth);
        return retryRes;
      } catch (retryErr) {
        console.error('Retry without auth failed:', retryErr);
        throw retryErr;
      }
    }
    return res;
  };

  try {
    const res = await fetchWithAuthFallback(tryUrl, { method: 'GET', headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to fetch vendor ${vendorId} (status ${res.status})`);
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching vendor by id:', error);
    throw error;
  }
};

export const getVendorPlans = async (vendorId) => {
  const tryUrl = `${API_URL}/api/customer/vendors/${vendorId}/plans`;
  const headers = await getAuthHeaders();

  const fetchWithAuthFallback = async (url, init) => {
    let res;
    try {
      res = await fetch(url, init);
    } catch (err) {
      console.error('Network error while fetching plans:', err);
      throw err;
    }
    if (res.status === 401 && init && init.headers && init.headers.Authorization) {
      try {
        const initNoAuth = { ...init };
        const headersCopy = { ...init.headers };
        delete headersCopy.Authorization;
        initNoAuth.headers = headersCopy;
        const retryRes = await fetch(url, initNoAuth);
        return retryRes;
      } catch (retryErr) {
        console.error('Retry without auth failed:', retryErr);
        throw retryErr;
      }
    }
    return res;
  };

  try {
    const res = await fetchWithAuthFallback(tryUrl, { method: 'GET', headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to fetch plans for vendor ${vendorId} (status ${res.status})`);
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching vendor plans:', error);
    throw error;
  }
};

export const getProfile = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/customer/profile`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to fetch profile');
  }
  return res.json();
};

export const updateProfile = async (profile) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/customer/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to update profile');
  }
  return res.json();
};

export const uploadProfileImage = async (uri, filename = 'profile.jpg') => {
  const idToken = await AsyncStorage.getItem('idToken');
  try {
    const formData = new FormData();

    // Normalize URI for Android
    let fileUri = uri;
    if (Platform && Platform.OS === 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
      fileUri = 'file://' + fileUri;
    }

    console.log('Uploading image, fileUri:', fileUri);

    // Fetch the file and convert to blob - more reliable across Android content:// URIs
    const fileResp = await fetch(fileUri);
    const blob = await fileResp.blob();

    // Append blob with filename
    formData.append('image', blob, filename);

    // IMPORTANT: do NOT set Content-Type header for multipart/form-data in React Native
    // Let fetch set the proper boundary header automatically.
    const res = await fetch(`${API_URL}/api/customer/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: idToken ? `Bearer ${idToken}` : undefined,
        Accept: 'application/json',
      },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Upload failed server response:', json);
      throw new Error(JSON.stringify(json));
    }

    if (json.success && json.data && json.data.url) {
      return { url: json.data.url, publicId: json.data.publicId };
    }

    if (json.url) return { url: json.url };

    throw new Error('Failed to upload image: Empty response');
  } catch (err) {
    console.error('UploadProfileImage error:', err);
    throw err;
  }

  const json = await res.json();
  if (!res.ok || !json) {
    const text = JSON.stringify(json) || 'Failed to upload image';
    throw new Error(text);
  }

  // Backend returns { success: true, data: { url: ... } }
  if (json.success && json.data && json.data.url) {
    return { url: json.data.url, publicId: json.data.publicId };
  }

  // Fallback: if backend returned direct shape
  if (json.url) return { url: json.url };

  throw new Error('Failed to upload image: Empty response');
};
