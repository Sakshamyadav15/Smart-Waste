const knex = require('knex');
const knexConfig = require('../knexfile');
const logger = require('../utils/logger');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Create knex instance
const db = knex(config);

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    await db.migrate.latest();
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Database migration failed', { error: error.message });
    throw error;
  }
}

/**
 * Rollback last migration batch
 */
async function rollbackMigration() {
  try {
    await db.migrate.rollback();
    logger.info('Database rollback completed successfully');
  } catch (error) {
    logger.error('Database rollback failed', { error: error.message });
    throw error;
  }
}

/**
 * Close database connection
 */
async function closeConnection() {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Failed to close database connection', { error: error.message });
    throw error;
  }
}

// ============ CITIES ============

/**
 * Get all cities
 * @returns {Promise<Array>} Array of city objects
 */
async function getCities() {
  return db('cities').select('*').orderBy('name');
}

/**
 * Get city by code
 * @param {string} code - City code (e.g., 'BLR', 'DEL')
 * @returns {Promise<Object|null>} City object or null
 */
async function getCityByCode(code) {
  return db('cities').where({ code: code.toUpperCase() }).first();
}

/**
 * Get city by name
 * @param {string} name - City name
 * @returns {Promise<Object|null>} City object or null
 */
async function getCityByName(name) {
  return db('cities')
    .where(db.raw('LOWER(name) = ?', [name.toLowerCase()]))
    .first();
}

// ============ PREDICTIONS ============

/**
 * Insert a new prediction record
 * @param {Object} predictionData - Prediction data
 * @returns {Promise<number>} Inserted prediction ID
 */
async function insertPrediction(predictionData) {
  const [id] = await db('predictions').insert({
    city_id: predictionData.cityId,
    user_id: predictionData.userId || null,
    image_path: predictionData.imagePath,
    audio_path: predictionData.audioPath || null,
    predicted_label: predictionData.predictedLabel,
    confidence: predictionData.confidence,
    raw_model_response: JSON.stringify(predictionData.rawModelResponse),
    applied_taxonomy: predictionData.appliedTaxonomy || null,
    model_version: predictionData.modelVersion || 'v1',
  });
  return id;
}

/**
 * Get prediction by ID
 * @param {number} id - Prediction ID
 * @returns {Promise<Object|null>} Prediction object or null
 */
async function getPredictionById(id) {
  const prediction = await db('predictions')
    .where({ id })
    .first();
  
  if (prediction && prediction.raw_model_response) {
    try {
      prediction.raw_model_response = JSON.parse(prediction.raw_model_response);
    } catch (error) {
      logger.warn(`Failed to parse raw_model_response for prediction ${id}`);
    }
  }
  
  return prediction;
}

/**
 * Update prediction to mark that feedback exists
 * @param {number} id - Prediction ID
 * @param {number} feedbackId - Feedback ID
 * @returns {Promise<number>} Number of rows updated
 */
async function markPredictionHasFeedback(id, feedbackId) {
  return db('predictions')
    .where({ id })
    .update({
      has_feedback: true,
      feedback_id: feedbackId,
    });
}

/**
 * Get predictions with filters and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated results
 */
async function getPredictions(options = {}) {
  const {
    cityId,
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDir = 'desc',
  } = options;

  let query = db('predictions')
    .leftJoin('cities', 'predictions.city_id', 'cities.id')
    .select(
      'predictions.*',
      'cities.name as city_name',
      'cities.code as city_code'
    );

  if (cityId) {
    query = query.where('predictions.city_id', cityId);
  }

  const total = await query.clone().count('* as count').first();
  const predictions = await query
    .orderBy(orderBy, orderDir)
    .limit(limit)
    .offset(offset);

  return {
    data: predictions,
    total: total.count,
    limit,
    offset,
  };
}

// ============ FEEDBACK ============

/**
 * Insert a new feedback record
 * @param {Object} feedbackData - Feedback data
 * @returns {Promise<number>} Inserted feedback ID
 */
async function insertFeedback(feedbackData) {
  const [id] = await db('feedback').insert({
    prediction_id: feedbackData.predictionId || null,
    original_label: feedbackData.originalLabel,
    correct_label: feedbackData.correctLabel,
    confidence: feedbackData.confidence || null,
    city: feedbackData.city,
    notes: feedbackData.notes || null,
    user_email: feedbackData.userEmail || null,
    resolved: false,
  });
  return id;
}

/**
 * Get feedback by ID
 * @param {number} id - Feedback ID
 * @returns {Promise<Object|null>} Feedback object or null
 */
async function getFeedbackById(id) {
  return db('feedback').where({ id }).first();
}

/**
 * Get feedback with filters and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated results
 */
async function getFeedback(options = {}) {
  const {
    city,
    resolved,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDir = 'desc',
  } = options;

  let query = db('feedback').select('*');

  if (city) {
    query = query.where(db.raw('LOWER(city) = ?', [city.toLowerCase()]));
  }

  if (resolved !== undefined) {
    query = query.where({ resolved: resolved ? 1 : 0 });
  }

  if (startDate) {
    query = query.where('created_at', '>=', startDate);
  }

  if (endDate) {
    query = query.where('created_at', '<=', endDate);
  }

  const total = await query.clone().count('* as count').first();
  const feedback = await query
    .orderBy(orderBy, orderDir)
    .limit(limit)
    .offset(offset);

  return {
    data: feedback,
    total: total.count,
    limit,
    offset,
  };
}

/**
 * Update feedback resolved status
 * @param {number} id - Feedback ID
 * @param {boolean} resolved - Resolved status
 * @returns {Promise<number>} Number of rows updated
 */
async function updateFeedbackResolved(id, resolved) {
  return db('feedback')
    .where({ id })
    .update({ resolved: resolved ? 1 : 0 });
}

// ============ TAXONOMY MAPPINGS ============

/**
 * Get taxonomy mappings for a city
 * @param {number} cityId - City ID
 * @returns {Promise<Array>} Array of taxonomy mapping objects
 */
async function getTaxonomyForCity(cityId) {
  return db('taxonomy_mappings')
    .where({ city_id: cityId })
    .select('*');
}

/**
 * Get specific taxonomy mapping
 * @param {number} cityId - City ID
 * @param {string} modelLabel - Model label
 * @returns {Promise<Object|null>} Taxonomy mapping or null
 */
async function getTaxonomyMapping(cityId, modelLabel) {
  // Try exact match first
  let mapping = await db('taxonomy_mappings')
    .where({
      city_id: cityId,
      model_label: modelLabel.toLowerCase(),
    })
    .first();

  if (mapping) return mapping;

  // Fallback: Try fuzzy matching for common waste items
  const label = modelLabel.toLowerCase();
  const wasteKeywords = {
    plastic: ['bottle', 'bag', 'container', 'cup', 'straw', 'wrapper', 'packaging', 'plastic'],
    paper: ['paper', 'cardboard', 'newspaper', 'magazine', 'book', 'document'],
    organic: ['food', 'fruit', 'vegetable', 'banana', 'apple', 'orange', 'organic', 'compost', 'plate'],
    glass: ['glass', 'jar', 'bottle_glass', 'wine'],
    metal: ['can', 'tin', 'aluminum', 'metal', 'foil'],
    e_waste: ['phone', 'computer', 'electronic', 'battery', 'cable', 'charger'],
    textile: ['cloth', 'fabric', 'clothes', 'shirt', 'pants', 'textile'],
  };

  for (const [wasteType, keywords] of Object.entries(wasteKeywords)) {
    if (keywords.some(keyword => label.includes(keyword))) {
      // Look for this waste type mapping
      mapping = await db('taxonomy_mappings')
        .where({ city_id: cityId })
        .whereRaw('LOWER(canonical_label) = ?', [wasteType])
        .first();
      
      if (mapping) {
        logger.info('Fuzzy matched taxonomy', { 
          modelLabel, 
          matched: wasteType,
          cityId 
        });
        return mapping;
      }
    }
  }

  // Ultimate fallback: Return a generic mapping
  logger.warn('No taxonomy match found, using generic', { modelLabel, cityId });
  return {
    canonical_label: 'general',
    action_text: 'Check with local waste management for proper disposal',
    model_label: modelLabel,
    city_id: cityId,
    isFallback: true,
  };
}

/**
 * Upsert taxonomy mapping
 * @param {Object} mappingData - Mapping data
 * @returns {Promise<number>} Inserted or updated mapping ID
 */
async function upsertTaxonomyMapping(mappingData) {
  const existing = await getTaxonomyMapping(
    mappingData.cityId,
    mappingData.modelLabel
  );

  if (existing) {
    await db('taxonomy_mappings')
      .where({ id: existing.id })
      .update({
        canonical_label: mappingData.canonicalLabel,
        action_text: mappingData.actionText,
      });
    return existing.id;
  }

  const [id] = await db('taxonomy_mappings').insert({
    city_id: mappingData.cityId,
    model_label: mappingData.modelLabel.toLowerCase(),
    canonical_label: mappingData.canonicalLabel,
    action_text: mappingData.actionText,
  });
  return id;
}

module.exports = {
  db,
  runMigrations,
  rollbackMigration,
  closeConnection,
  // Cities
  getCities,
  getCityByCode,
  getCityByName,
  // Predictions
  insertPrediction,
  getPredictionById,
  markPredictionHasFeedback,
  getPredictions,
  // Feedback
  insertFeedback,
  getFeedbackById,
  getFeedback,
  updateFeedbackResolved,
  // Taxonomy
  getTaxonomyForCity,
  getTaxonomyMapping,
  upsertTaxonomyMapping,
};
