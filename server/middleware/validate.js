'use strict';

/**
 * validate.js — Input validation middleware
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

/**
 * Password strength: min 8 chars, one uppercase, one lowercase, one special char.
 */
const isStrongPassword = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
};

// ---------------------------------------------------------------------------
// validateLogin — POST /api/auth/login
// ---------------------------------------------------------------------------
const validateLogin = (req, res, next) => {
  const errors = [];
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required.');
  } else if (!isValidEmail(email.trim())) {
    errors.push('Please enter a valid email address.');
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'Validation failed.', errors });
  }

  next();
};

// ---------------------------------------------------------------------------
// validateRegister — POST /api/auth/register
// ---------------------------------------------------------------------------
const validateRegister = (req, res, next) => {
  const errors = [];
  const { first_name, last_name, email, phone, password, confirm_password, agree_terms } = req.body;

  if (!first_name || first_name.trim().length < 1) {
    errors.push('First name is required.');
  } else if (first_name.trim().length > 100) {
    errors.push('First name must be 100 characters or fewer.');
  }

  if (!last_name || last_name.trim().length < 1) {
    errors.push('Last name is required.');
  } else if (last_name.trim().length > 100) {
    errors.push('Last name must be 100 characters or fewer.');
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email address is required.');
  } else if (!isValidEmail(email.trim())) {
    errors.push('Please enter a valid email address.');
  }

  if (!phone || phone.trim() === '') {
    errors.push('Phone number is required.');
  } else if (!isValidPhone(phone.trim())) {
    errors.push('Please enter a valid phone number (7 to 15 digits).');
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push('Password is required.');
  } else if (!isStrongPassword(password)) {
    errors.push(
      'Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a special character.'
    );
  }

  if (!confirm_password || confirm_password !== password) {
    errors.push('Passwords do not match.');
  }

  if (!agree_terms) {
    errors.push('You must agree to the Terms and Conditions and Privacy Policy to register.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'Validation failed.', errors });
  }

  next();
};

module.exports = { validateLogin, validateRegister, isStrongPassword, isValidEmail, isValidPhone };

