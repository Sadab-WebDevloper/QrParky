import axios from 'axios';

const API = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qr_parky_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Refresh Token on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('qr_parky_refresh_token');
        if (refreshToken) {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          if (res.data?.success) {
            const newToken = res.data.data.token;
            localStorage.setItem('qr_parky_token', newToken);
            localStorage.setItem('qr_parky_refresh_token', res.data.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
        }
      } catch (refreshErr) {
        localStorage.removeItem('qr_parky_token');
        localStorage.removeItem('qr_parky_refresh_token');
        localStorage.removeItem('qr_parky_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
