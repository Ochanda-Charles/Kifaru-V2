import axios from "axios";

const isLocalhost = typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_BASE_URL = isLocalhost
    ? "http://localhost:4000"
    : "https://kifaruswypt.onrender.com";

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include the token in all requests if it exists
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("merchantToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
export { API_BASE_URL };
