import axios from 'axios';

// Create Axios client pointing to Express backend port
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Automatically inject JWT token into header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campushive_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle unauthorized responses (expired/deleted user token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized — logging out.');
      localStorage.removeItem('campushive_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
