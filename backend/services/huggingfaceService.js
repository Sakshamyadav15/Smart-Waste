const axios = require('axios');
const logger = require('../utils/logger');

// Using updated Hugging Face Serverless Inference API
const HF_API_BASE = 'https://api-inference.huggingface.co/models';
const HF_API_TOKEN = process.env.HF_API_TOKEN;

// Fallback model chain - will try in order
// Using dedicated waste classification models first!
const IMAGE_MODELS = [
  'rootstrap-org/waste-classifier', // Dedicated waste classification model
  'microsoft/resnet-50', // Fast, reliable ResNet
  'google/vit-base-patch16-224', // Vision Transformer
];

const HF_IMAGE_MODEL = process.env.HF_IMAGE_MODEL || IMAGE_MODELS[0];
const HF_AUDIO_MODEL = process.env.HF_AUDIO_MODEL || 'openai/whisper-base';

// Retry configuration
const MAX_RETRIES = 2; // Reduced retries per model
const INITIAL_RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 15000; // Reduced to 15 seconds

// Offline fallback enabled when all models fail
const ENABLE_OFFLINE_FALLBACK = process.env.ENABLE_OFFLINE_FALLBACK !== 'false';

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-indexed)
 * @returns {number} Delay in milliseconds
 */
function getRetryDelay(attempt) {
  return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
}

/**
 * Normalize label string
 * Converts to lowercase and replaces spaces with underscores
 * @param {string} label - Raw label from model
 * @returns {string} Normalized label
 */
function normalizeLabel(label) {
  if (!label) return 'unknown';
  return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/**
 * Mock/offline classification for when all models fail
 * Returns generic waste classification based on simple heuristics
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {Object} Mock classification result
 */
function getMockClassification(imageBuffer) {
  // Simple size-based heuristic (better than nothing!)
  const size = imageBuffer.length;
  let label = 'general';
  let score = 0.5;

  if (size < 50000) {
    label = 'paper'; // Small files often paper/documents
    score = 0.6;
  } else if (size < 200000) {
    label = 'plastic'; // Medium files often plastic items
    score = 0.65;
  } else {
    label = 'organic'; // Large files often organic waste
    score = 0.55;
  }

  logger.warn('Using offline mock classification', { label, score, size });

  return {
    label,
    score,
    confidence: score, // Add confidence field for compatibility
    raw: [{ label, score }],
    isMock: true,
  };
}

/**
 * Make HTTP request to Hugging Face API with retry logic
 * @param {string} url - API endpoint URL
 * @param {Buffer} data - Request body (image or audio buffer)
 * @param {Object} headers - Request headers
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} API response
 */
async function makeHFRequest(url, data, headers, attempt = 0) {
  try {
    const response = await axios.post(url, data, {
      headers,
      timeout: TIMEOUT,
      validateStatus: (status) => status < 600, // Accept all responses to handle them
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Success
    if (response.status === 200) {
      return response.data;
    }

    // Model is loading (503)
    if (response.status === 503) {
      const estimatedTime = response.data?.estimated_time || 20;
      if (attempt < MAX_RETRIES) {
        const delay = Math.max(getRetryDelay(attempt), estimatedTime * 1000);
        logger.warn(`Model loading, waiting ${delay}ms`, {
          attempt: attempt + 1,
          estimatedTime,
        });
        await sleep(delay);
        return makeHFRequest(url, data, headers, attempt + 1);
      }
    }

    // Rate limit (429)
    if (response.status === 429) {
      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt) * 2; // Longer delay for rate limits
        logger.warn(`Rate limited, waiting ${delay}ms`, { attempt: attempt + 1 });
        await sleep(delay);
        return makeHFRequest(url, data, headers, attempt + 1);
      }
    }

    // All other errors
    throw new Error(
      `API returned status ${response.status}: ${
        typeof response.data === 'string' 
          ? response.data.substring(0, 200) 
          : JSON.stringify(response.data).substring(0, 200)
      }`
    );
  } catch (error) {
    // Network/timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        logger.warn(`Network error (${error.code}), retrying in ${delay}ms`, {
          attempt: attempt + 1,
        });
        await sleep(delay);
        return makeHFRequest(url, data, headers, attempt + 1);
      }
      throw new Error(`Network error after ${MAX_RETRIES} retries: ${error.code}`);
    }

    throw error;
  }
}

/**
 * Classify image using Hugging Face image classification model
 * Tries multiple models as fallback, with offline mode as last resort
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} requestId - Request ID for logging
 * @returns {Promise<Object>} Normalized classification result
 * @example
 * const result = await classifyImage(imageBuffer);
 * // Returns: { label: 'plastic', score: 0.85, raw: [...] }
 */
async function classifyImage(imageBuffer, requestId = 'unknown') {
  const errors = [];
  
  // Try primary model from env or first in list
  const modelsToTry = [HF_IMAGE_MODEL, ...IMAGE_MODELS.filter(m => m !== HF_IMAGE_MODEL)];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      logger.info(`Trying image classification with model ${i + 1}/${modelsToTry.length}`, {
        requestId,
        model,
        bufferSize: imageBuffer.length,
      });

      const url = `${HF_API_BASE}/${model}`;
      const headers = {
        Authorization: `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      };

      const rawResponse = await makeHFRequest(url, imageBuffer, headers);

      // Parse and normalize response
      if (!Array.isArray(rawResponse) || rawResponse.length === 0) {
        throw new Error('Invalid response format from classification model');
      }

      // Sort by score descending and take top result
      const sorted = rawResponse.sort((a, b) => b.score - a.score);
      const topResult = sorted[0];

      const normalized = {
        label: normalizeLabel(topResult.label),
        score: parseFloat(topResult.score),
        confidence: parseFloat(topResult.score), // Add confidence for compatibility
        raw: rawResponse,
        model, // Include which model succeeded
        isMock: false,
      };

      logger.info('Image classification successful', {
        requestId,
        model,
        label: normalized.label,
        score: normalized.score,
      });

      return normalized;
    } catch (error) {
      errors.push({ model, error: error.message });
      logger.warn(`Model ${model} failed, trying next...`, {
        requestId,
        error: error.message,
        modelsRemaining: modelsToTry.length - i - 1,
      });
    }
  }

  // All models failed - use offline fallback if enabled
  if (ENABLE_OFFLINE_FALLBACK) {
    logger.error('All models failed, using offline fallback', {
      requestId,
      errors,
    });
    return getMockClassification(imageBuffer);
  }

  // No fallback - throw error
  logger.error('Image classification completely failed', {
    requestId,
    errors,
  });
  throw new Error(
    `All classification models failed. Last error: ${errors[errors.length - 1]?.error || 'Unknown'}`
  );
}

/**
 * Transcribe audio using Hugging Face speech-to-text model
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} requestId - Request ID for logging
 * @returns {Promise<Object>} Transcription result
 * @example
 * const result = await transcribeAudio(audioBuffer);
 * // Returns: { text: 'plastic bottle', confidence: 0.92 }
 */
async function transcribeAudio(audioBuffer, requestId = 'unknown') {
  try {
    logger.info('Calling Hugging Face speech-to-text API', {
      requestId,
      model: HF_AUDIO_MODEL,
      bufferSize: audioBuffer.length,
    });

    const url = `${HF_API_BASE}/${HF_AUDIO_MODEL}`;
    const headers = {
      Authorization: `Bearer ${HF_API_TOKEN}`,
      'Content-Type': 'application/octet-stream',
    };

    const rawResponse = await makeHFRequest(url, audioBuffer, headers);

    // Whisper models typically return { text: "..." }
    if (!rawResponse || typeof rawResponse.text !== 'string') {
      logger.error('Unexpected Hugging Face audio response format', {
        requestId,
        response: rawResponse,
      });
      throw new Error('Invalid response format from audio model');
    }

    const result = {
      text: rawResponse.text.trim(),
      confidence: rawResponse.confidence || null,
    };

    logger.info('Audio transcription successful', {
      requestId,
      textLength: result.text.length,
    });

    return result;
  } catch (error) {
    logger.error('Audio transcription failed', {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

/**
 * Extract keywords from transcribed text that might match waste categories
 * @param {string} text - Transcribed text
 * @returns {Array<string>} Extracted keywords
 */
function extractWasteKeywords(text) {
  const keywords = [
    'plastic', 'bottle', 'wrapper', 'film', 'bag',
    'paper', 'cardboard', 'box',
    'glass', 'jar',
    'metal', 'can', 'aluminum',
    'organic', 'food', 'compost', 'vegetable', 'fruit',
    'battery', 'electronic', 'e-waste',
    'sanitary', 'diaper',
    'textile', 'cloth', 'fabric',
  ];

  const lowerText = text.toLowerCase();
  return keywords.filter((keyword) => lowerText.includes(keyword));
}

/**
 * Combine image and audio predictions for improved confidence
 * @param {Object} imageResult - Image classification result
 * @param {Object} audioResult - Audio transcription result
 * @param {number} imageWeight - Weight for image prediction (default 0.8)
 * @param {number} audioWeight - Weight for audio prediction (default 0.2)
 * @returns {Object} Combined prediction
 */
function combineMultimodalPredictions(
  imageResult,
  audioResult,
  imageWeight = 0.8,
  audioWeight = 0.2
) {
  const keywords = extractWasteKeywords(audioResult.text);
  
  let combinedConfidence = imageResult.score * imageWeight;
  let enhancementFactor = 0;

  // Check if audio keywords match image prediction
  const imageLabel = imageResult.label;
  const matchingKeywords = keywords.filter((keyword) =>
    imageLabel.includes(keyword) || keyword.includes(imageLabel)
  );

  if (matchingKeywords.length > 0) {
    // Boost confidence if audio confirms image prediction
    enhancementFactor = audioWeight * (matchingKeywords.length / keywords.length || 0.5);
    combinedConfidence = Math.min(combinedConfidence + enhancementFactor, 1.0);
    
    logger.info('Multimodal predictions aligned', {
      imageLabel,
      matchingKeywords,
      enhancementFactor,
      originalConfidence: imageResult.score,
      combinedConfidence,
    });
  }

  return {
    label: imageResult.label,
    confidence: combinedConfidence,
    multimodal: true,
    imageScore: imageResult.score,
    audioKeywords: keywords,
    audioText: audioResult.text,
  };
}

module.exports = {
  classifyImage,
  transcribeAudio,
  extractWasteKeywords,
  combineMultimodalPredictions,
  normalizeLabel,
};
