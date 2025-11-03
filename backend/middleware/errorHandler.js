const logger = require('../utils/logger');

/**
 * Global error handler middleware
 * Catches both synchronous and asynchronous errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error with request context
  logger.error('Error occurred', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  });

  // Handle Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: true,
        message: 'File too large',
        details: `Maximum file size is ${process.env.MAX_IMAGE_SIZE_MB || 5}MB for images and ${process.env.MAX_AUDIO_SIZE_MB || 10}MB for audio`,
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: true,
        message: 'Unexpected file field',
        details: 'Only "image" and "audio" fields are accepted',
      });
    }
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      error: true,
      message: 'Validation error',
      details: err.message,
    });
  }

  // Handle database errors
  if (err.code === 'SQLITE_ERROR' || err.code === 'SQLITE_CONSTRAINT') {
    return res.status(500).json({
      error: true,
      message: 'Database error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while processing your request',
    });
  }

  // Handle Axios/HTTP errors from external services
  if (err.isAxiosError) {
    return res.status(502).json({
      error: true,
      message: 'External service error',
      details: 'Failed to communicate with AI service. Please try again later.',
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: true,
    message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found',
    path: req.path,
  });
};

/**
 * Async error wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
