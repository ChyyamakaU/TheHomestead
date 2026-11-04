'use strict';

const express = require('express');
const router  = express.Router();

const {
  submitViewingRequest,
  getAllViewingRequests,
  getViewingRequestById,
  updateViewingRequest,
  deleteViewingRequest,
  getViewingRequestStats,
  getMyViewingRequests,
  getMyViewingRequestById,
} = require('../controllers/viewingRequestController');

const { verifyToken, requireAdmin, requireTenant, optionalAuth } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// Tenant: own records — defined BEFORE admin /:id routes
// ---------------------------------------------------------------------------
router.get('/my',     verifyToken, requireTenant, getMyViewingRequests);
router.get('/my/:id', verifyToken, requireTenant, getMyViewingRequestById);

// ---------------------------------------------------------------------------
// Public submit — optionalAuth attaches user_id if logged in
// ---------------------------------------------------------------------------
router.post('/', optionalAuth, submitViewingRequest);

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------
router.get('/stats',  verifyToken, requireAdmin, getViewingRequestStats);
router.get('/',       verifyToken, requireAdmin, getAllViewingRequests);
router.get('/:id',    verifyToken, requireAdmin, getViewingRequestById);
router.patch('/:id',  verifyToken, requireAdmin, updateViewingRequest);
router.delete('/:id', verifyToken, requireAdmin, deleteViewingRequest);

module.exports = router;
