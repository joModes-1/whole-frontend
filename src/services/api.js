import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 1 minute
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on auth pages
      const authPages = ['/login', '/register', '/verify-phone', '/role-selection'];
      const currentPath = window.location.pathname;
      
      if (!authPages.includes(currentPath)) {
        console.log('401 error - clearing token and redirecting to login');
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const googleSignIn = (idToken, role) => {
  console.log('Sending token to backend:', idToken);
  console.log('Sending role to backend:', role);
  return api.post('/auth/google-signin', { role }, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
};

export const logout = () => {
  return api.post('/auth/logout');
};

export default api;
