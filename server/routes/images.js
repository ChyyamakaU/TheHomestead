'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams gives access to :id from parent router

const {
  uploadImages,
  setPrimaryImage,
  deleteImage,
  getApartmentImages,
} = require('../controllers/imageController');

const { verifyToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All image management routes are admin-only.
// These routes are mounted under /api/apartments/:id/images in app.js,
// so :id refers to the apartment id throughout.

// GET    /api/apartments/:id/images              — list all images for an apartment
router.get('/',           verifyToken, requireAdmin, getApartmentImages);

// POST   /api/apartments/:id/images              — upload images (max 10 total per apartment)
// upload.array('images', 10) means the field name in the form is "images"
// and we allow at most 10 files per request.
router.post('/',          verifyToken, requireAdmin, upload.array('images', 10), uploadImages);

// PATCH  /api/apartments/:id/images/:imageId/primary — set as cover image
router.patch('/:imageId/primary', verifyToken, requireAdmin, setPrimaryImage);

// DELETE /api/apartments/:id/images/:imageId     — delete a single image
router.delete('/:imageId',        verifyToken, requireAdmin, deleteImage);

module.exports = router;
