const admin = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp = null;
let db = null;

/**
 * Initialize Firebase Admin SDK
 * @returns {boolean} True if initialized successfully
 */
function initializeFirebase() {
  try {
    if (process.env.USE_FIREBASE !== 'true') {
      logger.info('Firebase is disabled');
      return false;
    }

    if (firebaseApp) {
      logger.info('Firebase already initialized');
      return true;
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountPath) {
      logger.error('FIREBASE_SERVICE_ACCOUNT path not provided');
      return false;
    }

    const serviceAccount = require(serviceAccountPath);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    db = admin.firestore();
    
    logger.info('Firebase initialized successfully', {
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    return true;
  } catch (error) {
    logger.error('Failed to initialize Firebase', {
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Save feedback to Firestore
 * @param {Object} feedbackData - Feedback data
 * @returns {Promise<string>} Document ID
 */
async function saveFeedbackToFirestore(feedbackData) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const docRef = await db.collection('feedback').add({
      ...feedbackData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      resolved: false,
    });

    logger.info('Feedback saved to Firestore', { docId: docRef.id });
    return docRef.id;
  } catch (error) {
    logger.error('Failed to save feedback to Firestore', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get feedback from Firestore with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} Feedback documents
 */
async function getFeedbackFromFirestore(filters = {}) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    let query = db.collection('feedback');

    if (filters.city) {
      query = query.where('city', '==', filters.city);
    }

    if (filters.resolved !== undefined) {
      query = query.where('resolved', '==', filters.resolved);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const feedback = [];

    snapshot.forEach((doc) => {
      feedback.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return feedback;
  } catch (error) {
    logger.error('Failed to get feedback from Firestore', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Update feedback resolved status in Firestore
 * @param {string} docId - Document ID
 * @param {boolean} resolved - Resolved status
 * @returns {Promise<void>}
 */
async function updateFeedbackResolvedInFirestore(docId, resolved) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await db.collection('feedback').doc(docId).update({
      resolved,
      resolvedAt: resolved ? admin.firestore.FieldValue.serverTimestamp() : null,
    });

    logger.info('Feedback resolved status updated in Firestore', {
      docId,
      resolved,
    });
  } catch (error) {
    logger.error('Failed to update feedback in Firestore', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Check if Firebase is enabled and initialized
 * @returns {boolean} True if Firebase is ready
 */
function isFirebaseEnabled() {
  return firebaseApp !== null && db !== null;
}

module.exports = {
  initializeFirebase,
  saveFeedbackToFirestore,
  getFeedbackFromFirestore,
  updateFeedbackResolvedInFirestore,
  isFirebaseEnabled,
};
