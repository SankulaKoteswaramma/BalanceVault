import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect on login check failure
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('bv_token');
        localStorage.removeItem('bv_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
