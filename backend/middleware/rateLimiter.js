const rateLimit = require('express-rate-limit');

/**
 * General rate limiter for public endpoints
 * 100 requests per 15 minutes by default
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: {
    error: true,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: true,
      message: 'Too many requests',
      details: `Maximum ${req.rateLimit.limit} requests per ${Math.floor((parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000) / 60000)} minutes exceeded`,
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Stricter rate limiter for classification endpoint
 * 30 requests per 15 minutes by default (more resource-intensive)
 */
const classifyLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.CLASSIFY_RATE_LIMIT_MAX, 10) || 30,
  message: {
    error: true,
    message: 'Too many classification requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: true,
      message: 'Classification rate limit exceeded',
      details: 'You have exceeded the maximum number of classification requests. Please wait before trying again.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

module.exports = {
  generalLimiter,
  classifyLimiter,
};
