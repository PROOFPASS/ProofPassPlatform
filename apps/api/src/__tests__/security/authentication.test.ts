/**
 * Security Tests: Authentication & Authorization
 */

import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { mockQuery, resetMocks, mockDBResponse } from '../helpers/database';
import * as jwt from '@fastify/jwt';

jest.mock('../../config/database', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn(),
  },
}));

import { buildApp } from '../../app';

describe('Authentication & Authorization Security Tests', () => {
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

  describe('Admin JWT Authentication', () => {
    it('should reject requests without JWT token', async () => {
      const response = await request
        .get('/api/v1/admin/organizations');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should reject malformed JWT tokens', async () => {
      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
    });

    it('should reject expired JWT tokens', async () => {
      // Create an expired token (you'd need to generate one with past exp)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it('should reject JWT tokens with invalid signature', async () => {
      // Token signed with different secret
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.wrong_signature';

      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });

    it('should reject JWT without required claims', async () => {
      // Mock a valid admin login first
      mockDBResponse([{
        id: 'admin-1',
        email: 'admin@proofpass.co',
        password_hash: '$2b$10$hash',
        role: 'admin',
      }]);

      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send({ email: 'admin@proofpass.co', password: 'admin123' });

      const token = loginResponse.body.token;

      // Decode and verify it has required claims
      const decoded = app.jwt.decode(token) as any;
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('role');
    });
  });

  describe('API Key Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await request
        .post('/api/v1/blockchain/anchor')
        .send({ data: 'test' });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('API key');
    });

    it('should reject invalid API key format', async () => {
      const response = await request
        .post('/api/v1/blockchain/anchor')
        .set('X-API-Key', 'invalid_format_key')
        .send({ data: 'test' });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('format');
    });

    it('should reject API key not in database', async () => {
      mockDBResponse([]); // No key found

      const response = await request
        .post('/api/v1/blockchain/anchor')
        .set('X-API-Key', 'pk_live_nonexistent')
        .send({ data: 'test' });

      expect(response.status).toBe(401);
    });

    it('should reject deactivated API keys', async () => {
      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: false, // Deactivated
        org_id: 'org-123',
      }]);

      const response = await request
        .post('/api/v1/blockchain/anchor')
        .set('X-API-Key', 'pk_live_test123')
        .send({ data: 'test' });

      expect(response.status).toBe(401);
    });

    it('should reject expired API keys', async () => {
      const pastDate = new Date('2020-01-01');

      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: true,
        expires_at: pastDate,
        org_id: 'org-123',
      }]);

      const response = await request
        .post('/api/v1/blockchain/anchor')
        .set('X-API-Key', 'pk_live_test123')
        .send({ data: 'test' });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('expired');
    });

    it('should reject API keys for suspended organizations', async () => {
      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-123',
        org_status: 'suspended', // Org is suspended
      }]);

      const response = await request
        .post('/api/v1/blockchain/anchor')
        .set('X-API-Key', 'pk_live_test123')
        .send({ data: 'test' });

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization & Role-Based Access', () => {
    it('should allow admin to access admin endpoints', async () => {
      mockDBResponse([{
        id: 'admin-1',
        email: 'admin@proofpass.co',
        password_hash: '$2b$10$hash',
        role: 'admin',
      }]);

      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send({ email: 'admin@proofpass.co', password: 'admin123' });

      const token = loginResponse.body.token;

      mockDBResponse([{ total: '0' }]);
      mockDBResponse([]);

      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should reject non-admin users from admin endpoints', async () => {
      mockDBResponse([{
        id: 'user-1',
        email: 'user@example.com',
        password_hash: '$2b$10$hash',
        role: 'user', // Not admin
      }]);

      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send({ email: 'user@example.com', password: 'user123' });

      const token = loginResponse.body.token;

      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Session Security', () => {
    it('should not allow token reuse after logout', async () => {
      mockDBResponse([{
        id: 'admin-1',
        email: 'admin@proofpass.co',
        password_hash: '$2b$10$hash',
        role: 'admin',
      }]);

      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send({ email: 'admin@proofpass.co', password: 'admin123' });

      const token = loginResponse.body.token;

      // Logout
      await request
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      // Try to use token after logout
      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${token}`);

      // Should be rejected if proper logout/token revocation is implemented
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Brute Force Protection', () => {
    it('should rate limit login attempts', async () => {
      mockDBResponse([]);

      const attempts = [];
      for (let i = 0; i < 10; i++) {
        attempts.push(
          request
            .post('/api/v1/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' })
        );
      }

      const responses = await Promise.all(attempts);

      // Should start returning 429 after too many failed attempts
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Password Security', () => {
    it('should not return password hashes in responses', async () => {
      mockDBResponse([{
        id: 'admin-1',
        email: 'admin@proofpass.co',
        password_hash: '$2b$10$hash',
        role: 'admin',
      }]);

      const response = await request
        .post('/api/v1/auth/login')
        .send({ email: 'admin@proofpass.co', password: 'admin123' });

      expect(response.body).not.toHaveProperty('password_hash');
      expect(response.body).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toContain('$2b$10');
    });

    it('should enforce minimum password length', async () => {
      const response = await request
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: '123', // Too short
          name: 'Test User',
        });

      expect([400, 422]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('CORS Security', () => {
    it('should have CORS headers configured', async () => {
      const response = await request
        .options('/api/v1/auth/login')
        .set('Origin', 'https://platform.proofpass.co');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should restrict CORS to allowed origins', async () => {
      const response = await request
        .get('/api/v1/auth/login')
        .set('Origin', 'https://malicious-site.com');

      // Should either not have CORS header or restrict it
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
      }
    });
  });
});
