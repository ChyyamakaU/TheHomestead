'use strict';

const fs = require('fs');
const path = require('path');
const { Apartment, ApartmentImage } = require('../models');
const {
  uploadImage,
  deleteImage: deleteStoredImage,
  isStorageConfigured,
} = require('../services/storageService');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Generate a collision-resistant filename for uploads kept in memory.
const makeFilename = (originalname) => {
  const ext = path.extname(originalname || '').toLowerCase();
  return `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
};

// Remove any temporary files multer wrote to disk (no-op with memory storage).
const cleanupLocalFiles = (files) => {
  if (!files) return;
  files.forEach((file) => {
    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
  });
};

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
      cleanupLocalFiles(req.files);
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
      cleanupLocalFiles(req.files);
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
    const useStorage = isStorageConfigured();
    const storedFilenames = [];
    const imageRecords = [];

    try {
      for (let index = 0; index < req.files.length; index += 1) {
        const file = req.files[index];
        let filename;
        let url;

        if (useStorage) {
          // Memory storage does not assign a filename, so generate one here.
          filename = file.filename || makeFilename(file.originalname);
          url = await uploadImage(file.buffer, filename, file.mimetype);
          storedFilenames.push(filename);
        } else {
          filename = file.filename;
          // Local development fallback: serve from server/uploads.
          url = `/uploads/${file.filename}`;
        }

        imageRecords.push({
          apartment_id: apartment.id,
          filename,
          url,
          // Auto-set first image as primary if no primary exists yet
          is_primary: !hasPrimary && index === 0,
          display_order: baseOrder + index,
        });
      }

      const images = await ApartmentImage.bulkCreate(imageRecords);

      return res.status(201).json({
        status: 'success',
        message: `${images.length} image(s) uploaded successfully.`,
        images,
      });
    } catch (error) {
      // Remove anything already persisted so a failed upload leaves no orphans.
      cleanupLocalFiles(req.files);
      await Promise.all(
        storedFilenames.map((filename) =>
          deleteStoredImage(filename).catch((cleanupError) => {
            console.error(
              `[images] Failed to clean up stored file ${filename}:`,
              cleanupError.message
            );
          })
        )
      );
      throw error;
    }
  } catch (error) {
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

    // Remove the file from persistent storage. Older rows may still point at
    // the local uploads directory, so try both locations without letting a
    // missing file block the database delete.
    if (isStorageConfigured()) {
      try {
        await deleteStoredImage(image.filename);
      } catch (storageError) {
        console.error(
          `[images] Failed to delete ${image.filename} from storage:`,
          storageError.message
        );
      }
    }

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
