'use strict';

const express = require('express');
const router = express.Router();

const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// All user profile routes require authentication.
// They work for any role — tenant, admin, superadmin.

// GET  /api/users/profile          — return the authenticated user's profile
router.get('/profile',         verifyToken, getProfile);

// PATCH /api/users/profile         — update name and/or phone number
router.patch('/profile',       verifyToken, updateProfile);

// PATCH /api/users/change-password — change password (requires current password)
router.patch('/change-password', verifyToken, changePassword);

module.exports = router;
