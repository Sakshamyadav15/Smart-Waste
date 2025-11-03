const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads/temp';

/**
 * Configure multer storage to use temp directory
 * Files will be moved to permanent storage by storageService
 */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

/**
 * File filter to validate MIME types and prevent malicious uploads
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const audioMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav'];

  if (file.fieldname === 'image') {
    if (imageMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image format. Allowed formats: ${imageMimeTypes.join(', ')}`), false);
    }
  } else if (file.fieldname === 'audio') {
    if (audioMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid audio format. Allowed formats: ${audioMimeTypes.join(', ')}`), false);
    }
  } else {
    cb(new Error('Unexpected field name'), false);
  }
};

/**
 * Multer configuration with size limits
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max (will be checked per field in route)
    files: 2, // Maximum 2 files (image + audio)
  },
});

/**
 * Middleware for classification endpoint
 * Accepts single image (required) and optional audio
 */
const uploadClassificationFiles = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);

/**
 * Custom size validator middleware
 * Checks file sizes against environment-configured limits
 */
const validateFileSizes = (req, res, next) => {
  if (!req.files) {
    return next();
  }

  const maxImageSize = (process.env.MAX_IMAGE_SIZE_MB || 5) * 1024 * 1024;
  const maxAudioSize = (process.env.MAX_AUDIO_SIZE_MB || 10) * 1024 * 1024;

  if (req.files.image && req.files.image[0].size > maxImageSize) {
    return res.status(413).json({
      error: true,
      message: 'Image file too large',
      details: `Maximum image size is ${process.env.MAX_IMAGE_SIZE_MB || 5}MB`,
    });
  }

  if (req.files.audio && req.files.audio[0].size > maxAudioSize) {
    return res.status(413).json({
      error: true,
      message: 'Audio file too large',
      details: `Maximum audio size is ${process.env.MAX_AUDIO_SIZE_MB || 10}MB`,
    });
  }

  next();
};

module.exports = {
  uploadClassificationFiles,
  validateFileSizes,
};
