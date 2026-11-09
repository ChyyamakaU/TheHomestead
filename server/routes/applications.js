'use strict';

const express = require('express');
const router  = express.Router();

const {
  submitApplication,
  getAllApplications,
  getApplicationStats,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getMyApplications,
  getMyApplicationById,
  getMyApplicationPayment,
  getApplicationPaymentAdmin,
} = require('../controllers/applicationController');

const { verifyToken, requireAdmin, requireTenant, optionalAuth } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// Tenant: own records — must be defined BEFORE admin /:id routes
// ---------------------------------------------------------------------------
router.get('/my',              verifyToken, requireTenant, getMyApplications);
router.get('/my/:id',          verifyToken, requireTenant, getMyApplicationById);
router.get('/my/:id/payment',  verifyToken, requireTenant, getMyApplicationPayment);

// ---------------------------------------------------------------------------
// Public submit — optionalAuth attaches user_id if logged in
// ---------------------------------------------------------------------------
router.post('/', optionalAuth, submitApplication);

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------
router.get('/stats',          verifyToken, requireAdmin, getApplicationStats);
router.get('/',               verifyToken, requireAdmin, getAllApplications);
router.get('/:id',            verifyToken, requireAdmin, getApplicationById);
router.get('/:id/payment',    verifyToken, requireAdmin, getApplicationPaymentAdmin);
router.patch('/:id',          verifyToken, requireAdmin, updateApplication);
router.delete('/:id',         verifyToken, requireAdmin, deleteApplication);

module.exports = router;
