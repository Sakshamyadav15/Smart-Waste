// Jest setup file
// Run before all tests

const fs = require('fs');
const path = require('path');

// Create test database directory
const testDbDir = path.join(__dirname, '../db');
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}

// Create test uploads directory
const testUploadsDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(testUploadsDir)) {
  fs.mkdirSync(testUploadsDir, { recursive: true });
}

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.DB_PATH = './db/test-ecosort.sqlite';
process.env.HF_API_TOKEN = 'test-token';
process.env.ADMIN_API_KEY = 'test-admin-key';
process.env.USE_FIREBASE = 'false';
process.env.LOG_LEVEL = 'error';

// Suppress console logs during tests
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
