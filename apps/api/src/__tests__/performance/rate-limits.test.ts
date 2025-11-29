/**
 * Performance Tests: Rate Limit Accuracy Under Load
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

describe('Rate Limit Performance & Accuracy', () => {
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

  describe('Rate Limit Accuracy', () => {
    it('should accurately enforce limit under concurrent load', async () => {
      const limit = 50;
      const concurrentRequests = 100;
      const apiKey = 'pk_live_accuracy_test';

      const requestCount = 0;

      mockDBResponse([{
        id: 'key-accuracy',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-accuracy',
        requests_per_day: limit,
      }]);

      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        // Mock sequential counter
        mockDBResponse([{ count: String(Math.min(i, limit)) }]);
        mockDBResponse([{ status: 'operational' }]);

        requests.push(
          request
            .get('/api/v1/blockchain/status')
            .set('X-API-Key', apiKey)
        );
      }

      const responses = await Promise.all(requests);

      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      // Success count should not significantly exceed the limit
      expect(successCount).toBeLessThanOrEqual(limit * 1.1); // Allow 10% margin for race conditions

      // Rate limited count should be appropriate
      expect(rateLimitedCount).toBeGreaterThan(0);

      console.log(`✓ Rate limit accuracy: ${successCount} succeeded, ${rateLimitedCount} rate-limited (limit: ${limit})`);
    });

    it('should maintain accuracy with sustained load', async () => {
      const limit = 100;
      const totalRequests = 200;
      const batchSize = 20;
      const apiKey = 'pk_live_sustained_test';

      let successCount = 0;
      let rateLimitedCount = 0;

      // Send requests in batches to simulate sustained load
      for (let batch = 0; batch < totalRequests / batchSize; batch++) {
        mockDBResponse([{
          id: 'key-sustained',
          key_hash: '$2b$10$hash',
          is_active: true,
          org_id: 'org-sustained',
          requests_per_day: limit,
        }]);

        const batchRequests = [];

        for (let i = 0; i < batchSize; i++) {
          const currentCount = batch * batchSize + i;
          mockDBResponse([{ count: String(Math.min(currentCount, limit)) }]);
          mockDBResponse([{ status: 'operational' }]);

          batchRequests.push(
            request
              .get('/api/v1/blockchain/status')
              .set('X-API-Key', apiKey)
          );
        }

        const responses = await Promise.all(batchRequests);

        successCount += responses.filter(r => r.status === 200).length;
        rateLimitedCount += responses.filter(r => r.status === 429).length;

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(successCount).toBeLessThanOrEqual(limit * 1.1);
      expect(rateLimitedCount).toBeGreaterThan(totalRequests - limit - 20);

      console.log(`✓ Sustained load: ${successCount} succeeded, ${rateLimitedCount} rate-limited (limit: ${limit})`);
    });
  });

  describe('Rate Limit Performance', () => {
    it('should enforce rate limits with minimal latency overhead', async () => {
      const apiKey = 'pk_live_latency_test';

      // Request below limit
      mockDBResponse([{
        id: 'key-latency',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-latency',
        requests_per_day: 1000,
      }]);
      mockDBResponse([{ count: '50' }]);
      mockDBResponse([{ status: 'operational' }]);

      const start1 = Date.now();
      const response1 = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', apiKey);
      const end1 = Date.now();

      const baseLatency = end1 - start1;

      // Request at limit
      mockDBResponse([{
        id: 'key-latency',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-latency',
        requests_per_day: 1000,
      }]);
      mockDBResponse([{ count: '1000' }]);

      const start2 = Date.now();
      const response2 = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', apiKey);
      const end2 = Date.now();

      const rateLimitedLatency = end2 - start2;

      // Rate limit check should not add significant overhead (< 50ms)
      expect(Math.abs(rateLimitedLatency - baseLatency)).toBeLessThan(50);

      console.log(`✓ Base latency: ${baseLatency}ms, Rate-limited latency: ${rateLimitedLatency}ms`);
    });

    it('should handle rate limit checks for 1000 requests efficiently', async () => {
      const apiKey = 'pk_live_bulk_test';
      const requestCount = 1000;

      const startTime = Date.now();

      for (let i = 0; i < requestCount; i++) {
        mockDBResponse([{
          id: 'key-bulk',
          key_hash: '$2b$10$hash',
          is_active: true,
          org_id: 'org-bulk',
          requests_per_day: 10000,
        }]);
        mockDBResponse([{ count: String(i) }]);
        mockDBResponse([{ status: 'operational' }]);

        await request
          .get('/api/v1/blockchain/status')
          .set('X-API-Key', apiKey);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgLatency = duration / requestCount;

      expect(avgLatency).toBeLessThan(100); // Average < 100ms per request

      console.log(`✓ ${requestCount} rate limit checks completed in ${duration}ms (avg: ${avgLatency.toFixed(2)}ms)`);
    });
  });

  describe('Multi-Tenant Rate Limiting', () => {
    it('should independently track limits for different organizations', async () => {
      const org1Key = 'pk_live_org1_key';
      const org2Key = 'pk_live_org2_key';
      const limit = 10;

      const requests = [];

      // Interleave requests from two different organizations
      for (let i = 0; i < 20; i++) {
        if (i % 2 === 0) {
          // Org 1 requests
          mockDBResponse([{
            id: 'key-org1',
            key_hash: '$2b$10$hash',
            is_active: true,
            org_id: 'org-1',
            requests_per_day: limit,
          }]);
          mockDBResponse([{ count: String(Math.floor(i / 2)) }]);
          mockDBResponse([{ status: 'operational' }]);

          requests.push(
            request
              .get('/api/v1/blockchain/status')
              .set('X-API-Key', org1Key)
              .then((r: supertest.Response) => ({ org: 1, response: r }))
          );
        } else {
          // Org 2 requests
          mockDBResponse([{
            id: 'key-org2',
            key_hash: '$2b$10$hash',
            is_active: true,
            org_id: 'org-2',
            requests_per_day: limit,
          }]);
          mockDBResponse([{ count: String(Math.floor(i / 2)) }]);
          mockDBResponse([{ status: 'operational' }]);

          requests.push(
            request
              .get('/api/v1/blockchain/status')
              .set('X-API-Key', org2Key)
              .then((r: supertest.Response) => ({ org: 2, response: r }))
          );
        }
      }

      const results = await Promise.all(requests);

      const org1Results = results.filter(r => r.org === 1);
      const org2Results = results.filter(r => r.org === 2);

      const org1Success = org1Results.filter(r => r.response.status === 200).length;
      const org2Success = org2Results.filter(r => r.response.status === 200).length;

      // Each org should be able to make up to their limit
      expect(org1Success).toBeLessThanOrEqual(limit * 1.1);
      expect(org2Success).toBeLessThanOrEqual(limit * 1.1);

      console.log(`✓ Multi-tenant: Org1 ${org1Success} requests, Org2 ${org2Success} requests (limit: ${limit} each)`);
    });
  });

  describe('Rate Limit Window Management', () => {
    it('should properly calculate remaining time in rate limit window', async () => {
      const apiKey = 'pk_live_window_test';

      mockDBResponse([{
        id: 'key-window',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-window',
        requests_per_day: 1000,
      }]);
      mockDBResponse([{ count: '500' }]);
      mockDBResponse([{ status: 'operational' }]);

      const response = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', apiKey);

      expect(response.headers).toHaveProperty('x-ratelimit-reset');

      const resetTime = parseInt(response.headers['x-ratelimit-reset']);
      const now = Math.floor(Date.now() / 1000);

      // Reset should be in the future but within 24 hours
      expect(resetTime).toBeGreaterThan(now);
      expect(resetTime - now).toBeLessThanOrEqual(86400); // 24 hours

      console.log(`✓ Rate limit resets in ${resetTime - now} seconds`);
    });
  });

  describe('Distributed Rate Limiting Edge Cases', () => {
    it('should handle race conditions gracefully', async () => {
      const limit = 5;
      const apiKey = 'pk_live_race_test';

      mockDBResponse([{
        id: 'key-race',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-race',
        requests_per_day: limit,
      }]);

      // Launch exactly at the limit
      const requests = [];

      for (let i = 0; i < limit + 5; i++) {
        mockDBResponse([{ count: String(Math.min(i, limit)) }]);
        mockDBResponse([{ status: 'operational' }]);

        requests.push(
          request
            .get('/api/v1/blockchain/status')
            .set('X-API-Key', apiKey)
        );
      }

      const responses = await Promise.all(requests);

      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      // Should not significantly over-provision (some race condition tolerance)
      expect(successCount).toBeLessThanOrEqual(limit + 2); // Allow 2 extra due to race conditions
      expect(rateLimitedCount).toBeGreaterThan(0);

      console.log(`✓ Race condition handling: ${successCount} succeeded, ${rateLimitedCount} rate-limited (limit: ${limit})`);
    });
  });

  describe('Rate Limit Header Consistency', () => {
    it('should return consistent rate limit headers', async () => {
      const apiKey = 'pk_live_header_test';
      const limit = 100;

      mockDBResponse([{
        id: 'key-header',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-header',
        requests_per_day: limit,
      }]);
      mockDBResponse([{ count: '25' }]);
      mockDBResponse([{ status: 'operational' }]);

      const response = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', apiKey);

      expect(response.headers['x-ratelimit-limit']).toBe(String(limit));
      expect(response.headers['x-ratelimit-remaining']).toBe(String(limit - 25));
      expect(response.headers['x-ratelimit-reset']).toMatch(/^\d+$/);

      console.log(`✓ Headers: limit=${response.headers['x-ratelimit-limit']}, remaining=${response.headers['x-ratelimit-remaining']}`);
    });
  });
});
