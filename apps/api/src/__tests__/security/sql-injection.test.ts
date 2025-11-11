/**
 * Security Tests: SQL Injection Prevention
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

import { buildApp } from '../../app';

describe('SQL Injection Security Tests', () => {
  let app: FastifyInstance;
  let request: any;
  let authToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    request = supertest(app.server);

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

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('Query Parameter SQL Injection', () => {
    it('should prevent SQL injection in organization ID', async () => {
      const maliciousId = "org-123' OR '1'='1";

      mockDBResponse([]);

      const response = await request
        .get(`/api/v1/admin/organizations/${maliciousId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should return 404 (not found) or 400 (validation error), not internal server error
      expect([400, 404]).toContain(response.status);
      expect(response.body.error).toBeDefined();

      // Verify the query was called with parameterized query, not string interpolation
      if (mockQuery.mock.calls.length > 0) {
        const [query, params] = mockQuery.mock.calls[0];
        expect(query).not.toContain(maliciousId);
        expect(params).toBeDefined();
      }
    });

    it('should prevent SQL injection in search parameters', async () => {
      const maliciousSearch = "'; DROP TABLE organizations; --";

      mockDBResponse([{ total: '0' }]);
      mockDBResponse([]);

      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: maliciousSearch });

      expect(response.status).toBe(200);

      // Verify parameterized queries were used
      if (mockQuery.mock.calls.length > 0) {
        const [query, params] = mockQuery.mock.calls[0];
        expect(query).not.toContain('DROP TABLE');
        expect(params).toBeDefined();
      }
    });

    it('should prevent SQL injection in filter parameters', async () => {
      const maliciousStatus = "active' UNION SELECT * FROM users WHERE '1'='1";

      mockDBResponse([{ total: '0' }]);
      mockDBResponse([]);

      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: maliciousStatus });

      expect([200, 400]).toContain(response.status);

      // Verify no UNION attacks in query
      if (mockQuery.mock.calls.length > 0) {
        const [query] = mockQuery.mock.calls[0];
        expect(query).not.toContain('UNION SELECT');
      }
    });
  });

  describe('Request Body SQL Injection', () => {
    it('should prevent SQL injection in organization name', async () => {
      const maliciousName = "'; DROP TABLE organizations; --";

      const response = await request
        .post('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: maliciousName,
          email: 'test@org.com',
        });

      // Should either validate and reject, or safely store the malicious string as data
      if (response.status === 201) {
        // If created, verify it was parameterized
        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO organizations'),
          expect.arrayContaining([maliciousName])
        );
      } else {
        // Or should reject with validation error
        expect([400, 422]).toContain(response.status);
      }
    });

    it('should prevent SQL injection in update fields', async () => {
      const maliciousEmail = "test@example.com'; UPDATE organizations SET status='deleted'; --";

      mockDBResponse([{ id: 'org-123', billing_email: maliciousEmail }]);

      const response = await request
        .patch('/api/v1/admin/organizations/org-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          billing_email: maliciousEmail,
        });

      if (response.status === 200) {
        // Verify parameterized query
        const updateCall = mockQuery.mock.calls.find(([query]) =>
          query.includes('UPDATE organizations')
        );
        expect(updateCall).toBeDefined();
        expect(updateCall[1]).toContain(maliciousEmail);
      }
    });
  });

  describe('API Key SQL Injection', () => {
    it('should prevent SQL injection via API key header', async () => {
      const maliciousKey = "pk_live_test' OR '1'='1";

      const response = await request
        .get('/api/v1/blockchain/status')
        .set('X-API-Key', maliciousKey);

      // Should return authentication error, not internal server error
      expect(response.status).toBe(401);

      // Verify parameterized query if database was called
      if (mockQuery.mock.calls.length > 0) {
        const [query, params] = mockQuery.mock.calls[0];
        expect(params).toBeDefined();
        expect(params).toContain(maliciousKey);
      }
    });
  });

  describe('Time-Based Blind SQL Injection', () => {
    it('should not allow time-based attacks', async () => {
      const timeBasedPayload = "org-123'; WAITFOR DELAY '00:00:05'; --";

      const startTime = Date.now();

      mockDBResponse([]);

      await request
        .get(`/api/v1/admin/organizations/${timeBasedPayload}`)
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should not delay for 5 seconds - if it does, there's an SQL injection vulnerability
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Boolean-Based Blind SQL Injection', () => {
    it('should not leak data via boolean responses', async () => {
      const payload1 = "org-123' AND '1'='1";
      const payload2 = "org-123' AND '1'='2";

      mockDBResponse([]);

      const response1 = await request
        .get(`/api/v1/admin/organizations/${payload1}`)
        .set('Authorization', `Bearer ${authToken}`);

      mockDBResponse([]);

      const response2 = await request
        .get(`/api/v1/admin/organizations/${payload2}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Both should return same error (404 or 400), not different results based on SQL logic
      expect(response1.status).toBe(response2.status);
    });
  });

  describe('Second-Order SQL Injection', () => {
    it('should prevent stored malicious data from executing on retrieval', async () => {
      const maliciousNote = "'; DROP TABLE payments; --";

      // First, store malicious data
      mockDBResponse([{
        id: 'pay-123',
        notes: maliciousNote,
      }]);

      const createResponse = await request
        .post('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organization_id: 'org-123',
          amount: 99.00,
          currency: 'USD',
          payment_method: 'bank_transfer',
          notes: maliciousNote,
        });

      // Then retrieve it
      mockDBResponse([{
        id: 'pay-123',
        notes: maliciousNote,
      }]);

      const getResponse = await request
        .get('/api/v1/admin/payments/pay-123')
        .set('Authorization', `Bearer ${authToken}`);

      // Should safely return the stored string without executing it
      if (getResponse.status === 200) {
        expect(getResponse.body.notes).toBe(maliciousNote);

        // Verify no DROP TABLE was executed
        expect(mockQuery.mock.calls.every(([query]) =>
          !query.includes('DROP TABLE')
        )).toBe(true);
      }
    });
  });
});
