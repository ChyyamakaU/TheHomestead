'use strict';

const { User } = require('../models');
const { isValidPhone } = require('../middleware/validate');

// ---------------------------------------------------------------------------
// GET /api/users/profile
// Returns the authenticated user's profile.
// Works for any role — tenant, admin, superadmin.
// ---------------------------------------------------------------------------
const getProfile = (req, res) => {
  // req.user is already populated by verifyToken
  return res.status(200).json({
    status: 'success',
    user: req.user,
  });
};

// ---------------------------------------------------------------------------
// PATCH /api/users/profile
// Updates first_name, last_name and/or phone.
// Email is intentionally not updatable here — that requires a separate
// verified flow (out of scope for this phase).
// ---------------------------------------------------------------------------
const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const errors = [];

    if (first_name !== undefined) {
      if (typeof first_name !== 'string' || first_name.trim().length < 1) {
        errors.push('First name cannot be empty.');
      } else if (first_name.trim().length > 100) {
        errors.push('First name must be 100 characters or fewer.');
      }
    }

    if (last_name !== undefined) {
      if (typeof last_name !== 'string' || last_name.trim().length < 1) {
        errors.push('Last name cannot be empty.');
      } else if (last_name.trim().length > 100) {
        errors.push('Last name must be 100 characters or fewer.');
      }
    }

    if (phone !== undefined && phone !== null && phone !== '') {
      if (!isValidPhone(phone.trim())) {
        errors.push('Please enter a valid phone number (7 to 15 digits).');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Validation failed.', errors });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name.trim();
    if (last_name !== undefined)  updates.last_name  = last_name.trim();
    if (phone !== undefined)      updates.phone      = phone ? phone.trim() : null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ status: 'error', message: 'No fields provided to update.' });
    }

    await user.update(updates);

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/users/change-password
// Requires the current password for verification before updating.
// ---------------------------------------------------------------------------
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password, confirm_new_password } = req.body;
    const errors = [];

    if (!current_password) errors.push('Current password is required.');
    if (!new_password) {
      errors.push('New password is required.');
    } else {
      // Validate password strength
      if (new_password.length < 8)               errors.push('New password must be at least 8 characters.');
      if (!/[A-Z]/.test(new_password))           errors.push('New password must include at least one uppercase letter.');
      if (!/[a-z]/.test(new_password))           errors.push('New password must include at least one lowercase letter.');
      if (!/[^A-Za-z0-9]/.test(new_password))   errors.push('New password must include at least one special character.');
    }
    if (new_password && confirm_new_password !== new_password) {
      errors.push('New passwords do not match.');
    }
    if (new_password && current_password && new_password === current_password) {
      errors.push('New password must be different from your current password.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Validation failed.', errors });
    }

    // Fetch the full user record (with hashed password) for comparison
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    const passwordMatch = await user.comparePassword(current_password);
    if (!passwordMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect.',
      });
    }

    // The beforeUpdate hook in the User model handles hashing
    await user.update({ password: new_password });

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword };
