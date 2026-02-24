// src/utils/axiosInstance.js
import axios from "axios";

// 🔧 AXIOS INSTANCE CONFIGURATION for localhost development
// Backend URL matches server PORT (http://localhost:5000)
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Add token automatically to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
