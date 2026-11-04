'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ---------------------------------------------------------------------------
// Cookie configuration — shared by login and register
// ---------------------------------------------------------------------------
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * POST /api/auth/register
 *
 * Creates a new tenant account.
 * Validates uniqueness of email, hashes password via model hook,
 * then issues a JWT cookie so the user is immediately logged in.
 */
const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, password } = req.body;

    // Check for duplicate email (case-insensitive)
    const existing = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email address already exists.',
      });
    }

    // Create the tenant account — password is hashed by the beforeCreate hook
    const user = await User.create({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role: 'tenant',
      is_active: true,
    });

    // Issue JWT and log the user in immediately
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully. Welcome to Homestead.',
      user: user.toSafeObject(),
    });
  } catch (error) {
    // Sequelize unique constraint (race condition fallback)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email address already exists.',
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/login
 *
 * Authenticates any user — tenant, admin or superadmin.
 * Returns the same generic error for wrong email or wrong password
 * to prevent user enumeration.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    const invalidCredentials = {
      status: 'error',
      message: 'Invalid email or password.',
    };

    if (!user) return res.status(401).json(invalidCredentials);

    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) return res.status(401).json(invalidCredentials);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clears the authentication cookie.
 */
const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  });
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (any role).
 */
const getMe = (req, res) => {
  return res.status(200).json({
    status: 'success',
    user: req.user,
  });
};

module.exports = { register, login, logout, getMe };
