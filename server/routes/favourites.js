'use strict';

const express = require('express');
const router  = express.Router();

const {
  getFavourites,
  saveApartment,
  unsaveApartment,
  getSavedIds,
} = require('../controllers/favouritesController');

const { verifyToken, requireTenant } = require('../middleware/auth');

// All favourites routes require a tenant account
router.use(verifyToken, requireTenant);

// GET  /api/favourites          — list saved apartments (full data)
router.get('/',                getFavourites);

// GET  /api/favourites/ids      — list saved apartment IDs only (lightweight)
router.get('/ids',             getSavedIds);

// POST /api/favourites/:id      — save an apartment
router.post('/:apartmentId',   saveApartment);

// DELETE /api/favourites/:id    — unsave an apartment
router.delete('/:apartmentId', unsaveApartment);

module.exports = router;
