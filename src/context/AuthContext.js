import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setUser as setReduxUser, clearUser as clearReduxUser } from '../redux/userSlice';
import { auth } from '../config/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  
  // Get the auth instance
  const authInstance = auth;

  const login = useCallback((userData, idToken) => {
    setToken(idToken);
    setUser(userData);
    localStorage.setItem('token', idToken);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
    dispatch(setReduxUser(userData)); // Sync Redux
  }, [dispatch]);

  const logout = useCallback(() => {
    auth.signOut().then(() => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      dispatch(clearReduxUser()); // Clear Redux
    });
  }, [dispatch]);

  useEffect(() => {
    const handleAuthStateChange = async (user) => {
      if (user) {
        try {
          // Force refresh the token to get the latest claims
          const idToken = await user.getIdToken(true);
          
          // Update token in state and local storage
          setToken(idToken);
          localStorage.setItem('token', idToken);
          
          // Set default auth header for API requests
          api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
          
          try {
            // Try to get the user profile
            const response = await api.get('/profile/me');
            const fullUserProfile = response.data;
            
            // Update user in state, local storage, and Redux
            setUser(fullUserProfile);
            localStorage.setItem('user', JSON.stringify(fullUserProfile));
            dispatch(setReduxUser(fullUserProfile));
          } catch (profileError) {
            console.error("Profile fetch error:", profileError);
            // If profile fetch fails but we have a user, use minimal user data
            const minimalUser = {
              uid: user.uid,
              email: user.email,
              name: user.displayName || '',
              emailVerified: user.emailVerified,
              // Add any other minimal required fields
            };
            setUser(minimalUser);
            localStorage.setItem('user', JSON.stringify(minimalUser));
            dispatch(setReduxUser(minimalUser));
          }
        } catch (error) {
          console.error("Authentication Error:", error);
          // Don't log out here, just set loading to false
          // This prevents infinite loops when the server is down
          setUser(null);
          setToken(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      } else {
        // No user is signed in
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        dispatch(clearReduxUser());
      }
      setLoading(false);
    };

    // Set up the auth state observer
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

    // Clean up the subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [logout, dispatch]); // Include logout and dispatch in the dependency array

  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 Unauthorized (token expired or invalid)
        if (error.response?.status === 401 && !originalRequest._retry && auth.currentUser) {
          originalRequest._retry = true;
          try {
            console.log('Token expired, attempting to refresh...');
            const newToken = await auth.currentUser.getIdToken(true);
            
            // Update token in state and storage
            setToken(newToken);
            localStorage.setItem('token', newToken);
            
            // Update the Authorization header
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Retry the original request with the new token
            return api(originalRequest);
          } catch (refreshError) {
            console.error('Error refreshing token:', refreshError);
            // If refresh fails, log the user out
            logout();
            return Promise.reject(refreshError);
          }
        }
        
        // Handle 403 Forbidden (user exists but doesn't have permission)
        if (error.response?.status === 403) {
          console.error('Access forbidden:', error.response?.data?.message || 'Insufficient permissions');
          // You could redirect to an access denied page here if needed
        }
        
        // For any other error, just reject it
        return Promise.reject(error);
      }
    );

    // Clean up the interceptor when the component unmounts
    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

  const googleSignIn = useCallback(async (role) => {
    console.log('Attempting Google Sign-In with role:', role);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Google Sign-In popup successful:', result.user.displayName);

      const idToken = await result.user.getIdToken();
      console.log('ID Token retrieved, sending to backend...');

      const response = await api.post('/auth/google-signin', { idToken, role });
      console.log('Backend response successful:', response.data);

      // Use the Firebase ID token for subsequent authenticated requests
      login(response.data.user, idToken);
      return response.data.user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Backend Error Data:', error.response.data);
        console.error('Backend Error Status:', error.response.status);
        console.error('Backend Error Headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from backend:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      setError('Failed to sign up with Google. Please try again.');
      throw error;
    }
  }, [login]);

  // Function to verify authentication status and refresh token if needed
  const verifyAuth = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { isAuthenticated: false, user: null };
    }

    try {
      // Force refresh the token to get the latest claims
      const idToken = await currentUser.getIdToken(true);
      
      // Update token in state and storage
      setToken(idToken);
      localStorage.setItem('token', idToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
      
      try {
        // Try to get the user profile
        const response = await api.get('/profile/me');
        const fullUserProfile = response.data;
        
        // Update user in state and local storage
        setUser(fullUserProfile);
        localStorage.setItem('user', JSON.stringify(fullUserProfile));
        
        return { isAuthenticated: true, user: fullUserProfile };
      } catch (profileError) {
        console.error('Profile fetch error during verification:', profileError);
        // Return minimal user data if profile fetch fails
        const minimalUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || '',
          emailVerified: currentUser.emailVerified,
        };
        setUser(minimalUser);
        localStorage.setItem('user', JSON.stringify(minimalUser));
        return { isAuthenticated: true, user: minimalUser };
      }
    } catch (error) {
      console.error('Error verifying authentication:', error);
      // If verification fails, log the user out
      await logout();
      return { isAuthenticated: false, user: null, error };
    }
  }, [logout]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    error,
    login,
    logout,
    verifyAuth, // Add verifyAuth to the context value
    isAuthenticated: !!user,
    isSeller: user?.role === 'seller',
    isAdmin: user?.role === 'admin',
    googleSignIn,
    auth: authInstance, // Make auth instance available
    setError, // Expose setError to consumers
  }), [user, token, loading, error, login, logout, verifyAuth, googleSignIn, authInstance]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 