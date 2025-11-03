const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadClassificationFiles, validateFileSizes } = require('../middleware/uploadHandler');
const { classifyLimiter } = require('../middleware/rateLimiter');
const storageService = require('../services/storageService');
const hfService = require('../services/huggingfaceService');
const db = require('../db/database');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /classify
 * Classify waste from uploaded image and optional audio
 * Applies city-specific taxonomy mapping and returns actionable instructions
 */
router.post(
  '/',
  classifyLimiter,
  uploadClassificationFiles,
  validateFileSizes,
  [
    body('city')
      .notEmpty()
      .withMessage('City is required')
      .isString()
      .withMessage('City must be a string')
      .trim(),
    body('userId').optional().isString().trim(),
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

    const { city, userId } = req.body;
    const requestId = req.id;

    // Validate that image is provided
    if (!req.files || !req.files.image || req.files.image.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Image file is required',
        details: 'Please upload an image of the waste item',
      });
    }

    const imageFile = req.files.image[0];
    const audioFile = req.files.audio ? req.files.audio[0] : null;

    logger.info('Classification request received', {
      requestId,
      city,
      userId,
      hasImage: !!imageFile,
      hasAudio: !!audioFile,
    });

    try {
      // Validate city exists
      const cityRecord = await db.getCityByName(city);
      if (!cityRecord) {
        return res.status(422).json({
          error: true,
          message: 'Invalid city',
          details: `City "${city}" is not supported. Please check available cities.`,
        });
      }

      // Save uploaded files to permanent storage
      const savedImage = await storageService.saveFile(imageFile, 'image');
      let savedAudio = null;
      
      if (audioFile) {
        savedAudio = await storageService.saveFile(audioFile, 'audio');
      }

      // Read file buffers for AI processing
      const imageBuffer = await storageService.getFileBuffer(savedImage.savedPath);
      
      // Classify image using Hugging Face (with multiple fallbacks built-in)
      let imageResult;
      try {
        imageResult = await hfService.classifyImage(imageBuffer, requestId);
      } catch (classificationError) {
        logger.error('All classification attempts failed', {
          requestId,
          error: classificationError.message,
        });
        
        // Clean up uploaded files
        try {
          await storageService.deleteFile(savedImage.savedPath);
          if (savedAudio) await storageService.deleteFile(savedAudio.savedPath);
        } catch (cleanupError) {
          logger.warn('Failed to cleanup files after classification error', {
            requestId,
            error: cleanupError.message,
          });
        }
        
        return res.status(503).json({
          error: true,
          message: 'Image classification service temporarily unavailable',
          details: 'Our AI service is experiencing issues. Please try again in a few moments.',
          requestId,
        });
      }
      
      let finalResult = imageResult;
      let audioTranscription = null;

      // Process audio if provided
      if (savedAudio) {
        try {
          const audioBuffer = await storageService.getFileBuffer(savedAudio.savedPath);
          audioTranscription = await hfService.transcribeAudio(audioBuffer, requestId);
          
          // Combine image and audio predictions
          finalResult = hfService.combineMultimodalPredictions(
            imageResult,
            audioTranscription
          );
          
          logger.info('Multimodal classification completed', {
            requestId,
            audioText: audioTranscription.text,
            keywords: finalResult.audioKeywords,
          });
        } catch (audioError) {
          logger.warn('Audio processing failed, using image-only classification', {
            requestId,
            error: audioError.message,
          });
          // Continue with image-only classification
        }
      }

      // Apply city-specific taxonomy mapping
      const taxonomyMapping = await db.getTaxonomyMapping(
        cityRecord.id,
        finalResult.label
      );

      let action = 'Please check with your local waste management authority';
      let canonicalLabel = finalResult.label;
      let appliedTaxonomy = null;

      if (taxonomyMapping) {
        action = taxonomyMapping.action_text;
        canonicalLabel = taxonomyMapping.canonical_label;
        appliedTaxonomy = `${cityRecord.name}/${taxonomyMapping.model_label}`;
        
        logger.info('Taxonomy mapping applied', {
          requestId,
          city: cityRecord.name,
          modelLabel: finalResult.label,
          canonicalLabel,
          action,
        });
      } else {
        logger.warn('No taxonomy mapping found', {
          requestId,
          city: cityRecord.name,
          label: finalResult.label,
        });
      }

      // Save prediction to database
      const predictionId = await db.insertPrediction({
        cityId: cityRecord.id,
        userId: userId || null,
        imagePath: savedImage.savedPath,
        audioPath: savedAudio ? savedAudio.savedPath : null,
        predictedLabel: finalResult.label,
        confidence: finalResult.confidence,
        rawModelResponse: imageResult.raw,
        appliedTaxonomy,
        modelVersion: process.env.HF_IMAGE_MODEL || 'v1',
      });

      logger.info('Prediction saved successfully', {
        requestId,
        predictionId,
        label: canonicalLabel,
        confidence: finalResult.confidence,
      });

      // Build response
      const response = {
        status: 'ok',
        data: {
          predictionId,
          label: canonicalLabel,
          confidence: finalResult.confidence,
          action,
          appliedTaxonomy,
          city: cityRecord.name,
          multimodal: finalResult.multimodal || false,
          imageUrl: savedImage.url,
        },
      };

      // Include audio metadata if available
      if (audioTranscription) {
        response.data.audio = {
          transcription: audioTranscription.text,
          keywords: finalResult.audioKeywords,
        };
      }

      // Include alternative predictions if confidence is low
      if (finalResult.confidence < 0.7 && imageResult.raw && imageResult.raw.length > 1) {
        response.data.alternatives = imageResult.raw
          .slice(1, 3)
          .map((alt) => ({
            label: hfService.normalizeLabel(alt.label),
            score: alt.score,
          }));
      }

      res.status(200).json(response);
    } catch (error) {
      logger.error('Classification failed', {
        requestId,
        error: error.message,
        stack: error.stack,
      });

      // Clean up uploaded files on error
      try {
        if (imageFile) await storageService.deleteFile(imageFile.filename);
        if (audioFile) await storageService.deleteFile(audioFile.filename);
      } catch (cleanupError) {
        logger.error('Failed to cleanup files after error', {
          error: cleanupError.message,
        });
      }

      res.status(500).json({
        error: true,
        message: 'Classification failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request',
      });
    }
  })
);

module.exports = router;
