import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const API_BASE_URL = API_URL;
export const SWAGGER_URL = `${API_URL}/api/docs`;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token from store
api.interceptors.request.use((config) => {
  // First try in-memory store (always up-to-date after refresh)
  const inMemoryToken = useAuthStore.getState().accessToken;
  if (inMemoryToken) {
    config.headers['Authorization'] = `Bearer ${inMemoryToken}`;
    return config;
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('yashil-quest-auth');
      if (stored) {
        const { state } = JSON.parse(stored);
        if (state?.accessToken) {
          config.headers['Authorization'] = `Bearer ${state.accessToken}`;
        }
      }
    } catch {}
  }
  return config;
});

// Handle 401 - try refresh, redirect to login on failure
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config?._retry) {
      error.config._retry = true;
      try {
        const refreshToken =
          useAuthStore.getState().refreshToken ||
          (() => {
            try {
              const stored = localStorage.getItem('yashil-quest-auth');
              if (stored) return JSON.parse(stored).state?.refreshToken;
            } catch {}
            return null;
          })();

        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
          if (data.user) useAuthStore.getState().setUser(data.user);
          error.config.headers['Authorization'] = `Bearer ${data.accessToken}`;
          return axios.request(error.config);
        }
      } catch {
        // Refresh failed — clear auth and redirect to login
        useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
