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
const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);

// Additional route files will be mounted here as they are created.
// Example:
//   const apartmentRoutes = require('./routes/apartments');
//   app.use('/api/apartments', apartmentRoutes);
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
