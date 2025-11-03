require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;

const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestId, logRequest } = require('./middleware/requestLogger');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const classifyRoutes = require('./routes/classify');
const feedbackRoutes = require('./routes/feedback');

// Validate required environment variables
const requiredEnvVars = ['HF_API_TOKEN', 'ADMIN_API_KEY'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  logger.error('Please check your .env file. See .env.example for reference.');
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (important for rate limiting and IP detection behind reverse proxies)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'x-request-id'],
  exposedHeaders: ['X-Request-Id'],
  credentials: true,
};
app.use(cors(corsOptions));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID and logging middleware
app.use(requestId);
app.use(logRequest);

// HTTP request logging with Morgan
app.use(
  morgan('combined', {
    stream: logger.stream,
    skip: (req) => req.path === '/health', // Skip health check logs
  })
);

// Rate limiting (applied globally)
app.use(generalLimiter);

// Serve static uploads directory
const uploadsPath = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/classify', classifyRoutes);
app.use('/feedback', feedbackRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Initialize server and required directories
 */
async function initializeServer() {
  try {
    // Create necessary directories
    const directories = [
      process.env.UPLOAD_DIR || './uploads',
      './uploads/temp',
      process.env.LOG_DIR || './logs',
      './db',
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
      logger.info(`Ensured directory exists: ${dir}`);
    }

    // Run database migrations
    const db = require('./db/database');
    await db.runMigrations();
    logger.info('Database migrations completed');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 EcoSort SmartWaste Backend started`);
      logger.info(`📡 Server listening on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`💾 Database: ${process.env.DB_PATH || './db/ecosort.sqlite'}`);
      logger.info(`🔐 Admin API key configured: ${!!process.env.ADMIN_API_KEY}`);
      logger.info(`🤖 Hugging Face API configured: ${!!process.env.HF_API_TOKEN}`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close database connections
          await db.closeConnection();
          logger.info('Database connections closed');
          
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error: error.message });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions and rejections
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason,
        promise,
      });
    });

  } catch (error) {
    logger.error('Failed to initialize server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  initializeServer();
}

module.exports = app; // Export for testing
