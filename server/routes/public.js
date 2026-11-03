'use strict';

const express = require('express');
const router = express.Router();

const {
  getPublicApartments,
  getPublicApartmentBySlug,
  getPublicApartmentById,
  getFilterOptions,
} = require('../controllers/publicController');

// ---------------------------------------------------------------------------
// Public routes — NO authentication middleware on any of these.
// All visitors (logged in or not) can access these endpoints.
// ---------------------------------------------------------------------------

/**
 * GET /api/public/apartments
 * Paginated list of published apartments with optional search and filters.
 */
router.get('/apartments', getPublicApartments);

/**
 * GET /api/public/apartments/slug/:slug
 * Single apartment detail by URL slug.
 * Must be defined BEFORE /:id to prevent "slug" being treated as a numeric ID.
 */
router.get('/apartments/slug/:slug', getPublicApartmentBySlug);

/**
 * GET /api/public/apartments/:id
 * Single apartment detail by numeric ID.
 */
router.get('/apartments/:id', getPublicApartmentById);

/**
 * GET /api/public/filter-options
 * Returns distinct filter values (cities, types, price range etc.)
 * for populating search dropdowns on the frontend.
 */
router.get('/filter-options', getFilterOptions);

module.exports = router;
