'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ---------------------------------------------------------------------------
// Cookie configuration
// The JWT is stored in an HTTP-only cookie so JavaScript running in the
// browser cannot read or steal it (protects against XSS attacks).
// sameSite: 'strict' prevents the cookie from being sent in cross-site
// requests (protects against CSRF attacks).
// secure: true in production ensures the cookie is only sent over HTTPS.
// ---------------------------------------------------------------------------
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

/**
 * POST /api/auth/login
 *
 * Authenticates an administrator.
 * 1. Looks up the user by email.
 * 2. Compares the submitted password against the stored hash.
 * 3. On success, signs a JWT and sets it as an HTTP-only cookie.
 * 4. Returns the safe user object (no password hash).
 *
 * Security note: we deliberately return the same generic error message
 * whether the email does not exist or the password is wrong. This prevents
 * attackers from using the login endpoint to discover valid email addresses
 * (known as user enumeration).
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find the user by email (case-insensitive via lowercase comparison)
    const user = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    // Generic error for both "email not found" and "wrong password"
    const invalidCredentialsError = {
      status: 'error',
      message: 'Invalid email or password.',
    };

    if (!user) {
      return res.status(401).json(invalidCredentialsError);
    }

    // Check account is active before verifying password
    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Compare submitted password against the stored bcrypt hash
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json(invalidCredentialsError);
    }

    // Sign the JWT. The payload contains only non-sensitive identifiers.
    // The full user object is NOT stored in the token — we re-fetch from
    // the database on each protected request (see verifyToken middleware).
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set the JWT as an HTTP-only cookie
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
 *
 * Clears the authentication cookie.
 * The client is immediately logged out — the cookie is overwritten
 * with an expired empty value so the browser discards it.
 *
 * Note: JWTs are stateless. Clearing the cookie is sufficient here
 * because without the cookie the browser cannot send the token.
 * This does not invalidate the token itself, but since the frontend
 * cannot access the HTTP-only cookie, the token is effectively gone.
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
 *
 * Returns the currently authenticated user's details.
 * Protected by verifyToken middleware — req.user is already populated
 * by the time this controller runs.
 *
 * The frontend calls this endpoint when the app loads to restore
 * the authenticated session without requiring another login.
 */
const getMe = (req, res) => {
  return res.status(200).json({
    status: 'success',
    user: req.user,
  });
};

module.exports = { login, logout, getMe };
