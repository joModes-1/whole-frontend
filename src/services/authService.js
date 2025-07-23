import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

// Firebase Authentication
export const signup = async (userData) => {
  try {
    console.log('Starting signup process...');
    // 1. Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const firebaseUser = userCredential.user;
    console.log('Firebase user created:', firebaseUser.uid);

    // 2. Get Firebase ID token
    const token = await firebaseUser.getIdToken();
    console.log('Firebase ID token obtained.');

    // 3. Complete registration on the backend to create the local DB user
    console.log('Completing registration on backend...');
    const backendResponse = await axios.post(
      `${API_URL}/auth/complete-registration`, 
      {
        uid: firebaseUser.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        companyName: userData.companyName || '',
        contactNumber: userData.contactNumber || '',
        address: userData.address || ''
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Backend registration complete:', backendResponse.data);

    // 4. Return the user profile from our backend and the Firebase token
    return {
      user: backendResponse.data.user,
      token: token,
    };
  } catch (error) {
    console.error('Signup error details:', {
      code: error.code,
      message: error.message,
      fullError: error
    });

    // Handle backend errors as well
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.data.message || 'An error occurred during registration.');
    }

    // Map Firebase error codes to user-friendly messages
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('An account with this email already exists.');
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.');
      case 'auth/operation-not-allowed':
        throw new Error('Email/password accounts are not enabled. Please contact support.');
      case 'auth/weak-password':
        throw new Error('Password is too weak. Please use a stronger password.');
      default:
        throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }
};

export const login = async (email, password) => {
  try {
    console.log('Starting login process...');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    console.log('Firebase auth instance:', auth);
    
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Trim whitespace
    email = email.trim();
    password = password.trim();

    // Check if Firebase auth is initialized
    if (!auth) {
      throw new Error('Firebase auth is not initialized');
    }

    console.log('Attempting Firebase signInWithEmailAndPassword...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login successful! User:', userCredential.user);
    
    console.log('Getting ID token...');
    const token = await userCredential.user.getIdToken();
    console.log('Token obtained successfully');

    // Get user's custom claims (roles)
    const idTokenResult = await userCredential.user.getIdTokenResult();
    const roles = idTokenResult.claims.roles || ['user'];
    const userRole = roles.includes('seller') ? 'seller' : 
                    roles.includes('admin') ? 'admin' : 'user';

    const userData = {
      token,
      user: {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || email.split('@')[0],
        role: userRole
      }
    };
    console.log('Returning user data:', userData);
    return userData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
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