import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials:true
});

// 🔥 REQUEST INTERCEPTOR (attach token automatically)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🔥 RESPONSE INTERCEPTOR (GLOBAL LOGOUT)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ❌ Token invalid / expired

      localStorage.removeItem("token");

      // Redirect to login
      window.location.href = "/buyer_login";
    }

    return Promise.reject(error);
  }
);

export default api;