'use strict';

/**
 * validate.js — Input validation middleware
 *
 * Rather than pulling in a full validation library for a small number of
 * endpoints, we validate manually. Each exported function validates a
 * specific route's request body and calls next() if clean, or returns
 * a structured 400 error listing every problem found.
 *
 * All rules are enforced here on the backend regardless of what the
 * frontend does — the backend is the authoritative source of truth.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Checks that an email address has a valid format.
 * Rules:
 *  - Local part (before @) must start with letters, followed by optional
 *    letters and numbers (e.g. john123, not 123john)
 *  - Must contain @
 *  - Domain part must contain at least one dot
 */
const isValidEmail = (email) => {
  // Local part starts with one or more letters, then optional letters/numbers/dots/hyphens
  const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Checks password strength.
 * Rules: min 8 chars, at least one uppercase, one lowercase, one special character.
 */
const isStrongPassword = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;  // at least one uppercase
  if (!/[a-z]/.test(password)) return false;  // at least one lowercase
  if (!/[^A-Za-z0-9]/.test(password)) return false; // at least one special char
  return true;
};

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/**
 * validateLogin
 *
 * Validates the request body for POST /api/auth/login.
 * Checks that email and password are present and correctly formatted.
 * Does NOT check whether credentials match a user — that is the
 * controller's job. Validation only checks shape and format.
 */
const validateLogin = (req, res, next) => {
  const errors = [];
  const { email, password } = req.body;

  // Email checks
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required.');
  } else if (!isValidEmail(email.trim())) {
    errors.push(
      'Please enter a valid email address (e.g. john123@example.com).'
    );
  }

  // Password checks
  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push('Password is required.');
  } else if (!isStrongPassword(password)) {
    errors.push(
      'Password must be at least 8 characters and include uppercase letters, lowercase letters, and special characters.'
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed.',
      errors,
    });
  }

  next();
};

module.exports = { validateLogin };
