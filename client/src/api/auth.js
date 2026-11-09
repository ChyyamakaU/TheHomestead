import apiClient from './client';

/**
 * Register a new tenant account.
 * @param {object} data - { first_name, last_name, email, phone, password, confirm_password, agree_terms }
 */
export const register = (data) =>
  apiClient.post('/auth/register', data).then((r) => r.data);

/**
 * Authenticate a user (any role).
 * @param {object} credentials - { email, password }
 */
export const login = (credentials) =>
  apiClient.post('/auth/login', credentials).then((r) => r.data);

/**
 * Log out the current user.
 */
export const logout = () =>
  apiClient.post('/auth/logout').then((r) => r.data);

/**
 * Fetch the currently authenticated user's details.
 * Called on app load to restore session from the HTTP-only cookie.
 */
export const getMe = () =>
  apiClient.get('/auth/me').then((r) => r.data);

/**
 * Exchange a Supabase access token for a Homestead JWT cookie.
 * Called by /auth/callback after Google OAuth completes.
 * @param {string} accessToken — Supabase session access_token
 */
export const googleCallback = (accessToken) =>
  apiClient.post('/auth/google/callback', { access_token: accessToken }).then((r) => r.data);
