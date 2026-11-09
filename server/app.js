'use strict';

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ---------------------------------------------------------------------------
// 0. PROXY TRUST
//    Render (and most PaaS platforms) sit behind a load balancer that injects
//    X-Forwarded-For. Setting trust proxy to 1 tells Express to read the real
//    client IP from the first hop in that header — the Render proxy — rather
//    than treating req.socket.remoteAddress (the proxy's IP) as the client.
//
//    '1' means trust exactly one proxy hop. This prevents IP spoofing while
//    satisfying express-rate-limit's ERR_ERL_UNEXPECTED_X_FORWARDED_FOR check.
//    Using `true` would blindly trust an unlimited chain and allow spoofing.
// ---------------------------------------------------------------------------
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// 1. SECURITY HEADERS — helmet sets sensible HTTP security headers:
//    X-Content-Type-Options, X-Frame-Options, HSTS (in prod), etc.
//    crossOriginResourcePolicy is relaxed to 'cross-origin' so that
//    images served from /uploads are loadable by the React frontend.
// ---------------------------------------------------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // CSP is handled by the frontend (Vite)
  })
);

// ---------------------------------------------------------------------------
// 2. CORS — strict allowlist: only the configured CLIENT_URL may send
//    credentialed requests. Reject all other origins.
//
//    Trailing slashes are stripped from every configured origin so that
//    CLIENT_URL="https://example.com/" matches the browser's Origin header
//    ("https://example.com") — a common source of false CORS rejections.
//
//    Localhost dev origins (5173 = Vite, 3000 = preview/SSR) are always
//    included so that local development works regardless of what CLIENT_URL
//    is set to in .env.
// ---------------------------------------------------------------------------
const stripTrailingSlash = (url) => (url || '').replace(/\/+$/, '');

const allowedOrigins = [
  stripTrailingSlash(process.env.CLIENT_URL || 'http://localhost:5173'),
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (e.g. Postman / server-to-server) and
      // explicitly allowed browser origins.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---------------------------------------------------------------------------
// 3. BODY PARSERS
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));        // hard cap on JSON body size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ---------------------------------------------------------------------------
// 4. COOKIE PARSER
// ---------------------------------------------------------------------------
app.use(cookieParser());

// ---------------------------------------------------------------------------
// 5. STATIC FILE SERVING — uploaded apartment images
// ---------------------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------------------------------------------------------------
// 6. RATE LIMITERS
//
//    authLimiter      — 10 req / 15 min  (login, register, forgot-password)
//    paymentLimiter   — 20 req / 15 min  (payment initiation & verification)
//    generalLimiter   — 200 req / 15 min (all other API routes)
// ---------------------------------------------------------------------------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 'error',
    message: 'Too many attempts from this IP address. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    status: 'error',
    message: 'Too many payment requests. Please try again shortly.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    status: 'error',
    message: 'Too many requests from this IP address. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health', // health check is never rate-limited
});

// Apply general limiter to all API routes
app.use('/api', generalLimiter);

// ---------------------------------------------------------------------------
// 7. HEALTH CHECK
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
// 8. API ROUTES
// ---------------------------------------------------------------------------
const authRoutes           = require('./routes/auth');
const userRoutes           = require('./routes/users');
const favouritesRoutes     = require('./routes/favourites');
const apartmentRoutes      = require('./routes/apartments');
const imageRoutes          = require('./routes/images');
const publicRoutes         = require('./routes/public');
const viewingRequestRoutes = require('./routes/viewingRequests');
const applicationRoutes    = require('./routes/applications');
const paymentConfigRoutes  = require('./routes/paymentConfigs');
const paymentRoutes        = require('./routes/payments');

app.use('/api/auth',                  authLimiter, authRoutes);
app.use('/api/users',                 userRoutes);
app.use('/api/favourites',            favouritesRoutes);
app.use('/api/apartments',            apartmentRoutes);
app.use('/api/apartments/:id/images', imageRoutes);
app.use('/api/public',                publicRoutes);
app.use('/api/viewing-requests',      viewingRequestRoutes);
app.use('/api/applications',          applicationRoutes);
app.use('/api/payment-configs',       paymentConfigRoutes);
app.use('/api/payments',              paymentLimiter, paymentRoutes);

// ---------------------------------------------------------------------------
// 9. 404 HANDLER
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ---------------------------------------------------------------------------
// 10. GLOBAL ERROR HANDLER
//     Never expose stack traces in production.
//     Handles multer errors, CORS errors, and all other unhandled errors.
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  // CORS rejection
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ status: 'error', message: 'Origin not allowed.' });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ status: 'error', message: 'File too large. Maximum file size is 5MB.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ status: 'error', message: 'Too many files. Maximum 10 images per upload.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ status: 'error', message: 'Unexpected field name in file upload. Use "images" as the field name.' });
  }
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ status: 'error', message: err.message });
  }

  const statusCode = err.statusCode || 500;
  const message    = err.message || 'Internal server error';

  const response = { status: 'error', message };
  if (process.env.NODE_ENV === 'development') response.stack = err.stack;

  console.error(`[${new Date().toISOString()}] ${statusCode} - ${message}`);
  res.status(statusCode).json(response);
});

module.exports = app;
