import apiClient from './client';

export const getPaymentStats = () =>
  apiClient.get('/payments/stats').then((r) => r.data);

// ── Tenant ────────────────────────────────────────────────────────────────
export const getMyPayments = () =>
  apiClient.get('/payments/my').then((r) => r.data);

export const getMyPaymentById = (id) =>
  apiClient.get(`/payments/my/${id}`).then((r) => r.data);

export const initiateCashPayment = (data) =>
  apiClient.post('/payments/cash', data).then((r) => r.data);

/**
 * Initialize a Paystack payment.
 * Returns { authorization_url, reference, payment_id }
 * The frontend redirects to authorization_url to complete payment.
 */
export const initializePaystackPayment = (data) =>
  apiClient.post('/payments/paystack/initialize', data).then((r) => r.data);

/**
 * Verify a Paystack payment after returning from checkout.
 * Called when the user lands back on /dashboard/payments?ref=HM-...
 */
export const verifyPaystackPayment = (reference) =>
  apiClient.get(`/payments/paystack/verify/${reference}`).then((r) => r.data);

// ── Admin ─────────────────────────────────────────────────────────────────
export const getAllPayments = (params) =>
  apiClient.get('/payments', { params }).then((r) => r.data);

export const getPaymentById = (id) =>
  apiClient.get(`/payments/${id}`).then((r) => r.data);

export const verifyCashPayment = (id, data) =>
  apiClient.patch(`/payments/${id}/verify`, data).then((r) => r.data);

export const cancelPayment = (id) =>
  apiClient.patch(`/payments/${id}/cancel`).then((r) => r.data);

// ── Payment configs (admin) ───────────────────────────────────────────────
export const getAllPaymentConfigs = () =>
  apiClient.get('/payment-configs').then((r) => r.data);

export const createPaymentConfig = (data) =>
  apiClient.post('/payment-configs', data).then((r) => r.data);

export const updatePaymentConfig = (id, data) =>
  apiClient.patch(`/payment-configs/${id}`, data).then((r) => r.data);

export const deletePaymentConfig = (id) =>
  apiClient.delete(`/payment-configs/${id}`).then((r) => r.data);
