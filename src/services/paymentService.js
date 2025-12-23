import axios from 'axios';
import { getToken } from './authService';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 1 minute
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create Stripe payment session
export const createStripeSession = async (orderId, amount, currency) => {
  try {
    const response = await api.post(`/orders/${orderId}/initiate-payment`, {
      paymentMethod: 'stripe',
      amount,
      currency,
    });
    return response.data;
  } catch (error) {
    console.error('Create Stripe session error:', error);
    throw error.response?.data || { message: 'Error creating payment session' };
  }
};

// Create PayPal order
export const createPayPalOrder = async (orderId, amount) => {
  try {
    const response = await api.post(`/orders/${orderId}/initiate-payment`, {
      paymentMethod: 'paypal',
      amount,
    });
    return response.data;
  } catch (error) {
    console.error('Create PayPal order error:', error);
    throw error.response?.data || { message: 'Error creating PayPal order' };
  }
};

// Capture PayPal payment
export const capturePayPalPayment = async (orderId, paymentId) => {
  try {
    const response = await api.post(`/orders/${orderId}/verify-payment`, {
      paymentMethod: 'paypal',
      transactionId: paymentId,
    });
    return response.data;
  } catch (error) {
    console.error('Capture PayPal payment error:', error);
    throw error.response?.data || { message: 'Error capturing payment' };
  }
};

// Initialize Flutterwave payment
export const initiatePesapal = async (orderId, amount, email, name, phone, paymentMethod = 'pesapal') => {
  try {
    // Normalize UI-selected MTN/Airtel to backend using Pesapal
    const method = (paymentMethod === 'mtn' || paymentMethod === 'airtel') ? paymentMethod : 'pesapal';
    const response = await api.post(`/orders/${orderId}/initiate-payment`, {
      paymentMethod: method,
      amount,
      email,
      name,
      phone,
    });
    return response.data; // { paymentLink, transactionRef }
  } catch (error) {
    console.error('Initiate Pesapal payment error:', error);
    throw error.response?.data || { message: 'Error initiating payment' };
  }
};

// Verify Pesapal payment
export const verifyPesapal = async (orderId, transactionId, originalMethod = 'pesapal') => {
  try {
    // For MTN/Airtel UI choices, backend expects 'mtn'/'airtel' or 'pesapal'
    const method = (originalMethod === 'mtn' || originalMethod === 'airtel') ? originalMethod : 'pesapal';
    const response = await api.post(`/orders/${orderId}/verify-payment`, {
      paymentMethod: method,
      transactionId, // orderTrackingId from Pesapal
    });
    return response.data;
  } catch (error) {
    console.error('Verify Pesapal payment error:', error);
    throw error.response?.data || { message: 'Error verifying payment' };
  }
};