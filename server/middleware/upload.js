const path = require('path');
const multer = require('multer');
const env = require('../config/env');
const { AppError } = require('./auth');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new AppError('Only JPG, PNG, and WEBP images are allowed.', 400));
  }
  cb(null, true);
}

const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxFileSizeBytes,
    files: 1,
  },
});

module.exports = { uploadProfileImage };
