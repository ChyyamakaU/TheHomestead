'use strict';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// ---------------------------------------------------------------------------
// CORS
// Allows the React frontend (running on CLIENT_URL) to make requests to this
// API. credentials: true is required so the browser sends HTTP-only cookies
// (which will carry the JWT in Phase 2).
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// ---------------------------------------------------------------------------
// Body parsers
// express.json()        — parses incoming JSON request bodies
// express.urlencoded() — parses form submissions (needed for multipart later)
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Cookie parser
// Parses Cookie header so req.cookies is populated.
// Required for reading the HTTP-only JWT cookie in Phase 2.
// ---------------------------------------------------------------------------
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Static file serving for uploads
// Uploaded apartment images are stored in server/uploads/.
// Serving them as static files makes them accessible at /uploads/<filename>.
// ---------------------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------------------------------------------------------------
// Health check route
// A simple endpoint to confirm the server is running and reachable.
// Useful during development and for uptime monitoring later.
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'TheHomestead API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
const authRoutes           = require('./routes/auth');
const apartmentRoutes      = require('./routes/apartments');
const imageRoutes          = require('./routes/images');
const publicRoutes         = require('./routes/public');
const viewingRequestRoutes = require('./routes/viewingRequests');
const applicationRoutes    = require('./routes/applications');

// Rate limiter for authentication endpoints
// Prevents brute-force attacks on login and register.
// 10 attempts per IP per 15 minutes.
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    status: 'error',
    message: 'Too many attempts from this IP address. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth',               authLimiter, authRoutes);
app.use('/api/apartments',         apartmentRoutes);
app.use('/api/apartments/:id/images', imageRoutes);
app.use('/api/public',             publicRoutes);
app.use('/api/viewing-requests',   viewingRequestRoutes);
app.use('/api/applications',       applicationRoutes);

// Additional route files will be mounted here as they are created.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 404 handler
// Catches any request that did not match a defined route.
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ---------------------------------------------------------------------------
// Global error handler
// Express calls this middleware whenever next(error) is called from a route
// or when an unhandled error is thrown in a route handler.
// Having one central place for error responses keeps them consistent.
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Handle multer-specific errors (file upload validation)
  // These are user-facing errors and should never show a stack trace.
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'error',
      message: 'File too large. Maximum file size is 5MB.',
    });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      status: 'error',
      message: 'Too many files. Maximum 10 images per upload.',
    });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      status: 'error',
      message: 'Unexpected field name in file upload. Use "images" as the field name.',
    });
  }
  // multer fileFilter rejection (invalid file type)
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Never expose stack traces in production
  const response = {
    status: 'error',
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  console.error(`[${new Date().toISOString()}] ${statusCode} - ${message}`);
  res.status(statusCode).json(response);
});

module.exports = app;
