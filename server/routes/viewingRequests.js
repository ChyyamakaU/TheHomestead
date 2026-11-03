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
} = require('../controllers/viewingRequestController');

const { verifyToken, requireAdmin } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// Public route — no authentication required
// POST /api/viewing-requests
// Visitors submit a viewing request for a published apartment.
// ---------------------------------------------------------------------------
router.post('/', submitViewingRequest);

// ---------------------------------------------------------------------------
// Admin routes — verifyToken + requireAdmin on every route
// ---------------------------------------------------------------------------

// GET /api/viewing-requests/stats
// Must be defined BEFORE /:id to prevent "stats" being matched as an ID.
router.get('/stats',  verifyToken, requireAdmin, getViewingRequestStats);

// GET /api/viewing-requests              — paginated list with optional filters
router.get('/',       verifyToken, requireAdmin, getAllViewingRequests);

// GET /api/viewing-requests/:id          — single request detail
router.get('/:id',    verifyToken, requireAdmin, getViewingRequestById);

// PATCH /api/viewing-requests/:id        — update status and/or admin notes
router.patch('/:id',  verifyToken, requireAdmin, updateViewingRequest);

// DELETE /api/viewing-requests/:id       — remove a request
router.delete('/:id', verifyToken, requireAdmin, deleteViewingRequest);

module.exports = router;
