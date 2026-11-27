import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Kept purely in memory to prevent XSS access via localStorage
let inMemoryAccessToken = null;
let onSessionExpiredHandler = null;

export function setAccessToken(token) {
  inMemoryAccessToken = token || null;
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

export function setOnSessionExpired(handler) {
  onSessionExpiredHandler = handler;
}

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends HttpOnly refreshToken cookie automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer access token to every outgoing request
axiosClient.interceptors.request.use((config) => {
  if (inMemoryAccessToken) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }
  return config;
});

// Prevent multiple simultaneous refresh calls if parallel API requests return 401
let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, newToken = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newToken);
  });
  pendingQueue = [];
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axiosClient.post('/auth/refresh');
        const newToken = res.data?.data?.accessToken;
        setAccessToken(newToken);
        flushQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        flushQueue(refreshError, null);
        if (onSessionExpiredHandler) {
          onSessionExpiredHandler();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
