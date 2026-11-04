'use strict';

const express = require('express');
const router = express.Router();

const { getProfile, updateProfile, changePassword, getDashboardStats } = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

router.get('/profile',           verifyToken, getProfile);
router.patch('/profile',         verifyToken, updateProfile);
router.patch('/change-password', verifyToken, changePassword);
router.get('/dashboard-stats',   verifyToken, getDashboardStats);

module.exports = router;
