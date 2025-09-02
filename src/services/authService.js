import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

// Backend-first signup (creates Firebase user automatically)
export const signup = async (userData) => {
  try {
    console.log('Starting signup process with backend...');
    
    // Call backend signup endpoint directly
    const response = await axios.post(`${API_URL}/auth/signup`, {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      phoneNumber: userData.phoneNumber || '',
      companyName: userData.companyName || ''
    });

    console.log('Backend signup successful:', response.data);

    // Store token and user data
    const { token, user } = response.data;
    setToken(token);
    localStorage.setItem('user', JSON.stringify(user));

    return {
      user,
      token
    };

  } catch (error) {
    console.error('Signup error:', error);

    // Handle backend errors
    if (error.response) {
      const message = error.response.data.message || 'Registration failed';
      throw new Error(message);
    }

    throw new Error(error.message || 'Registration failed. Please try again.');
  }
};

export const login = async (email, password) => {
  try {
    console.log('Starting login process with backend...');
    
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Call backend login endpoint
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: email.trim(),
      password: password.trim()
    });

    console.log('Backend login successful:', response.data);

    // Store token and user data
    const { token, user } = response.data;
    setToken(token);
    localStorage.setItem('user', JSON.stringify(user));

    return {
      user,
      token
    };

  } catch (error) {
    console.error('Login error:', error);

    // Handle backend errors
    if (error.response) {
      const message = error.response.data.message || 'Login failed';
      throw new Error(message);
    }

    throw new Error(error.message || 'Login failed. Please try again.');
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    removeToken();
  } catch (error) {
    console.error('Logout error:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
    throw error;
  }
};

// Token Management
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};