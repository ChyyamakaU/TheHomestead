'use strict';

const { Op } = require('sequelize');
const { Apartment, Amenity, ApartmentAmenity, ApartmentImage } = require('../models');
const {
  deleteImage: deleteStoredImage,
  isStorageConfigured,
} = require('../services/storageService');

// ---------------------------------------------------------------------------
// Helper: standard apartment query options
// Reused across getAll, getOne, create, update so responses are consistent.
// ---------------------------------------------------------------------------
const apartmentInclude = [
  {
    model: Amenity,
    as: 'amenities',
    attributes: ['id', 'name'],
    through: { attributes: [] }, // exclude junction table fields from response
  },
  {
    model: ApartmentImage,
    as: 'images',
    attributes: ['id', 'filename', 'url', 'is_primary', 'display_order'],
    order: [['display_order', 'ASC']],
  },
];

// ---------------------------------------------------------------------------
// GET /api/apartments
// Returns all apartments (admin view — includes drafts).
// Supports optional query filters: status, availability, city, apartment_type
// ---------------------------------------------------------------------------
const getAllApartments = async (req, res, next) => {
  try {
    const { status, availability, city, apartment_type, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (availability) where.availability = availability;
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (apartment_type) where.apartment_type = { [Op.iLike]: `%${apartment_type}%` };
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
        { state: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const apartments = await Apartment.findAll({
      where,
      include: apartmentInclude,
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      status: 'success',
      count: apartments.length,
      apartments,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/apartments/:id
// Returns a single apartment by ID (admin view).
// ---------------------------------------------------------------------------
const getApartmentById = async (req, res, next) => {
  try {
    const apartment = await Apartment.findByPk(req.params.id, {
      include: apartmentInclude,
    });

    if (!apartment) {
      return res.status(404).json({
        status: 'error',
        message: 'Apartment not found.',
      });
    }

    return res.status(200).json({ status: 'success', apartment });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/apartments
// Creates a new apartment. Slug is auto-generated from the title via model hook.
// Optionally accepts amenityIds[] to attach amenities on creation.
// ---------------------------------------------------------------------------
const createApartment = async (req, res, next) => {
  try {
    const {
      title, description, address, city, state, country,
      apartment_type, price, payment_period,
      bedrooms, bathrooms, size,
      availability, status,
      amenityIds,
    } = req.body;

    // Validate required fields
    const errors = [];
    if (!title || title.trim() === '') errors.push('Title is required.');
    if (!city || city.trim() === '') errors.push('City is required.');
    if (!state || state.trim() === '') errors.push('State is required.');
    if (!apartment_type || apartment_type.trim() === '') errors.push('Apartment type is required.');
    if (!price || isNaN(price) || Number(price) < 0) errors.push('A valid price is required.');

    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Validation failed.', errors });
    }

    const apartment = await Apartment.create({
      title: title.trim(),
      description: description || null,
      address: address || null,
      city: city.trim(),
      state: state.trim(),
      country: country || 'Nigeria',
      apartment_type: apartment_type.trim(),
      price: Number(price),
      payment_period: payment_period || 'per year',
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      size: size ? Number(size) : null,
      availability: availability || 'available',
      status: status || 'draft',
    });

    // Attach amenities if provided
    if (amenityIds && Array.isArray(amenityIds) && amenityIds.length > 0) {
      const validAmenities = await Amenity.findAll({
        where: { id: amenityIds },
      });
      await apartment.setAmenities(validAmenities);
    }

    // Re-fetch with associations for the response
    const created = await Apartment.findByPk(apartment.id, { include: apartmentInclude });

    return res.status(201).json({
      status: 'success',
      message: 'Apartment created successfully.',
      apartment: created,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/apartments/:id
// Updates an existing apartment. Only provided fields are updated.
// ---------------------------------------------------------------------------
const updateApartment = async (req, res, next) => {
  try {
    const apartment = await Apartment.findByPk(req.params.id);

    if (!apartment) {
      return res.status(404).json({ status: 'error', message: 'Apartment not found.' });
    }

    const {
      title, description, address, city, state, country,
      apartment_type, price, payment_period,
      bedrooms, bathrooms, size,
      availability, status,
      amenityIds,
    } = req.body;

    // Build update object — only include fields that were sent
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city.trim();
    if (state !== undefined) updates.state = state.trim();
    if (country !== undefined) updates.country = country;
    if (apartment_type !== undefined) updates.apartment_type = apartment_type.trim();
    if (price !== undefined) updates.price = Number(price);
    if (payment_period !== undefined) updates.payment_period = payment_period;
    if (bedrooms !== undefined) updates.bedrooms = Number(bedrooms);
    if (bathrooms !== undefined) updates.bathrooms = Number(bathrooms);
    if (size !== undefined) updates.size = size ? Number(size) : null;
    if (availability !== undefined) updates.availability = availability;
    if (status !== undefined) updates.status = status;

    await apartment.update(updates);

    // Replace amenities if amenityIds was provided
    if (amenityIds !== undefined && Array.isArray(amenityIds)) {
      const validAmenities = await Amenity.findAll({ where: { id: amenityIds } });
      await apartment.setAmenities(validAmenities);
    }

    const updated = await Apartment.findByPk(apartment.id, { include: apartmentInclude });

    return res.status(200).json({
      status: 'success',
      message: 'Apartment updated successfully.',
      apartment: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/apartments/:id
// Deletes an apartment. Associated images and amenity links are removed
// automatically via CASCADE constraints defined in the migrations.
// Image files on disk are also deleted.
// ---------------------------------------------------------------------------
const deleteApartment = async (req, res, next) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const apartment = await Apartment.findByPk(req.params.id, {
      include: [{ model: ApartmentImage, as: 'images' }],
    });

    if (!apartment) {
      return res.status(404).json({ status: 'error', message: 'Apartment not found.' });
    }

    // Delete image files from persistent storage and the uploads folder
    // before removing the DB record.
    if (apartment.images && apartment.images.length > 0) {
      for (const image of apartment.images) {
        if (isStorageConfigured()) {
          try {
            await deleteStoredImage(image.filename);
          } catch (storageError) {
            console.error(
              `[apartments] Failed to delete ${image.filename} from storage:`,
              storageError.message
            );
          }
        }

        const filePath = path.join(__dirname, '..', 'uploads', image.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await apartment.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Apartment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/apartments/:id/status
// Publish, unpublish, or set to draft without touching other fields.
// Body: { status: "published" | "draft" }
// ---------------------------------------------------------------------------
const updateApartmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['published', 'draft'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be "published" or "draft".',
      });
    }

    const apartment = await Apartment.findByPk(req.params.id);

    if (!apartment) {
      return res.status(404).json({ status: 'error', message: 'Apartment not found.' });
    }

    await apartment.update({ status });

    return res.status(200).json({
      status: 'success',
      message: `Apartment ${status === 'published' ? 'published' : 'unpublished'} successfully.`,
      apartment: { id: apartment.id, title: apartment.title, status: apartment.status },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Amenity CRUD (global — not apartment-specific)
// ---------------------------------------------------------------------------

// GET /api/apartments/amenities — list all available amenities
const getAllAmenities = async (req, res, next) => {
  try {
    const amenities = await Amenity.findAll({ order: [['name', 'ASC']] });
    return res.status(200).json({ status: 'success', amenities });
  } catch (error) {
    next(error);
  }
};

// POST /api/apartments/amenities — create a new amenity
const createAmenity = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Amenity name is required.' });
    }

    const amenity = await Amenity.create({ name: name.trim() });

    return res.status(201).json({
      status: 'success',
      message: 'Amenity created successfully.',
      amenity,
    });
  } catch (error) {
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ status: 'error', message: 'This amenity already exists.' });
    }
    next(error);
  }
};

// DELETE /api/apartments/amenities/:id — delete an amenity globally
const deleteAmenity = async (req, res, next) => {
  try {
    const amenity = await Amenity.findByPk(req.params.id);

    if (!amenity) {
      return res.status(404).json({ status: 'error', message: 'Amenity not found.' });
    }

    await amenity.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Amenity deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllApartments,
  getApartmentById,
  createApartment,
  updateApartment,
  deleteApartment,
  updateApartmentStatus,
  getAllAmenities,
  createAmenity,
  deleteAmenity,
};
