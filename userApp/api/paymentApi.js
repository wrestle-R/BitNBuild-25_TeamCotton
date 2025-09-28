import { VITE_BACKEND_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthHeaders } from './customerApi';

const API_URL = VITE_BACKEND_URL || 'http://192.168.1.40:5000';

// Create Razorpay order
export const createOrder = async (data) => {
  const { plan_id, vendor_id } = data;
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${API_URL}/api/payment/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        plan_id,
        vendor_id
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create order');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Verify payment
export const verifyPayment = async (data) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    payment_id
  } = data;
  
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${API_URL}/api/payment/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_id
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Payment verification failed');
    }

    return response.json();
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// Get payment history
export const getPaymentHistory = async () => {
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${API_URL}/api/payment/history`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch payment history');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

// Cancel subscription
export const cancelSubscription = async (subscriptionId) => {
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${API_URL}/api/payment/subscriptions/${subscriptionId}/cancel`, {
      method: 'PUT',
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to cancel subscription');
    }

    return response.json();
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};