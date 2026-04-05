import axios from 'axios';

const api = axios.create({
  baseURL: 'https://restaurant-app-backend-ui3j.onrender.com/api',
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
    // ✅ Only redirect to login for protected routes
    // Customer menu should never redirect to login
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