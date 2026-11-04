import axios from 'axios';

/**
 * Central Axios instance for all API requests.
 *
 * withCredentials: true is required so the browser sends and receives
 * the HTTP-only JWT cookie on every request to the backend.
 *
 * All API modules import this instance rather than creating their own,
 * keeping the base URL and credentials config in a single place.
 */
const apiClient = axios.create({
  // In development, Vite proxies /api/* to http://localhost:5000
  // so we use a relative path. In production, set VITE_API_URL.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
