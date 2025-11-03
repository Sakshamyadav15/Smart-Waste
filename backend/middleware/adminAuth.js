const logger = require('../utils/logger');

/**
 * Admin authentication middleware
 * Validates x-admin-key header against ADMIN_API_KEY environment variable
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    logger.error('ADMIN_API_KEY environment variable not set');
    return res.status(500).json({
      error: true,
      message: 'Server configuration error',
    });
  }

  if (!adminKey) {
    logger.warn('Admin endpoint accessed without API key', {
      requestId: req.id,
      ip: req.ip,
      path: req.path,
    });
    return res.status(401).json({
      error: true,
      message: 'Unauthorized',
      details: 'x-admin-key header is required',
    });
  }

  if (adminKey !== expectedKey) {
    logger.warn('Admin endpoint accessed with invalid API key', {
      requestId: req.id,
      ip: req.ip,
      path: req.path,
    });
    return res.status(401).json({
      error: true,
      message: 'Unauthorized',
      details: 'Invalid admin API key',
    });
  }

  logger.info('Admin authenticated successfully', {
    requestId: req.id,
    path: req.path,
  });

  next();
};

module.exports = adminAuth;
