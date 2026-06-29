import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// Attach token to every request
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handler
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expired → force logout
    if (error.response?.status === 401) {
      const message = error.response?.data?.message || "";
      if (message === "Token expired" || message === "Invalid token") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;