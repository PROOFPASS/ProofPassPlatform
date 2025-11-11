/**
 * Jest Global Setup
 * Runs before all tests
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_NAME = 'proofpass_test';
process.env.DATABASE_USER = 'test_user';
process.env.DATABASE_PASSWORD = 'test_password';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.API_KEY_SALT = 'test-api-key-salt-for-testing';
process.env.STELLAR_NETWORK = 'testnet';
process.env.STELLAR_SECRET_KEY = 'STEST';
process.env.STELLAR_PUBLIC_KEY = 'GTEST';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.LOG_LEVEL = 'silent'; // Suppress logs during tests

// Global test timeout
jest.setTimeout(30000);

// Suppress console during tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
