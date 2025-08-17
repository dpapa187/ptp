// src/lib/api.js
const API_BASE =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
  (typeof window !== 'undefined' && (window.__API_URL__ || '')) ||
  '';

// Ensures no trailing slash issues
export const apiUrl = (path = '') => {
  const base = API_BASE.replace(/\/$/, '');
  const p = String(path || '').startsWith('/') ? path : '/' + path;
  return base + p;
};

export default apiUrl;
