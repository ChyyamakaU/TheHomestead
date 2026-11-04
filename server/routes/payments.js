'use strict';
const express = require('express');
const router = express.Router();
const { initiateCashPayment, getMyPayments, getMyPaymentById, getAllPayments, getPaymentById, verifyCashPayment, cancelPayment } = require('../controllers/paymentController');
const { verifyToken, requireAdmin, requireTenant } = require('../middleware/auth');

// Tenant routes (defined before admin /:id to avoid conflicts)
router.get('/my', verifyToken, requireTenant, getMyPayments);
router.get('/my/:id', verifyToken, requireTenant, getMyPaymentById);
router.post('/cash', verifyToken, requireTenant, initiateCashPayment);

// Admin routes
router.get('/', verifyToken, requireAdmin, getAllPayments);
router.get('/:id', verifyToken, requireAdmin, getPaymentById);
router.patch('/:id/verify', verifyToken, requireAdmin, verifyCashPayment);
router.patch('/:id/cancel', verifyToken, requireAdmin, cancelPayment);

module.exports = router;
