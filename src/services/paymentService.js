import axios from 'axios';
import { getToken } from './authService';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
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
    const response = await api.post('/orders/create-stripe-session', {
      orderId,
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
    const response = await api.post('/orders/create-paypal-order', {
      orderId,
      amount,
    });
    return response.data;
  } catch (error) {
    console.error('Create PayPal order error:', error);
    throw error.response?.data || { message: 'Error creating PayPal order' };
  }
};

// Capture PayPal payment
export const capturePayPalPayment = async (orderId) => {
  try {
    const response = await api.post('/orders/capture-paypal-payment', {
      orderId,
    });
    return response.data;
  } catch (error) {
    console.error('Capture PayPal payment error:', error);
    throw error.response?.data || { message: 'Error capturing payment' };
  }
};

// Initialize Flutterwave payment
export const initiateFlutterwave = async (orderId, amount, email, name, phone) => {
  try {
    const response = await api.post('/orders/initiate-flutterwave', {
      orderId,
      amount,
      email,
      name,
      phone,
    });
    return response.data;
  } catch (error) {
    console.error('Initiate Flutterwave payment error:', error);
    throw error.response?.data || { message: 'Error initiating payment' };
  }
};

// Verify Flutterwave payment
export const verifyFlutterwave = async (transactionId) => {
  try {
    const response = await api.post('/orders/verify-flutterwave', {
      transaction_id: transactionId,
    });
    return response.data;
  } catch (error) {
    console.error('Verify Flutterwave payment error:', error);
    throw error.response?.data || { message: 'Error verifying payment' };
  }
}; 