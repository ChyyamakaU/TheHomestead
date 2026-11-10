'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getSupabaseUser } = require('../services/supabaseService');

// ---------------------------------------------------------------------------
// Cookie configuration — shared by login, register, and Google OAuth
// ---------------------------------------------------------------------------
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

/**
 * POST /api/auth/google/callback
 *
 * Receives the Supabase access token from the frontend after Google OAuth.
 * 1. Verifies the token with Supabase (server-side — service role key).
 * 2. Looks up the user by supabase_id (canonical link — never by email alone).
 * 3. If not found, creates a new tenant account.
 *    - Role is ALWAYS 'tenant'. Google metadata cannot grant admin access.
 *    - Password is null — Google users have no local password.
 *    - Phone is null — not required for Google sign-in.
 * 4. Issues the existing JWT cookie so the session works identically
 *    to email/password login.
 *
 * Security:
 *  - Never links to an existing password account based on matching email.
 *    A user who registered with email/password keeps a separate account
 *    unless they explicitly link (not implemented — out of scope).
 *  - The Supabase service role key stays server-side only.
 *  - Admin accounts cannot be created through this endpoint.
 */
const googleCallback = async (req, res, next) => {
  try {
    const { access_token } = req.body;

    if (!access_token || typeof access_token !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'access_token is required.',
      });
    }

    // 1. Verify token with Supabase — throws if invalid/expired
    let supabaseUser;
    try {
      supabaseUser = await getSupabaseUser(access_token);
    } catch {
      return res.status(401).json({
        status: 'error',
        message: 'Google sign-in failed. Please try again.',
      });
    }

    const { id: supabase_id, email, user_metadata } = supabaseUser;

    if (!supabase_id || !email) {
      return res.status(401).json({
        status: 'error',
        message: 'Incomplete user data from Google. Please try again.',
      });
    }

    // 2. Look up by supabase_id — the only trusted link
    let user = await User.findOne({ where: { supabase_id } });

    // 3. Create new tenant account if not found
    if (!user) {
      // Parse name from Google metadata — full_name or name field
      const fullName  = user_metadata?.full_name || user_metadata?.name || '';
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || email.split('@')[0];
      const lastName  = nameParts.slice(1).join(' ') || '-';

      user = await User.create({
        supabase_id,
        email:      email.trim().toLowerCase(),
        first_name: firstName,
        last_name:  lastName,
        password:   null,   // Google users have no local password
        phone:      null,   // not required
        role:       'tenant', // NEVER grant admin via Google
        is_active:  true,
      });
    }

    // Reject deactivated accounts
    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // 4. Issue the same JWT cookie used by email/password login
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(200).json({
      status: 'success',
      message: 'Signed in with Google successfully.',
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe, googleCallback };
