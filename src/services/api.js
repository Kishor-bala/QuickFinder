import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to gracefully handle auth errors & retry transient proxy/502/503 network hiccups
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (error.response && error.response.status === 401) {
      // If token expired and not on login/register, clear and allow app to redirect
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
        localStorage.removeItem('qf_token');
        localStorage.removeItem('qf_user');
      }
      return Promise.reject(error);
    }

    // Auto-retry transient server startup or ECONNRESET proxy errors (up to 2 attempts)
    const isTransientError =
      !error.response ||
      error.response.status === 502 ||
      error.response.status === 503 ||
      error.response.status === 504;

    if (isTransientError && config && !config._retryCount) {
      config._retryCount = (config._retryCount || 0) + 1;
      if (config._retryCount <= 2) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
