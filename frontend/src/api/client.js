import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial: sends HTTP-only cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// Response Interceptor: Token Rotation on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return client(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint. Cookies (refresh_token) are automatically attached by the browser.
        await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        processQueue(null);
        isRefreshing = false;

        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        
        // Trigger global logout event to clear Zustand store state
        window.dispatchEvent(new Event("auth_logout"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
