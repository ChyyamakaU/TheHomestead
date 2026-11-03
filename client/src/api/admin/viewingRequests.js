import apiClient from '../client';

// ─── Viewing request management (admin) ─────────────────────

/**
 * Admin: fetch viewing request statistics for the dashboard.
 * @returns {Promise<object>} { stats: { total, pending, confirmed, completed, cancelled } }
 */
export const getViewingRequestStats = () =>
  apiClient.get('/viewing-requests/stats').then((r) => r.data);

/**
 * Admin: fetch a paginated list of viewing requests with optional filters.
 * @param {object} params - { status, search, apartment_id, page, limit }
 * @returns {Promise<object>} { pagination, viewingRequests }
 */
export const getAllViewingRequests = (params = {}) =>
  apiClient.get('/viewing-requests', { params }).then((r) => r.data);

/**
 * Admin: fetch a single viewing request by ID.
 * @param {number|string} id
 * @returns {Promise<object>} { viewingRequest }
 */
export const getViewingRequestById = (id) =>
  apiClient.get(`/viewing-requests/${id}`).then((r) => r.data);

/**
 * Admin: update a viewing request's status and/or admin notes.
 * @param {number|string} id
 * @param {object} data - { status?, admin_notes? }
 * @returns {Promise<object>} { viewingRequest }
 */
export const updateViewingRequest = (id, data) =>
  apiClient.patch(`/viewing-requests/${id}`, data).then((r) => r.data);

/**
 * Admin: delete a viewing request.
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export const deleteViewingRequest = (id) =>
  apiClient.delete(`/viewing-requests/${id}`).then((r) => r.data);
