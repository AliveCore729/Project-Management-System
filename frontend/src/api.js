// frontend/src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  withCredentials: true, // VERY IMPORTANT for Google login + cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to every request if available in localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout when session expired (401)
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      console.warn("⛔ Session expired. Redirecting to login...");
      localStorage.removeItem("authToken");
      localStorage.removeItem("teacher");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default API;
