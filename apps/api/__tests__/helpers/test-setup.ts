/**
 * Global Test Setup
 * Common setup and teardown for all tests
 */

import { resetFactoryCounters } from './factories';
import { resetAllMocks } from './mock-helpers';

/**
 * Setup before each test
 */
export function setupTest(): void {
  // Reset all factories
  resetFactoryCounters();

  // Reset all mocks
  resetAllMocks();

  // Set test environment
  process.env.NODE_ENV = 'test';
}

/**
 * Cleanup after each test
 */
export function cleanupTest(): void {
  // Clear all timers
  jest.clearAllTimers();

  // Clear all mocks
  jest.clearAllMocks();
}

/**
 * Setup for integration tests with database
 */
export async function setupIntegrationTest(): Promise<void> {
  setupTest();
  // Additional integration test setup can go here
}

/**
 * Cleanup for integration tests
 */
export async function cleanupIntegrationTest(): Promise<void> {
  cleanupTest();
  // Additional integration test cleanup can go here
}
