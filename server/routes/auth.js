'use strict';

const express = require('express');
const router = express.Router();

const { register, login, logout, getMe, googleCallback } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validate');

// ---------------------------------------------------------------------------
// POST /api/auth/register  — create a new tenant account
// ---------------------------------------------------------------------------
router.post('/register', validateRegister, register);

// ---------------------------------------------------------------------------
// POST /api/auth/login  — authenticate any user (tenant, admin, superadmin)
// ---------------------------------------------------------------------------
router.post('/login', validateLogin, login);

// ---------------------------------------------------------------------------
// POST /api/auth/logout  — clear the auth cookie
// ---------------------------------------------------------------------------
router.post('/logout', verifyToken, logout);

// ---------------------------------------------------------------------------
// GET /api/auth/me  — return the authenticated user's details
// ---------------------------------------------------------------------------
router.get('/me', verifyToken, getMe);

// ---------------------------------------------------------------------------
// POST /api/auth/google/callback
// Receives Supabase access_token, verifies it server-side, issues JWT cookie.
// No validateRegister/validateLogin — Google handles its own validation.
// ---------------------------------------------------------------------------
router.post('/google/callback', googleCallback);

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// Architecture placeholder — not operational until an email service is
// configured. Returns a clear message rather than pretending to send email.
// ---------------------------------------------------------------------------
router.post('/forgot-password', (req, res) => {
  return res.status(503).json({
    status: 'error',
    message:
      'Password reset by email is not yet available. Please contact support to reset your password.',
  });
});

module.exports = router;
