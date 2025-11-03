const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Generate unique filename with timestamp and random hash
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
  return `${baseName}-${timestamp}-${randomHash}${ext}`;
}

/**
 * Get storage path organized by date (YYYY/MM/DD)
 * @returns {string} Date-based path
 */
function getDateBasedPath() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return path.join(year.toString(), month, day);
}

/**
 * Ensure directory exists, create if needed
 * @param {string} dirPath - Directory path
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    logger.error('Failed to create directory', {
      dirPath,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Validate file extension against whitelist
 * @param {string} filename - Filename to validate
 * @param {Array<string>} allowedExtensions - Allowed extensions
 * @returns {boolean} True if valid
 */
function validateFileExtension(filename, allowedExtensions) {
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
}

/**
 * Save uploaded file to permanent storage
 * @param {Object} file - Multer file object
 * @param {string} fileType - Type of file ('image' or 'audio')
 * @returns {Promise<Object>} Saved file info
 * @example
 * const fileInfo = await saveFile(req.files.image[0], 'image');
 * // Returns: { path: 'uploads/2024/01/15/image-123.jpg', url: '/uploads/2024/01/15/image-123.jpg' }
 */
async function saveFile(file, fileType = 'image') {
  try {
    // Validate file extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const audioExtensions = ['.mp3', '.wav', '.wave'];
    const allowedExtensions = fileType === 'image' ? imageExtensions : audioExtensions;

    if (!validateFileExtension(file.originalname, allowedExtensions)) {
      throw new Error(`Invalid file extension for ${fileType}. Allowed: ${allowedExtensions.join(', ')}`);
    }

    // Generate unique filename and path
    const uniqueFilename = generateUniqueFilename(file.originalname);
    const datePath = getDateBasedPath();
    const relativePath = path.join(datePath, uniqueFilename);
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath);

    // Ensure directory exists
    await ensureDirectoryExists(path.dirname(fullPath));

    // Move file from temp to permanent location
    await fs.rename(file.path, fullPath);

    const fileInfo = {
      originalName: file.originalname,
      savedPath: relativePath,
      fullPath,
      url: `/${UPLOAD_BASE_DIR}/${relativePath}`.replace(/\\/g, '/'),
      mimeType: file.mimetype,
      size: file.size,
    };

    logger.info('File saved successfully', {
      originalName: file.originalname,
      savedPath: relativePath,
      size: file.size,
      type: fileType,
    });

    return fileInfo;
  } catch (error) {
    logger.error('Failed to save file', {
      originalName: file.originalname,
      error: error.message,
    });
    
    // Clean up temp file if it still exists
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      // Ignore if file doesn't exist
    }
    
    throw error;
  }
}

/**
 * Delete file from storage
 * @param {string} filePath - Relative file path to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteFile(filePath) {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, filePath);
    await fs.unlink(fullPath);
    
    logger.info('File deleted successfully', { filePath });
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn('File not found for deletion', { filePath });
      return false;
    }
    
    logger.error('Failed to delete file', {
      filePath,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get file buffer from saved file
 * @param {string} filePath - Relative file path
 * @returns {Promise<Buffer>} File buffer
 */
async function getFileBuffer(filePath) {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, filePath);
    return await fs.readFile(fullPath);
  } catch (error) {
    logger.error('Failed to read file buffer', {
      filePath,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Clean up old files (utility for maintenance)
 * @param {number} daysOld - Delete files older than this many days
 * @returns {Promise<number>} Number of files deleted
 */
async function cleanupOldFiles(daysOld = 30) {
  try {
    logger.info('Starting cleanup of old files', { daysOld });
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedCount = 0;
    
    async function scanDirectory(dirPath) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          if (stats.mtime < cutoffDate) {
            await fs.unlink(fullPath);
            deletedCount++;
            logger.debug('Deleted old file', { file: fullPath, mtime: stats.mtime });
          }
        }
      }
    }
    
    await scanDirectory(UPLOAD_BASE_DIR);
    
    logger.info('Cleanup completed', { deletedCount, daysOld });
    return deletedCount;
  } catch (error) {
    logger.error('Cleanup failed', { error: error.message });
    throw error;
  }
}

module.exports = {
  saveFile,
  deleteFile,
  getFileBuffer,
  cleanupOldFiles,
  generateUniqueFilename,
};
