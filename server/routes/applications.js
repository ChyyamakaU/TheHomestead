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
} = require('../controllers/applicationController');

const { verifyToken, requireAdmin } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// Public route — no authentication required
// POST /api/applications
// Visitors submit a rental application for a published apartment.
// ---------------------------------------------------------------------------
router.post('/', submitApplication);

// ---------------------------------------------------------------------------
// Admin routes — all protected by verifyToken + requireAdmin
// ---------------------------------------------------------------------------

// GET /api/applications/stats
// Defined BEFORE /:id to prevent "stats" being matched as an ID parameter.
router.get('/stats',  verifyToken, requireAdmin, getApplicationStats);

// GET /api/applications              — paginated list with optional filters
router.get('/',       verifyToken, requireAdmin, getAllApplications);

// GET /api/applications/:id          — single application detail
router.get('/:id',    verifyToken, requireAdmin, getApplicationById);

// PATCH /api/applications/:id        — update status and/or admin notes
router.patch('/:id',  verifyToken, requireAdmin, updateApplication);

// DELETE /api/applications/:id       — remove an application
router.delete('/:id', verifyToken, requireAdmin, deleteApplication);

module.exports = router;
