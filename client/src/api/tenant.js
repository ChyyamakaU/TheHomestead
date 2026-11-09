import apiClient from './client';

// Tenant: own applications
export const getMyApplications = () =>
  apiClient.get('/applications/my').then((r) => r.data);

export const getMyApplicationById = (id) =>
  apiClient.get(`/applications/my/${id}`).then((r) => r.data);

// Tenant: payment obligation for a specific approved application
export const getMyApplicationPayment = (id) =>
  apiClient.get(`/applications/my/${id}/payment`).then((r) => r.data);

// Tenant: own viewing requests
export const getMyViewingRequests = () =>
  apiClient.get('/viewing-requests/my').then((r) => r.data);

export const getMyViewingRequestById = (id) =>
  apiClient.get(`/viewing-requests/my/${id}`).then((r) => r.data);

// Favourites
export const getFavourites = () =>
  apiClient.get('/favourites').then((r) => r.data);

export const getSavedIds = () =>
  apiClient.get('/favourites/ids').then((r) => r.data);

export const saveApartment = (apartmentId) =>
  apiClient.post(`/favourites/${apartmentId}`).then((r) => r.data);

export const unsaveApartment = (apartmentId) =>
  apiClient.delete(`/favourites/${apartmentId}`).then((r) => r.data);

// Dashboard stats
export const getDashboardStats = () =>
  apiClient.get('/users/dashboard-stats').then((r) => r.data);
