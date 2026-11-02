'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * verifyToken
 *
 * Reads the JWT from the HTTP-only cookie named 'token'.
 * Verifies its signature and expiry using the JWT_SECRET.
 * If valid, attaches the decoded user payload to req.user
 * and calls next() to continue to the route handler.
 *
 * If the token is missing or invalid, responds with 401
 * and does NOT call next() — the request stops here.
 *
 * This middleware must run before requireAdmin.
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

    // Verify the token signature and decode the payload.
    // jwt.verify throws if the token is expired or the signature is wrong.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Re-fetch the user from the database on each request.
    // This ensures that if an account is deactivated after a token is issued,
    // the deactivated user cannot continue making requests using an old token.
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

    // Attach the safe user object to the request for downstream use.
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
 * requireAdmin
 *
 * Must be used AFTER verifyToken in the middleware chain.
 * Checks that the authenticated user's role is either
 * 'admin' or 'superadmin'. Responds with 403 if not.
 *
 * 401 = not authenticated (handled by verifyToken)
 * 403 = authenticated but not authorised (handled here)
 *
 * Usage on a route:
 *   router.get('/protected', verifyToken, requireAdmin, controller)
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

module.exports = { verifyToken, requireAdmin };
