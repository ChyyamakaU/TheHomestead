import apiClient from './client';

/**
 * Authenticate an admin user and set the HTTP-only JWT cookie.
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} { user }
 */
export const login = (credentials) =>
  apiClient.post('/auth/login', credentials).then((r) => r.data);

/**
 * Log out the current user by clearing the auth cookie.
 * @returns {Promise<object>}
 */
export const logout = () =>
  apiClient.post('/auth/logout').then((r) => r.data);

/**
 * Fetch the currently authenticated user's details.
 * Called on app load to restore session state from the HTTP-only cookie.
 * @returns {Promise<object>} { user }
 */
export const getMe = () =>
  apiClient.get('/auth/me').then((r) => r.data);
