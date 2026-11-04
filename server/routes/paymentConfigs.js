'use strict';
const express = require('express');
const router = express.Router();
const { getAllPaymentConfigs, createPaymentConfig, updatePaymentConfig, deletePaymentConfig } = require('../controllers/paymentConfigController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);
router.get('/', getAllPaymentConfigs);
router.post('/', createPaymentConfig);
router.patch('/:id', updatePaymentConfig);
router.delete('/:id', deletePaymentConfig);

module.exports = router;
