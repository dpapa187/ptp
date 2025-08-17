// src/api.js
export const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || '';
export const apiUrl = (path) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

