// src/api.js
// Central place to build API URLs and make HTTP calls from the React app.
// Works on Render (or any host) by reading REACT_APP_API_URL set in the service env.

import axios from "axios";

/**
 * Base URL for the backend API.
 * - Set REACT_APP_API_URL in your Render Static Site env to something like:
 *   https://your-backend.onrender.com
 * - We normalize by removing any trailing slash.
 */
export const API_BASE =
  (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

/**
 * Join base + path safely (handles leading/trailing slashes).
 * @param {string} path e.g. "/api/health" or "api/health"
 * @returns {string} full URL
 */
export const apiUrl = (path = "") => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
};

/**
 * Optional user-supplied API keys (if your backend supports forwarding them).
 * Stored via your Settings modal, e.g. localStorage.setItem('openai_key', 'sk-...')
 * NOTE: If your backend manages keys server-side, you can ignore this.
 */
const readUserKeys = () => {
  try {
    return {
      openai: localStorage.getItem("openai_key") || "",
      anthropic: localStorage.getItem("anthropic_key") || "",
    };
  } catch {
    return { openai: "", anthropic: "" };
  }
};

/**
 * Axios instance with sensible defaults.
 * - 45s default timeout (tweak if needed)
 * - Sends optional X-Client-* headers your backend can choose to use/ignore
 */
export const http = axios.create({
  baseURL: API_BASE || "/", // baseURL is only used for absolute building by axios; we still prefer apiUrl()
  timeout: 45000,
});

// Attach headers per request (optional)
http.interceptors.request.use((config) => {
  const keys = readUserKeys();
  config.headers = {
    ...config.headers,
    "X-Client-App": "ptp-frontend",
    "X-Client-Version": "1.0.0",
  };

  // Forward user keys only if present (backend should validate/ignore as needed)
  if (keys.openai) config.headers["X-OpenAI-Key"] = keys.openai;
  if (keys.anthropic) config.headers["X-Anthropic-Key"] = keys.anthropic;

  return config;
});

/**
 * Convenience helpers
 */
export const api = {
  health: () => http.get(apiUrl("/api/health")),
  generate: (payload, opts = {}) =>
    http.post(apiUrl("/api/generate"), payload, {
      timeout: 90000, // generation can take longer
      ...opts,
    }),
};

export default api;
