import apiClient from '../client';

// ─── Apartment CRUD ──────────────────────────────────────────

/**
 * Admin: fetch all apartments (includes drafts).
 * @param {object} params - { status, availability, city, apartment_type, search }
 * @returns {Promise<object>} { count, apartments }
 */
export const getAllApartments = (params = {}) =>
  apiClient.get('/apartments', { params }).then((r) => r.data);

/**
 * Admin: fetch a single apartment by ID.
 * @param {number|string} id
 * @returns {Promise<object>} { apartment }
 */
export const getApartmentById = (id) =>
  apiClient.get(`/apartments/${id}`).then((r) => r.data);

/**
 * Admin: create a new apartment.
 * @param {object} data - apartment fields + amenityIds[]
 * @returns {Promise<object>} { apartment }
 */
export const createApartment = (data) =>
  apiClient.post('/apartments', data).then((r) => r.data);

/**
 * Admin: update an existing apartment.
 * @param {number|string} id
 * @param {object} data - fields to update + optional amenityIds[]
 * @returns {Promise<object>} { apartment }
 */
export const updateApartment = (id, data) =>
  apiClient.put(`/apartments/${id}`, data).then((r) => r.data);

/**
 * Admin: delete an apartment (cascades to images and amenity links).
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export const deleteApartment = (id) =>
  apiClient.delete(`/apartments/${id}`).then((r) => r.data);

/**
 * Admin: update only the status (publish / unpublish / draft).
 * @param {number|string} id
 * @param {string} status - "published" | "draft"
 * @returns {Promise<object>}
 */
export const updateApartmentStatus = (id, status) =>
  apiClient.patch(`/apartments/${id}/status`, { status }).then((r) => r.data);

// ─── Amenity CRUD ────────────────────────────────────────────

/**
 * Admin: list all amenities.
 * @returns {Promise<object>} { amenities }
 */
export const getAllAmenities = () =>
  apiClient.get('/apartments/amenities').then((r) => r.data);

/**
 * Admin: create a new amenity.
 * @param {object} data - { name }
 * @returns {Promise<object>} { amenity }
 */
export const createAmenity = (data) =>
  apiClient.post('/apartments/amenities', data).then((r) => r.data);

/**
 * Admin: delete an amenity globally.
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export const deleteAmenity = (id) =>
  apiClient.delete(`/apartments/amenities/${id}`).then((r) => r.data);

// ─── Image management ────────────────────────────────────────

/**
 * Admin: list all images for an apartment.
 * @param {number|string} apartmentId
 * @returns {Promise<object>} { images }
 */
export const getApartmentImages = (apartmentId) =>
  apiClient.get(`/apartments/${apartmentId}/images`).then((r) => r.data);

/**
 * Admin: upload images for an apartment (multipart/form-data, field name "images", max 10 total).
 * @param {number|string} apartmentId
 * @param {File[]} files
 * @returns {Promise<object>} { images }
 */
export const uploadImages = (apartmentId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  return apiClient
    .post(`/apartments/${apartmentId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

/**
 * Admin: set an image as the primary/cover image.
 * @param {number|string} apartmentId
 * @param {number|string} imageId
 * @returns {Promise<object>}
 */
export const setPrimaryImage = (apartmentId, imageId) =>
  apiClient.patch(`/apartments/${apartmentId}/images/${imageId}/primary`).then((r) => r.data);

/**
 * Admin: delete a single image.
 * @param {number|string} apartmentId
 * @param {number|string} imageId
 * @returns {Promise<object>}
 */
export const deleteImage = (apartmentId, imageId) =>
  apiClient.delete(`/apartments/${apartmentId}/images/${imageId}`).then((r) => r.data);
