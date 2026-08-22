import axios from 'axios';

// Use local URL in development, production URL otherwise
const isDev = import.meta.env.DEV;
const render_url = isDev 
  ? 'http://127.0.0.1:8000' 
  : (import.meta.env.VITE_API_URL || 'https://marketflip.onrender.com');

console.log(`API Base URL: ${render_url}`);

const api = axios.create({
  baseURL: render_url,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setDeliveryMethod = (requestId, data) => {
  return api.patch(`/requests/${requestId}/delivery`, data);
};

export const switchToPickup = (requestId) => {
  return api.patch(`/requests/${requestId}/switch-to-pickup`);
};

export const confirmDelivery = (requestId) => {
  return api.patch(`/requests/${requestId}/delivery/confirm`);
};

export const denyDelivery = (requestId) => {
  return api.patch(`/requests/${requestId}/delivery/deny`);
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
    }
    return Promise.reject(error);
  }
);

export default api;