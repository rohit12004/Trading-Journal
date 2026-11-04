import axios from "axios";

let API_URL = import.meta.env.VITE_API_URL || "/api/v1";

// Auto-correct: If backend URL is provided without /api/v1 (e.g. https://xyz.onrender.com),
// normalize it so requests always reach FastAPI's versioned endpoints.
if (API_URL.startsWith("http")) {
  API_URL = API_URL.replace(/\/+$/, "");
  if (!API_URL.endsWith("/api/v1")) {
    if (API_URL.endsWith("/api")) {
      API_URL += "/v1";
    } else {
      API_URL += "/api/v1";
    }
  }
}

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Sends cookies automatically when allowed by browser
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Bearer token from localStorage as fallback when cross-origin cookies are blocked
client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
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
            // Update Authorization header with newly refreshed access token
            const newToken = localStorage.getItem("access_token");
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return client(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
        // Call refresh endpoint with stored refresh_token in body (and withCredentials for cookies)
        const refreshRes = await axios.post(
          `${API_URL}/auth/refresh`,
          storedRefreshToken ? { refresh_token: storedRefreshToken } : {},
          { withCredentials: true }
        );

        if (refreshRes.data?.access_token) {
          localStorage.setItem("access_token", refreshRes.data.access_token);
          originalRequest.headers.Authorization = `Bearer ${refreshRes.data.access_token}`;
        }
        if (refreshRes.data?.refresh_token) {
          localStorage.setItem("refresh_token", refreshRes.data.refresh_token);
        }

        processQueue(null);
        isRefreshing = false;

        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        // Trigger global logout event to clear Zustand store state
        window.dispatchEvent(new Event("auth_logout"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
