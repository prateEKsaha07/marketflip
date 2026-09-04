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

export const verifyOtp = (requestId, code) => {
  return api.post(`/requests/${requestId}/verify-otp`, { code });
};

export const getAuctionBids = () => {
  return api.get('/bids/auction-bids');
};

// ml apis

export const getPriceSuggestion = (requestData) => {
  return api.post('/ml/price-suggestion', requestData);
};

export const rankBids = (data) => {
  return api.post('/ml/rank-bids', data);
};

export const getRecommendations = (requestId) => {
  return api.get(`/ml/recommendations?request_id=${requestId}`);
};

export const getDemandForecast = (params) => {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append('category', params.category);
  if (params.pincode) queryParams.append('pincode', params.pincode);
  if (params.days) queryParams.append('days', params.days);
  return api.get(`/ml/demand-forecast?${queryParams.toString()}`);
};

export const detectFraud = (bidData) => {
  return api.post('/ml/detect-fraud', bidData);
};

export const getShopReliability = (shopId) => {
  return api.get(`/reliability/shop/${shopId}`);
};

export const getShopsReliability = (shopIds) => {
  return api.get(`/reliability/shops?shop_ids=${shopIds.join(',')}`);
};

export const getTopReliableShops = (limit = 10) => {
  return api.get(`/reliability/top?limit=${limit}`);
};

export const createReview = (data) => {
  return api.post('/reviews/', data);
};

export const getProfileReviews = (profileId, params = {}) => {
  return api.get(`/reviews/profile/${profileId}`, { params });
};

export const getMyReviews = (params = {}) => {
  return api.get('/reviews/my-reviews', { params });
};

export const getTargetReviews = (targetType, targetId) => {
  return api.get(`/reviews/target/${targetType}/${targetId}`);
};

export const checkUserReviewed = (targetType, targetId) => {
  return api.get(`/reviews/check/${targetType}/${targetId}`);
};

export const getReviewStats = (profileId) => {
  return api.get(`/reviews/stats/${profileId}`);
};

export const deleteReview = (reviewId) => {
  return api.delete(`/reviews/${reviewId}`);
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