// Jest setup file
// Global test configuration

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.API_KEY_SALT = 'test-api-key-salt-for-testing-only';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_NAME = 'proofpass_test';
process.env.DATABASE_USER = 'postgres';
process.env.DATABASE_PASSWORD = 'postgres';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.LOG_LEVEL = 'silent';

// Mock console methods in tests if needed
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Increase timeout for integration tests
jest.setTimeout(10000);
