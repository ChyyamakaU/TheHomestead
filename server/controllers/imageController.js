'use strict';

const fs = require('fs');
const path = require('path');
const { Apartment, ApartmentImage } = require('../models');

// ---------------------------------------------------------------------------
// POST /api/apartments/:id/images
// Uploads one or more images for an apartment (max 10 total across all uploads).
// Uses multer middleware (applied at the route level).
// The first uploaded image is automatically set as primary if no primary exists.
// ---------------------------------------------------------------------------
const uploadImages = async (req, res, next) => {
  try {
    const apartment = await Apartment.findByPk(req.params.id);

    if (!apartment) {
      // Clean up any files multer already saved if the apartment doesn't exist
      if (req.files) {
        req.files.forEach((f) => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
      }
      return res.status(404).json({ status: 'error', message: 'Apartment not found.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No image files were uploaded.' });
    }

    // Check total image count does not exceed 10
    const existingCount = await ApartmentImage.count({
      where: { apartment_id: apartment.id },
    });

    if (existingCount + req.files.length > 10) {
      // Clean up newly uploaded files since we are rejecting them
      req.files.forEach((f) => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
      return res.status(400).json({
        status: 'error',
        message: `Cannot upload ${req.files.length} image(s). An apartment can have a maximum of 10 images. This apartment currently has ${existingCount}.`,
      });
    }

    // Determine if we need to auto-set a primary image
    const hasPrimary = await ApartmentImage.findOne({
      where: { apartment_id: apartment.id, is_primary: true },
    });

    const baseOrder = existingCount;
    const imageRecords = req.files.map((file, index) => ({
      apartment_id: apartment.id,
      filename: file.filename,
      // Build the public URL from the filename
      url: `/uploads/${file.filename}`,
      // Auto-set first image as primary if no primary exists yet
      is_primary: !hasPrimary && index === 0,
      display_order: baseOrder + index,
    }));

    const images = await ApartmentImage.bulkCreate(imageRecords);

    return res.status(201).json({
      status: 'success',
      message: `${images.length} image(s) uploaded successfully.`,
      images,
    });
  } catch (error) {
    // Clean up any uploaded files if the database operation failed
    if (req.files) {
      req.files.forEach((f) => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/apartments/:id/images/:imageId/primary
// Sets the specified image as the primary (cover) image for the apartment.
// Clears the is_primary flag on all other images first.
// ---------------------------------------------------------------------------
const setPrimaryImage = async (req, res, next) => {
  try {
    const { id: apartmentId, imageId } = req.params;

    const image = await ApartmentImage.findOne({
      where: { id: imageId, apartment_id: apartmentId },
    });

    if (!image) {
      return res.status(404).json({ status: 'error', message: 'Image not found for this apartment.' });
    }

    // Clear primary on all images for this apartment, then set on the target
    await ApartmentImage.update(
      { is_primary: false },
      { where: { apartment_id: apartmentId } }
    );
    await image.update({ is_primary: true });

    return res.status(200).json({
      status: 'success',
      message: 'Primary image updated successfully.',
      image,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/apartments/:id/images/:imageId
// Deletes a single image — removes the file from disk and the DB record.
// If the deleted image was the primary, automatically promotes the next
// image (lowest display_order) to primary.
// ---------------------------------------------------------------------------
const deleteImage = async (req, res, next) => {
  try {
    const { id: apartmentId, imageId } = req.params;

    const image = await ApartmentImage.findOne({
      where: { id: imageId, apartment_id: apartmentId },
    });

    if (!image) {
      return res.status(404).json({ status: 'error', message: 'Image not found for this apartment.' });
    }

    const wasPrimary = image.is_primary;

    // Delete the physical file from disk
    const filePath = path.join(__dirname, '..', 'uploads', image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await image.destroy();

    // If the deleted image was primary, promote the next one
    if (wasPrimary) {
      const nextImage = await ApartmentImage.findOne({
        where: { apartment_id: apartmentId },
        order: [['display_order', 'ASC']],
      });
      if (nextImage) {
        await nextImage.update({ is_primary: true });
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/apartments/:id/images
// Returns all images for an apartment ordered by display_order.
// ---------------------------------------------------------------------------
const getApartmentImages = async (req, res, next) => {
  try {
    const apartment = await Apartment.findByPk(req.params.id);

    if (!apartment) {
      return res.status(404).json({ status: 'error', message: 'Apartment not found.' });
    }

    const images = await ApartmentImage.findAll({
      where: { apartment_id: req.params.id },
      order: [['display_order', 'ASC']],
    });

    return res.status(200).json({ status: 'success', images });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImages, setPrimaryImage, deleteImage, getApartmentImages };
