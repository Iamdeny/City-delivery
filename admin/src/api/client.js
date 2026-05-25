import axios from 'axios';

// В dev Vite проксирует /api на бэкенд; в production (Docker) задайте VITE_API_URL при сборке
const baseURL = import.meta.env.VITE_API_URL || '';
if (baseURL) {
  axios.defaults.baseURL = baseURL;
}

// Пробрасываем JWT access token администратора, если он есть в localStorage
axios.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('cd_admin_access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default axios;
