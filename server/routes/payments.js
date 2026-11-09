'use strict';

const express = require('express');
const router  = express.Router();

const {
  initiateCashPayment,
  getMyPayments,
  getMyPaymentById,
  getAllPayments,
  getPaymentById,
  verifyCashPayment,
  cancelPayment,
  initializePaystackPayment,
  verifyPaystackPayment,
  paystackWebhook,
  getPaymentStats,
} = require('../controllers/paymentController');

const { verifyToken, requireAdmin, requireTenant } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// Webhook — MUST use raw body so signature verification works.
// Express normally parses JSON bodies; for this route we need the raw bytes.
// We attach them to req.rawBody before the JSON parser runs.
// ---------------------------------------------------------------------------
router.post(
  '/paystack/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    // Make raw body available as a Buffer on req.rawBody
    req.rawBody = req.body;
    // Also parse to JSON for downstream use
    try { req.body = JSON.parse(req.rawBody.toString()); } catch { req.body = {}; }
    next();
  },
  paystackWebhook
);

// ---------------------------------------------------------------------------
// Tenant routes — defined before admin /:id to avoid route conflicts
// ---------------------------------------------------------------------------
router.get('/my',                       verifyToken, requireTenant, getMyPayments);
router.get('/my/:id',                   verifyToken, requireTenant, getMyPaymentById);
router.post('/cash',                    verifyToken, requireTenant, initiateCashPayment);
router.post('/paystack/initialize',     verifyToken, requireTenant, initializePaystackPayment);
router.get('/paystack/verify/:reference', verifyToken, requireTenant, verifyPaystackPayment);

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------
router.get('/stats',         verifyToken, requireAdmin, getPaymentStats);
router.get('/',              verifyToken, requireAdmin, getAllPayments);
router.get('/:id',           verifyToken, requireAdmin, getPaymentById);
router.patch('/:id/verify',  verifyToken, requireAdmin, verifyCashPayment);
router.patch('/:id/cancel',  verifyToken, requireAdmin, cancelPayment);

module.exports = router;
