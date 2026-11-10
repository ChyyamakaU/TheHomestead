'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isStorageConfigured } = require('../services/storageService');

// Ensure the uploads directory exists at startup
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Storage configuration
//
// Production: keep files in memory and upload them to Supabase Storage in the
// controller. Render's filesystem is ephemeral, so files written to disk are
// lost on every redeploy/restart.
//
// Development: if Supabase Storage is not configured, fall back to
// server/uploads/ so the app still works offline.
//
// Each file gets a unique name: timestamp + original extension.
// This prevents filename collisions if two files are uploaded with the same name.
// ---------------------------------------------------------------------------
const useObjectStorage = isStorageConfigured();

const storage = useObjectStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, uniqueName);
      },
    });

// ---------------------------------------------------------------------------
// File filter
// Only accept image files. Rejects anything that is not a JPEG, PNG, or WebP.
// This check is done on the MIME type AND file extension for double safety.
// ---------------------------------------------------------------------------
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'),
      false
    );
  }
};

// ---------------------------------------------------------------------------
// Multer instance
// Max file size: 5MB per image.
// The max number of files (10) is enforced in the route, not here,
// so the error message can be more specific.
// ---------------------------------------------------------------------------
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB in bytes
  },
});

module.exports = upload;
