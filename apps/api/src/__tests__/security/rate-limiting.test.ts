/**
 * Security Tests: Rate Limiting
 */

import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { mockQuery, resetMocks, mockDBResponse } from '../helpers/database';
import * as bcrypt from 'bcrypt';

jest.mock('../../config/database', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn(),
  },
}));

jest.mock('bcrypt');

import { buildApp } from '../../app';

describe('Rate Limiting Security Tests', () => {
  let app: FastifyInstance;
  let request: any;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    request = supertest(app.server);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('Per-Plan Rate Limits', () => {
    it('should enforce Free plan rate limit (100/day)', async () => {
      const apiKey = 'pk_live_free_plan';

      // Mock API key lookup - Free plan
      mockDBResponse([{
        id: 'key-free',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-free',
        plan_name: 'Free',
        requests_per_day: 100,
      }]);

      // Mock usage at limit
      mockDBResponse([{ count: '100' }]);

      const response = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Rate limit exceeded');
      expect(response.body.limit).toBe(100);
    });

    it('should allow requests under Free plan limit', async () => {
      const apiKey = 'pk_live_free_plan';

      mockDBResponse([{
        id: 'key-free',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-free',
        plan_name: 'Free',
        requests_per_day: 100,
      }]);

      // Mock usage below limit
      mockDBResponse([{ count: '50' }]);

      // Mock blockchain status response
      mockDBResponse([{ status: 'operational' }]);

      const response = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', apiKey);

      expect(response.status).not.toBe(429);
      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(response.headers['x-ratelimit-remaining']).toBe('50');
    });

    it('should enforce Pro plan rate limit (10,000/day)', async () => {
      const apiKey = 'pk_live_pro_plan';

      mockDBResponse([{
        id: 'key-pro',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-pro',
        plan_name: 'Pro',
        requests_per_day: 10000,
      }]);

      // Mock usage at limit
      mockDBResponse([{ count: '10000' }]);

      const response = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', apiKey);

      expect(response.status).toBe(429);
      expect(response.body.limit).toBe(10000);
    });

    it('should allow unlimited requests for Enterprise plan', async () => {
      const apiKey = 'pk_live_enterprise_plan';

      mockDBResponse([{
        id: 'key-enterprise',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-enterprise',
        plan_name: 'Enterprise',
        requests_per_day: -1, // Unlimited
      }]);

      // Mock very high usage
      mockDBResponse([{ count: '999999' }]);

      // Mock response
      mockDBResponse([{ status: 'operational' }]);

      const response = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', apiKey);

      expect(response.status).not.toBe(429);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include rate limit headers in response', async () => {
      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-123',
        requests_per_day: 1000,
      }]);

      mockDBResponse([{ count: '250' }]);
      mockDBResponse([{ status: 'operational' }]);

      const response = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', 'pk_live_test123');

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');

      expect(response.headers['x-ratelimit-limit']).toBe('1000');
      expect(response.headers['x-ratelimit-remaining']).toBe('750');
    });

    it('should update remaining count on each request', async () => {
      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-123',
        requests_per_day: 100,
      }]);

      // First request
      mockDBResponse([{ count: '50' }]);
      mockDBResponse([{ status: 'operational' }]);

      const response1 = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', 'pk_live_test123');

      expect(response1.headers['x-ratelimit-remaining']).toBe('50');

      // Second request
      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-123',
        requests_per_day: 100,
      }]);

      mockDBResponse([{ count: '51' }]);
      mockDBResponse([{ status: 'operational' }]);

      const response2 = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', 'pk_live_test123');

      expect(response2.headers['x-ratelimit-remaining']).toBe('49');
    });
  });

  describe('Distributed Rate Limiting', () => {
    it('should handle concurrent requests correctly', async () => {
      const apiKey = 'pk_live_concurrent_test';

      mockDBResponse([{
        id: 'key-concurrent',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-concurrent',
        requests_per_day: 10,
      }]);

      // Simulate 15 concurrent requests
      const requests = [];
      for (let i = 0; i < 15; i++) {
        mockDBResponse([{ count: String(i) }]);
        mockDBResponse([{ status: 'operational' }]);

        requests.push(
          request
            .get('/api/v1/blockchain/status')
            .set('X-API-Key', apiKey)
        );
      }

      const responses = await Promise.all(requests);

      // Some should succeed (≤10) and some should be rate limited (>10)
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      expect(successCount).toBeLessThanOrEqual(10);
      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(successCount + rateLimitedCount).toBe(15);
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset rate limit after 24 hours', async () => {
      const apiKey = 'pk_live_reset_test';

      mockDBResponse([{
        id: 'key-reset',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-reset',
        requests_per_day: 100,
      }]);

      mockDBResponse([{ count: '50' }]);
      mockDBResponse([{ status: 'operational' }]);

      const response = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', apiKey);

      const resetTime = parseInt(response.headers['x-ratelimit-reset']);
      const now = Math.floor(Date.now() / 1000);
      const twentyFourHours = 24 * 60 * 60;

      // Reset time should be approximately 24 hours from now
      expect(resetTime).toBeGreaterThan(now);
      expect(resetTime).toBeLessThanOrEqual(now + twentyFourHours);
    });
  });

  describe('Endpoint-Specific Limits', () => {
    it('should apply higher costs to blockchain operations', async () => {
      const apiKey = 'pk_live_blockchain_test';

      mockDBResponse([{
        id: 'key-blockchain',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-blockchain',
        requests_per_day: 1000,
        blockchain_ops_per_month: 100,
      }]);

      // Mock monthly blockchain usage at limit
      mockDBResponse([{ count: '100' }]);

      const response = await request
        .post('/api/v1/blockchain/anchor')
        .set('X-API-Key', apiKey)
        .send({ data: 'test' });

      // Should be rate limited based on blockchain ops, not general requests
      expect(response.status).toBe(429);
      expect(response.body.error).toContain('blockchain operations');
    });
  });

  describe('Global Rate Limiting', () => {
    it('should enforce global endpoint rate limits', async () => {
      // Test global rate limit (e.g., 100 req/min per IP)
      const requests = [];

      for (let i = 0; i < 150; i++) {
        requests.push(
          request.get('/api/v1/health')
        );
      }

      const responses = await Promise.all(requests);

      // Some should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Rate Limit Bypass Prevention', () => {
    it('should not allow rate limit bypass with different API key headers', async () => {
      const apiKey = 'pk_live_bypass_test';

      mockDBResponse([{
        id: 'key-bypass',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-bypass',
        requests_per_day: 5,
      }]);

      // Try with X-API-Key
      mockDBResponse([{ count: '5' }]);

      const response1 = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', apiKey);

      expect(response1.status).toBe(429);

      // Try with different header format (should still be rate limited)
      mockDBResponse([{ count: '5' }]);

      const response2 = await request
        .get('/api/v1/blockchain/status')
        .set('Authorization', `Bearer ${apiKey}`); // Wrong auth type

      // Should still be rejected (wrong auth method or still rate limited)
      expect([401, 429]).toContain(response2.status);
    });

    it('should not reset rate limit on API key rotation', async () => {
      // This would require actual key rotation implementation
      // Test that rotating a key doesn't reset the organization's usage
      const orgId = 'org-no-reset';

      // Mock old key at limit
      mockDBResponse([{
        id: 'key-old',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: orgId,
        requests_per_day: 100,
      }]);

      mockDBResponse([{ count: '100' }]);

      const response1 = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', 'pk_live_old_key');

      expect(response1.status).toBe(429);

      // Mock new key (same org)
      mockDBResponse([{
        id: 'key-new',
        key_hash: '$2b$10$newhash',
        is_active: true,
        org_id: orgId,
        requests_per_day: 100,
      }]);

      // Usage should still be at limit (org-level tracking)
      mockDBResponse([{ count: '100' }]);

      const response2 = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', 'pk_live_new_key');

      // Should still be rate limited
      expect(response2.status).toBe(429);
    });
  });
});
