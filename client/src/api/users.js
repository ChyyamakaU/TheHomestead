import apiClient from './client';

/**
 * Fetch the authenticated user's profile.
 */
export const getProfile = () =>
  apiClient.get('/users/profile').then((r) => r.data);

/**
 * Update name and/or phone number.
 * @param {object} data - { first_name?, last_name?, phone? }
 */
export const updateProfile = (data) =>
  apiClient.patch('/users/profile', data).then((r) => r.data);

/**
 * Change the user's password.
 * @param {object} data - { current_password, new_password, confirm_new_password }
 */
export const changePassword = (data) =>
  apiClient.patch('/users/change-password', data).then((r) => r.data);
