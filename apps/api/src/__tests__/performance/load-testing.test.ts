/**
 * Performance Tests: Load Testing & Scalability
 */

import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { mockQuery, resetMocks, mockDBResponse } from '../helpers/database';

jest.mock('../../config/database', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$mocked_hash'),
  compare: jest.fn().mockResolvedValue(true),
}));

import { buildApp } from '../../app';

describe('Load Testing & Scalability', () => {
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
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 100 concurrent health check requests', async () => {
      const concurrentRequests = 100;
      const requests = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(request.get('/api/v1/health'));
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      expect(responses.every(r => r.status === 200)).toBe(true);

      // Should complete within reasonable time (< 5 seconds for 100 requests)
      expect(duration).toBeLessThan(5000);

      console.log(`✓ Handled ${concurrentRequests} concurrent requests in ${duration}ms`);
    });

    it('should handle 50 concurrent authenticated requests', async () => {
      // Mock admin login
      mockDBResponse([{
        id: 'admin-1',
        email: 'admin@proofpass.co',
        password_hash: '$2b$10$hash',
        role: 'admin',
      }]);

      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send({ email: 'admin@proofpass.co', password: 'admin123' });

      const authToken = loginResponse.body.token;

      const concurrentRequests = 50;
      const requests = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        mockDBResponse([{ total: '0' }]);
        mockDBResponse([]);

        requests.push(
          request
            .get('/api/v1/admin/organizations')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = responses.filter(r => r.status === 200).length;

      expect(successCount).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10000);

      console.log(`✓ ${successCount}/${concurrentRequests} authenticated requests succeeded in ${duration}ms`);
    });

    it('should handle 100 concurrent API key authenticated requests', async () => {
      const concurrentRequests = 100;
      const requests = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        mockDBResponse([{
          id: 'key-123',
          key_hash: '$2b$10$hash',
          is_active: true,
          org_id: 'org-123',
          requests_per_day: 10000,
        }]);
        mockDBResponse([{ count: String(i) }]);
        mockDBResponse([{ status: 'operational' }]);

        requests.push(
          request
            .get('/api/v1/blockchain/status')
            .set('X-API-Key', 'pk_live_test123')
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = responses.filter(r => r.status === 200).length;

      expect(successCount).toBeGreaterThan(0);
      expect(duration).toBeLessThan(15000);

      console.log(`✓ ${successCount}/${concurrentRequests} API key requests succeeded in ${duration}ms`);
    });
  });

  describe('Response Time Benchmarks', () => {
    it('should respond to health check in < 50ms', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        const response = await request.get('/api/v1/health');
        const end = Date.now();

        times.push(end - start);
        expect(response.status).toBe(200);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(avgTime).toBeLessThan(50);
      expect(maxTime).toBeLessThan(100);

      console.log(`✓ Health check avg: ${avgTime.toFixed(2)}ms, max: ${maxTime}ms`);
    });

    it('should complete authenticated list operations in < 500ms', async () => {
      mockDBResponse([{
        id: 'admin-1',
        email: 'admin@proofpass.co',
        password_hash: '$2b$10$hash',
        role: 'admin',
      }]);

      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send({ email: 'admin@proofpass.co', password: 'admin123' });

      const authToken = loginResponse.body.token;

      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        mockDBResponse([{ total: '100' }]);
        mockDBResponse([
          { id: 'org-1', name: 'Org 1' },
          { id: 'org-2', name: 'Org 2' },
        ]);

        const start = Date.now();
        const response = await request
          .get('/api/v1/admin/organizations')
          .set('Authorization', `Bearer ${authToken}`);
        const end = Date.now();

        times.push(end - start);
        expect(response.status).toBe(200);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      expect(avgTime).toBeLessThan(500);

      console.log(`✓ List operations avg: ${avgTime.toFixed(2)}ms`);
    });

    it('should complete API key authentication in < 200ms', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        mockDBResponse([{
          id: 'key-123',
          key_hash: '$2b$10$hash',
          is_active: true,
          org_id: 'org-123',
          requests_per_day: 10000,
        }]);
        mockDBResponse([{ count: String(i) }]);
        mockDBResponse([{ status: 'operational' }]);

        const start = Date.now();
        const response = await request
          .get('/api/v1/blockchain/status')
          .set('X-API-Key', 'pk_live_test123');
        const end = Date.now();

        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      expect(avgTime).toBeLessThan(200);

      console.log(`✓ API key auth avg: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Throughput Testing', () => {
    it('should handle 500 requests within 30 seconds', async () => {
      const totalRequests = 500;
      const requests = [];

      const startTime = Date.now();

      for (let i = 0; i < totalRequests; i++) {
        requests.push(request.get('/api/v1/health'));
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = responses.filter(r => r.status === 200).length;
      const throughput = (successCount / duration) * 1000; // requests per second

      expect(successCount).toBe(totalRequests);
      expect(duration).toBeLessThan(30000);

      console.log(`✓ Throughput: ${throughput.toFixed(2)} req/s (${totalRequests} in ${duration}ms)`);
    });
  });

  describe('Database Query Performance', () => {
    it('should efficiently handle paginated queries', async () => {
      mockDBResponse([{
        id: 'admin-1',
        email: 'admin@proofpass.co',
        password_hash: '$2b$10$hash',
        role: 'admin',
      }]);

      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send({ email: 'admin@proofpass.co', password: 'admin123' });

      const authToken = loginResponse.body.token;

      // Simulate large dataset
      mockDBResponse([{ total: '10000' }]);
      mockDBResponse(
        Array.from({ length: 100 }, (_, i) => ({
          id: `org-${i}`,
          name: `Organization ${i}`,
        }))
      );

      const start = Date.now();
      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 100, offset: 0 });
      const end = Date.now();

      expect(response.status).toBe(200);
      expect(response.body.organizations).toHaveLength(100);

      const duration = end - start;
      expect(duration).toBeLessThan(1000);

      console.log(`✓ Paginated query (100 items) completed in ${duration}ms`);
    });

    it('should handle complex filtered queries efficiently', async () => {
      mockDBResponse([{
        id: 'admin-1',
        email: 'admin@proofpass.co',
        password_hash: '$2b$10$hash',
        role: 'admin',
      }]);

      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send({ email: 'admin@proofpass.co', password: 'admin123' });

      const authToken = loginResponse.body.token;

      mockDBResponse([{ total: '50' }]);
      mockDBResponse([
        { id: 'org-1', status: 'active', plan: 'pro' },
      ]);

      const start = Date.now();
      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'active', plan: 'pro', search: 'test' });
      const end = Date.now();

      expect(response.status).toBe(200);

      const duration = end - start;
      expect(duration).toBeLessThan(800);

      console.log(`✓ Filtered query completed in ${duration}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory on repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make 1000 requests
      for (let i = 0; i < 1000; i++) {
        await request.get('/api/v1/health');

        // Force garbage collection every 100 requests if available
        if (i % 100 === 0 && global.gc) {
          global.gc();
        }
      }

      // Force final garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be reasonable (< 50MB for 1000 requests)
      expect(memoryIncreaseMB).toBeLessThan(50);

      console.log(`✓ Memory increase: ${memoryIncreaseMB.toFixed(2)}MB after 1000 requests`);
    });
  });

  describe('Error Handling Under Load', () => {
    it('should gracefully handle errors during high load', async () => {
      const requests = [];

      // Mix of valid and invalid requests
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          // Valid request
          requests.push(request.get('/api/v1/health'));
        } else {
          // Invalid request
          requests.push(request.get('/api/v1/nonexistent'));
        }
      }

      const responses = await Promise.all(requests);

      const successCount = responses.filter(r => r.status === 200).length;
      const notFoundCount = responses.filter(r => r.status === 404).length;

      expect(successCount).toBe(50);
      expect(notFoundCount).toBe(50);

      // No server errors (500)
      const serverErrorCount = responses.filter(r => r.status >= 500).length;
      expect(serverErrorCount).toBe(0);

      console.log(`✓ Handled ${responses.length} mixed requests without server errors`);
    });
  });

  describe('Burst Traffic Handling', () => {
    it('should handle sudden burst of 200 requests', async () => {
      const burstSize = 200;
      const requests = [];

      const startTime = Date.now();

      // Send all requests simultaneously
      for (let i = 0; i < burstSize; i++) {
        requests.push(request.get('/api/v1/health'));
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = responses.filter(r => r.status === 200).length;

      // Most should succeed (some may be rate limited)
      expect(successCount).toBeGreaterThan(burstSize * 0.8); // At least 80%
      expect(duration).toBeLessThan(10000); // Within 10 seconds

      console.log(`✓ Burst traffic: ${successCount}/${burstSize} succeeded in ${duration}ms`);
    });
  });
});
