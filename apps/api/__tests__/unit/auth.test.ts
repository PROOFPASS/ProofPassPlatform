/**
 * Unit tests for authentication utilities
 * Tests password hashing, API key generation, and token verification
 */

import {
  hashPassword,
  comparePassword,
  generateApiKey,
  hashApiKey,
} from '../../src/utils/auth';

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should produce different hashes for same password (salt)', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
    });
  });

  describe('comparePassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await comparePassword('wrongPassword', hash);

      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      const isValid = await comparePassword('testpassword123', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('generateApiKey', () => {
    it('should generate an API key', () => {
      const apiKey = generateApiKey();

      expect(apiKey).toBeDefined();
      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate unique keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();

      expect(key1).not.toBe(key2);
    });

    it('should generate hex string', () => {
      const apiKey = generateApiKey();
      expect(apiKey).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('hashApiKey', () => {
    it('should hash an API key with salt', async () => {
      const apiKey = generateApiKey();
      const salt = 'test-salt';
      const hash = await hashApiKey(apiKey, salt);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
    });

    it('should produce consistent hashes', async () => {
      const apiKey = generateApiKey();
      const salt = 'test-salt';
      const hash1 = await hashApiKey(apiKey, salt);
      const hash2 = await hashApiKey(apiKey, salt);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes with different salts', async () => {
      const apiKey = generateApiKey();
      const hash1 = await hashApiKey(apiKey, 'salt1');
      const hash2 = await hashApiKey(apiKey, 'salt2');

      expect(hash1).not.toBe(hash2);
    });
  });
});
