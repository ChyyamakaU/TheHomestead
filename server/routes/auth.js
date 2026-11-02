'use strict';

const express = require('express');
const router = express.Router();

const { login, logout, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validate');

// ---------------------------------------------------------------------------
// Auth routes — all mounted under /api/auth in app.js
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/login
 * Public route — no token required.
 * validateLogin runs first to check input format.
 * If validation passes, the login controller handles credential checking.
 */
router.post('/login', validateLogin, login);

/**
 * POST /api/auth/logout
 * Protected — must be logged in to log out.
 * verifyToken confirms the request comes from an authenticated session.
 */
router.post('/logout', verifyToken, logout);

/**
 * GET /api/auth/me
 * Protected — returns the currently authenticated user's details.
 * The frontend calls this on page load to restore session state.
 */
router.get('/me', verifyToken, getMe);

module.exports = router;
