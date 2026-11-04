'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * verifyToken
 * Reads the JWT from the HTTP-only 'token' cookie, verifies it,
 * re-fetches the user from the database and attaches req.user.
 * Works for ALL roles: superadmin, admin, tenant.
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No authentication token found.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. User account not found.',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. Your account has been deactivated.',
      });
    }

    req.user = user.toSafeObject();
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Session expired. Please log in again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authentication token.',
      });
    }
    next(error);
  }
};

/**
 * optionalAuth
 * Tries to verify the token but does NOT block unauthenticated requests.
 * If a valid token is present, req.user is populated.
 * If not, req.user stays undefined and the request continues.
 * Used on routes that serve both authenticated and anonymous users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (user && user.is_active) {
      req.user = user.toSafeObject();
    }
    next();
  } catch {
    // Invalid or expired token — treat as anonymous, don't error
    next();
  }
};

/**
 * requireAdmin
 * Must be used after verifyToken.
 * Allows only admin and superadmin roles.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Administrator privileges required.',
    });
  }
  next();
};

/**
 * requireTenant
 * Must be used after verifyToken.
 * Allows only the 'tenant' role. Admins use their own routes.
 */
const requireTenant = (req, res, next) => {
  if (!req.user || req.user.role !== 'tenant') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Tenant account required.',
    });
  }
  next();
};

/**
 * requireAuth
 * Must be used after verifyToken.
 * Allows any authenticated role (tenant, admin, superadmin).
 * Use this when an endpoint should be accessible to all logged-in users.
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required.',
    });
  }
  next();
};

module.exports = { verifyToken, optionalAuth, requireAdmin, requireTenant, requireAuth };
