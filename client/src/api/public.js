import apiClient from './client';

// ─── Public apartment browsing ───────────────────────────────

/**
 * Fetch a paginated list of published apartments with optional filters.
 * @param {object} params - { page, limit, city, state, apartment_type, bedrooms, min_price, max_price, availability, search }
 * @returns {Promise<object>} { pagination, apartments }
 */
export const getPublicApartments = (params = {}) =>
  apiClient.get('/public/apartments', { params }).then((r) => r.data);

/**
 * Fetch a single published apartment by slug.
 * @param {string} slug
 * @returns {Promise<object>} { apartment }
 */
export const getPublicApartmentBySlug = (slug) =>
  apiClient.get(`/public/apartments/slug/${slug}`).then((r) => r.data);

/**
 * Fetch a single published apartment by numeric ID.
 * @param {number|string} id
 * @returns {Promise<object>} { apartment }
 */
export const getPublicApartmentById = (id) =>
  apiClient.get(`/public/apartments/${id}`).then((r) => r.data);

/**
 * Fetch available filter options (cities, states, types, bedrooms, price range)
 * for populating search dropdowns.
 * @returns {Promise<object>} { filters }
 */
export const getFilterOptions = () =>
  apiClient.get('/public/filter-options').then((r) => r.data);

// ─── Public form submissions ─────────────────────────────────

/**
 * Submit a viewing request for a published apartment (public, no auth).
 * @param {object} data - { apartment_id, full_name, email, phone, preferred_date, preferred_time, message }
 * @returns {Promise<object>} { viewingRequest }
 */
export const submitViewingRequest = (data) =>
  apiClient.post('/viewing-requests', data).then((r) => r.data);

/**
 * Submit a rental application for a published apartment (public, no auth).
 * @param {object} data - { apartment_id, full_name, email, phone, intended_move_in_date, message }
 * @returns {Promise<object>} { application }
 */
export const submitApplication = (data) =>
  apiClient.post('/applications', data).then((r) => r.data);
