import axios from "axios";

const API_URL = "http://localhost:3001"; // adjust backend port

// Safe localStorage helpers
const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("jwt", token);
  }
};

const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("jwt");
  }
};

export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("jwt");
  }
  return null;
};

// Auth actions
export const login = async (username: string, password: string) => {
  const res = await axios.post(`${API_URL}/auth/login`, { username, password });
  const token = res.data.access_token;
  setToken(token);
  return token;
};

export const logout = () => {
  removeToken();
};

// Axios instance (no token at first — will add dynamically)
export const api = axios.create({
  baseURL: API_URL,
});

// Attach token dynamically before each request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Example current user fetch
export const getMe = async () => {
  return api.get("/users/me").then((res) => res.data);
};
