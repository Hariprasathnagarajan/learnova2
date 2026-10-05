import axios from 'axios';

import { env } from '../../config/env';
import { getAccessToken, getRefreshToken, saveTokens, clearAuth } from '../../utils/storageUtils';

// eslint-disable-next-line import/no-named-as-default-member
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (env.enableApiLogging) {
    // Method, URL and status only - never headers, bodies or tokens.
    console.log('[api]', config.method?.toUpperCase(), config.url);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (env.enableApiLogging) {
      console.log('[api]', response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (env.enableApiLogging) {
      console.warn('[api]', error.response?.status ?? 'network-error', originalRequest?.url);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = await getRefreshToken();
        if (!refresh) throw new Error('No refresh token');

        const { data } = await axios.post(`${env.apiUrl}/auth/token/refresh/`, { refresh });
        await saveTokens(data.access, data.refresh ?? refresh);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(originalRequest);
      } catch {
        await clearAuth();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}