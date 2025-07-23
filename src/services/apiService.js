import axios from 'axios';
import { getToken } from './authService';
import { auth } from '../config/firebase';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check for 401 error and ensure we haven't already retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark that we've attempted a retry

      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('Refreshing token...');
          const newToken = await currentUser.getIdToken(true);
          
          // Update localStorage
          localStorage.setItem('token', newToken);
          
          // The request interceptor will pick up the new token from localStorage on retry
          return api(originalRequest);
        } else {
          // If there's no current user, we can't refresh.
          throw new Error("No user to refresh token for.");
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, logout the user
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // For all other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default api; 