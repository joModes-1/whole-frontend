import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
});

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
