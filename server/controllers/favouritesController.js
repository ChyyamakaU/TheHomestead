'use strict';

const { SavedApartment, Apartment, ApartmentImage, Amenity } = require('../models');

// Standard include for saved apartment listings
const apartmentInclude = [
  {
    model: ApartmentImage,
    as: 'images',
    attributes: ['url', 'is_primary', 'display_order'],
    order: [['display_order', 'ASC']],
  },
  {
    model: Amenity,
    as: 'amenities',
    attributes: ['id', 'name'],
    through: { attributes: [] },
  },
];

// ---------------------------------------------------------------------------
// GET /api/favourites
// Returns all apartments saved by the authenticated user.
// ---------------------------------------------------------------------------
const getFavourites = async (req, res, next) => {
  try {
    const saved = await SavedApartment.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Apartment,
          as: 'apartment',
          include: apartmentInclude,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const apartments = saved.map((s) => ({
      saved_id: s.id,
      saved_at: s.created_at,
      ...s.apartment.toJSON(),
    }));

    return res.status(200).json({ status: 'success', apartments });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/favourites/:apartmentId
// Saves an apartment to the user's favourites.
// Returns 200 if already saved (idempotent).
// ---------------------------------------------------------------------------
const saveApartment = async (req, res, next) => {
  try {
    const apartmentId = parseInt(req.params.apartmentId, 10);

    if (isNaN(apartmentId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid apartment ID.' });
    }

    // Confirm apartment exists and is published
    const apartment = await Apartment.findOne({
      where: { id: apartmentId, status: 'published' },
    });

    if (!apartment) {
      return res.status(404).json({
        status: 'error',
        message: 'Apartment not found or not available.',
      });
    }

    // findOrCreate is idempotent — won't error if already saved
    const [saved, created] = await SavedApartment.findOrCreate({
      where: { user_id: req.user.id, apartment_id: apartmentId },
    });

    return res.status(created ? 201 : 200).json({
      status: 'success',
      message: created ? 'Apartment saved.' : 'Apartment already saved.',
      saved_id: saved.id,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/favourites/:apartmentId
// Removes an apartment from the user's favourites.
// ---------------------------------------------------------------------------
const unsaveApartment = async (req, res, next) => {
  try {
    const apartmentId = parseInt(req.params.apartmentId, 10);

    if (isNaN(apartmentId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid apartment ID.' });
    }

    const deleted = await SavedApartment.destroy({
      where: { user_id: req.user.id, apartment_id: apartmentId },
    });

    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'This apartment is not in your saved list.',
      });
    }

    return res.status(200).json({ status: 'success', message: 'Apartment removed from saved list.' });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/favourites/ids
// Returns only the apartment IDs saved by the user — used by the frontend
// to show the "saved" state on apartment cards without a full fetch.
// ---------------------------------------------------------------------------
const getSavedIds = async (req, res, next) => {
  try {
    const saved = await SavedApartment.findAll({
      where: { user_id: req.user.id },
      attributes: ['apartment_id'],
    });

    const ids = saved.map((s) => s.apartment_id);
    return res.status(200).json({ status: 'success', ids });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFavourites, saveApartment, unsaveApartment, getSavedIds };
