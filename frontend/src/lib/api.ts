import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token from store
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('yashil-quest-auth');
      if (stored) {
        const { state } = JSON.parse(stored);
        if (state?.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      }
    } catch {}
  }
  return config;
});

// Handle 401 - try refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const stored = localStorage.getItem('yashil-quest-auth');
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.refreshToken) {
            const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
              refreshToken: state.refreshToken,
            });
            // Update both in-memory store and localStorage
            useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
            if (data.user) {
              useAuthStore.getState().setUser(data.user);
            }
            error.config.headers.Authorization = `Bearer ${data.accessToken}`;
            return axios.request(error.config);
          }
        }
      } catch {}
    }
    return Promise.reject(error);
  },
);

export default api;
