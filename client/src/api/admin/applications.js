import apiClient from '../client';

// ─── Rental application management (admin) ──────────────────

/**
 * Admin: fetch application statistics for the dashboard.
 * @returns {Promise<object>} { stats: { total, pending, under_review, approved, rejected } }
 */
export const getApplicationStats = () =>
  apiClient.get('/applications/stats').then((r) => r.data);

/**
 * Admin: fetch a paginated list of rental applications with optional filters.
 * @param {object} params - { status, search, apartment_id, page, limit }
 * @returns {Promise<object>} { pagination, applications }
 */
export const getAllApplications = (params = {}) =>
  apiClient.get('/applications', { params }).then((r) => r.data);

/**
 * Admin: fetch a single application by ID.
 * @param {number|string} id
 * @returns {Promise<object>} { application }
 */
export const getApplicationById = (id) =>
  apiClient.get(`/applications/${id}`).then((r) => r.data);

/**
 * Admin: update an application's status and/or admin notes.
 * @param {number|string} id
 * @param {object} data - { status?, admin_notes? }
 * @returns {Promise<object>} { application }
 */
export const updateApplication = (id, data) =>
  apiClient.patch(`/applications/${id}`, data).then((r) => r.data);

/**
 * Admin: delete an application.
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export const deleteApplication = (id) =>
  apiClient.delete(`/applications/${id}`).then((r) => r.data);

/**
 * Admin: fetch the payment record(s) for a specific application.
 * @param {number|string} id
 * @returns {Promise<object>} { application, payments }
 */
export const getApplicationPayment = (id) =>
  apiClient.get(`/applications/${id}/payment`).then((r) => r.data);
