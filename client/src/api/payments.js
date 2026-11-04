import apiClient from './client';

// Tenant
export const getMyPayments = () => apiClient.get('/payments/my').then(r => r.data);
export const getMyPaymentById = (id) => apiClient.get(`/payments/my/${id}`).then(r => r.data);
export const initiateCashPayment = (data) => apiClient.post('/payments/cash', data).then(r => r.data);

// Admin
export const getAllPayments = (params) => apiClient.get('/payments', { params }).then(r => r.data);
export const getPaymentById = (id) => apiClient.get(`/payments/${id}`).then(r => r.data);
export const verifyCashPayment = (id, data) => apiClient.patch(`/payments/${id}/verify`, data).then(r => r.data);
export const cancelPayment = (id) => apiClient.patch(`/payments/${id}/cancel`).then(r => r.data);

// Payment configs (admin)
export const getAllPaymentConfigs = () => apiClient.get('/payment-configs').then(r => r.data);
export const createPaymentConfig = (data) => apiClient.post('/payment-configs', data).then(r => r.data);
export const updatePaymentConfig = (id, data) => apiClient.patch(`/payment-configs/${id}`, data).then(r => r.data);
export const deletePaymentConfig = (id) => apiClient.delete(`/payment-configs/${id}`).then(r => r.data);
