const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const adminAuth = require('../middleware/adminAuth');
const db = require('../db/database');
const firebaseService = require('../services/firebaseService');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize Firebase if enabled
if (process.env.USE_FIREBASE === 'true') {
  firebaseService.initializeFirebase();
}

/**
 * POST /feedback
 * Submit user feedback for incorrect classification
 * Public endpoint - no authentication required
 */
router.post(
  '/',
  [
    body('predictionId').optional().isInt().withMessage('Prediction ID must be an integer'),
    body('originalLabel')
      .notEmpty()
      .withMessage('Original label is required')
      .isString()
      .trim(),
    body('correctLabel')
      .notEmpty()
      .withMessage('Correct label is required')
      .isString()
      .trim(),
    body('confidence').optional().isFloat({ min: 0, max: 1 }),
    body('city').notEmpty().withMessage('City is required').isString().trim(),
    body('notes').optional().isString().trim(),
    body('userEmail').optional().isEmail().withMessage('Invalid email format').normalizeEmail(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: true,
        message: 'Validation failed',
        details: errors.array(),
      });
    }

    const {
      predictionId,
      originalLabel,
      correctLabel,
      confidence,
      city,
      notes,
      userEmail,
    } = req.body;

    const requestId = req.id;

    logger.info('Feedback submission received', {
      requestId,
      predictionId,
      city,
      originalLabel,
      correctLabel,
    });

    try {
      // Validate prediction exists if predictionId provided
      if (predictionId) {
        const prediction = await db.getPredictionById(predictionId);
        if (!prediction) {
          return res.status(404).json({
            error: true,
            message: 'Prediction not found',
            details: `No prediction found with ID ${predictionId}`,
          });
        }
      }

      const feedbackData = {
        predictionId: predictionId || null,
        originalLabel,
        correctLabel,
        confidence: confidence || null,
        city,
        notes: notes || null,
        userEmail: userEmail || null,
      };

      let feedbackId;

      // Save to Firebase or SQLite based on configuration
      if (firebaseService.isFirebaseEnabled()) {
        feedbackId = await firebaseService.saveFeedbackToFirestore(feedbackData);
        logger.info('Feedback saved to Firestore', { requestId, feedbackId });
      } else {
        feedbackId = await db.insertFeedback(feedbackData);
        logger.info('Feedback saved to SQLite', { requestId, feedbackId });
      }

      // Update prediction to mark that feedback exists
      if (predictionId) {
        await db.markPredictionHasFeedback(predictionId, feedbackId);
        logger.info('Prediction marked with feedback', {
          requestId,
          predictionId,
          feedbackId,
        });
      }

      res.status(201).json({
        status: 'ok',
        message: 'Feedback submitted successfully',
        data: {
          feedbackId,
          predictionId: predictionId || null,
        },
      });
    } catch (error) {
      logger.error('Feedback submission failed', {
        requestId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        error: true,
        message: 'Failed to submit feedback',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
      });
    }
  })
);

/**
 * GET /feedback
 * Get feedback entries with filters (Admin only)
 * Requires x-admin-key header
 */
router.get(
  '/',
  adminAuth,
  [
    query('city').optional().isString().trim(),
    query('resolved').optional().isBoolean().toBoolean(),
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: true,
        message: 'Validation failed',
        details: errors.array(),
      });
    }

    const {
      city,
      resolved,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    const requestId = req.id;

    logger.info('Feedback query received', {
      requestId,
      city,
      resolved,
      limit,
      offset,
    });

    try {
      let result;

      if (firebaseService.isFirebaseEnabled()) {
        const feedbackList = await firebaseService.getFeedbackFromFirestore({
          city,
          resolved,
          limit,
        });
        result = {
          data: feedbackList,
          total: feedbackList.length,
          limit,
          offset: 0,
        };
      } else {
        result = await db.getFeedback({
          city,
          resolved,
          startDate,
          endDate,
          limit,
          offset,
        });
      }

      res.status(200).json({
        status: 'ok',
        ...result,
      });
    } catch (error) {
      logger.error('Failed to retrieve feedback', {
        requestId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        error: true,
        message: 'Failed to retrieve feedback',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
      });
    }
  })
);

/**
 * PATCH /feedback/:id/resolve
 * Mark feedback as resolved (Admin only)
 * Requires x-admin-key header
 */
router.patch(
  '/:id/resolve',
  adminAuth,
  [
    body('resolved')
      .notEmpty()
      .withMessage('Resolved status is required')
      .isBoolean()
      .withMessage('Resolved must be a boolean'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: true,
        message: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { resolved } = req.body;
    const requestId = req.id;

    logger.info('Feedback resolve request received', {
      requestId,
      feedbackId: id,
      resolved,
    });

    try {
      if (firebaseService.isFirebaseEnabled()) {
        await firebaseService.updateFeedbackResolvedInFirestore(id, resolved);
      } else {
        const feedbackId = parseInt(id, 10);
        
        // Check if feedback exists
        const feedback = await db.getFeedbackById(feedbackId);
        if (!feedback) {
          return res.status(404).json({
            error: true,
            message: 'Feedback not found',
            details: `No feedback found with ID ${feedbackId}`,
          });
        }

        await db.updateFeedbackResolved(feedbackId, resolved);
      }

      logger.info('Feedback resolved status updated', {
        requestId,
        feedbackId: id,
        resolved,
      });

      res.status(200).json({
        status: 'ok',
        message: 'Feedback resolved status updated',
        data: {
          feedbackId: id,
          resolved,
        },
      });
    } catch (error) {
      logger.error('Failed to update feedback', {
        requestId,
        feedbackId: id,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        error: true,
        message: 'Failed to update feedback',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
      });
    }
  })
);

/**
 * GET /feedback/stats
 * Get feedback statistics (Admin only)
 */
router.get(
  '/stats',
  adminAuth,
  asyncHandler(async (req, res) => {
    const requestId = req.id;

    logger.info('Feedback stats request received', { requestId });

    try {
      // Get all feedback
      const allFeedback = await db.getFeedback({ limit: 10000 });
      const feedbackData = allFeedback.data;

      // Calculate statistics
      const stats = {
        total: feedbackData.length,
        resolved: feedbackData.filter((f) => f.resolved).length,
        unresolved: feedbackData.filter((f) => !f.resolved).length,
        byCity: {},
        topIncorrectLabels: {},
      };

      // Group by city
      feedbackData.forEach((f) => {
        if (!stats.byCity[f.city]) {
          stats.byCity[f.city] = { total: 0, resolved: 0, unresolved: 0 };
        }
        stats.byCity[f.city].total++;
        if (f.resolved) {
          stats.byCity[f.city].resolved++;
        } else {
          stats.byCity[f.city].unresolved++;
        }

        // Track incorrect labels
        const key = `${f.original_label} → ${f.correct_label}`;
        stats.topIncorrectLabels[key] = (stats.topIncorrectLabels[key] || 0) + 1;
      });

      // Sort top incorrect labels
      stats.topIncorrectLabels = Object.entries(stats.topIncorrectLabels)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});

      res.status(200).json({
        status: 'ok',
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to retrieve feedback stats', {
        requestId,
        error: error.message,
      });

      res.status(500).json({
        error: true,
        message: 'Failed to retrieve statistics',
      });
    }
  })
);

module.exports = router;
