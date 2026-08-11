import axios from 'axios';


const render_url =  import.meta.env.VITE_API_URL || 'https://marketflip.onrender.com';
// this for local -> http://127.0.0.1:8000

const api = axios.create({
  baseURL: render_url,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  (error) => {  // ← Add curly braces around the function body
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
    }
    return Promise.reject(error);
  }
);

export default api;