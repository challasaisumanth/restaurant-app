import axios from 'axios';

const baseURL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://restaurant-app-backend-ui3j.onrender.com/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isMenuRoute = window.location.pathname.startsWith('/menu');
      if (!isMenuRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;