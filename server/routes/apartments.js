'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllApartments,
  getApartmentById,
  createApartment,
  updateApartment,
  deleteApartment,
  updateApartmentStatus,
  getAllAmenities,
  createAmenity,
  deleteAmenity,
} = require('../controllers/apartmentController');

const { verifyToken, requireAdmin } = require('../middleware/auth');

// All apartment management routes require a valid admin session.
// verifyToken confirms the JWT cookie is present and valid.
// requireAdmin confirms the user's role is admin or superadmin.

// ---------------------------------------------------------------------------
// Amenity routes — must be defined BEFORE /:id routes to avoid Express
// treating "amenities" as an :id parameter
// ---------------------------------------------------------------------------
router.get('/amenities',              verifyToken, requireAdmin, getAllAmenities);
router.post('/amenities',             verifyToken, requireAdmin, createAmenity);
router.delete('/amenities/:id',       verifyToken, requireAdmin, deleteAmenity);

// ---------------------------------------------------------------------------
// Apartment CRUD routes
// ---------------------------------------------------------------------------
router.get('/',                       verifyToken, requireAdmin, getAllApartments);
router.get('/:id',                    verifyToken, requireAdmin, getApartmentById);
router.post('/',                      verifyToken, requireAdmin, createApartment);
router.put('/:id',                    verifyToken, requireAdmin, updateApartment);
router.delete('/:id',                 verifyToken, requireAdmin, deleteApartment);

// PATCH for status-only changes (publish / unpublish / draft)
router.patch('/:id/status',           verifyToken, requireAdmin, updateApartmentStatus);

module.exports = router;
