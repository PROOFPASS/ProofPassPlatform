/**
 * Integration Tests: Admin API Keys API
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

describe('Admin API Keys API Integration', () => {
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

  describe('POST /api/v1/admin/api-keys/generate', () => {
    it('should generate a new API key', async () => {
      const apiKey = {
        id: 'key-123',
        key_prefix: 'pk_live_',
        key_hash: '$2b$10$mocked_hash',
        organization_id: 'org-123',
        name: 'Production Key',
        is_active: true,
        created_at: new Date(),
      };

      mockDBResponse([apiKey]);

      const response = await request
        .post('/api/v1/admin/api-keys/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organization_id: 'org-123',
          name: 'Production Key',
          environment: 'live',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('key-123');
      expect(response.body.key).toMatch(/^pk_live_/);
      expect(response.body.organization_id).toBe('org-123');
    });

    it('should generate test API key', async () => {
      const apiKey = {
        id: 'key-test-123',
        key_prefix: 'pk_test_',
        organization_id: 'org-123',
      };

      mockDBResponse([apiKey]);

      const response = await request
        .post('/api/v1/admin/api-keys/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organization_id: 'org-123',
          name: 'Test Key',
          environment: 'test',
        });

      expect(response.status).toBe(201);
      expect(response.body.key).toMatch(/^pk_test_/);
    });

    it('should return 400 if required fields missing', async () => {
      const response = await request
        .post('/api/v1/admin/api-keys/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Missing Org ID',
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request
        .post('/api/v1/admin/api-keys/generate')
        .send({
          organization_id: 'org-123',
          name: 'Key',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/admin/api-keys', () => {
    it('should list API keys with pagination', async () => {
      mockDBResponse([{ total: '15' }]);
      mockDBResponse([
        {
          id: 'key-1',
          key_prefix: 'pk_live_',
          organization_id: 'org-1',
          name: 'Key 1',
          is_active: true,
        },
        {
          id: 'key-2',
          key_prefix: 'pk_test_',
          organization_id: 'org-1',
          name: 'Key 2',
          is_active: true,
        },
      ]);

      const response = await request
        .get('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.api_keys).toHaveLength(2);
      expect(response.body.total).toBe(15);
    });

    it('should filter by organization_id', async () => {
      mockDBResponse([{ total: '3' }]);
      mockDBResponse([
        { id: 'key-1', organization_id: 'org-123' },
      ]);

      const response = await request
        .get('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ organization_id: 'org-123' });

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE organization_id'),
        expect.arrayContaining(['org-123'])
      );
    });

    it('should filter by is_active', async () => {
      mockDBResponse([{ total: '5' }]);
      mockDBResponse([
        { id: 'key-1', is_active: false },
      ]);

      const response = await request
        .get('/api/v1/admin/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ is_active: 'false' });

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE is_active'),
        expect.arrayContaining([false])
      );
    });
  });

  describe('GET /api/v1/admin/api-keys/:id', () => {
    it('should return API key by ID', async () => {
      const apiKey = {
        id: 'key-123',
        key_prefix: 'pk_live_',
        organization_id: 'org-123',
        name: 'Production Key',
        is_active: true,
      };
      mockDBResponse([apiKey]);

      const response = await request
        .get('/api/v1/admin/api-keys/key-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('key-123');
      expect(response.body.name).toBe('Production Key');
    });

    it('should return 404 if API key not found', async () => {
      mockDBResponse([]);

      const response = await request
        .get('/api/v1/admin/api-keys/key-nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/admin/api-keys/:id/deactivate', () => {
    it('should deactivate API key', async () => {
      const deactivated = {
        id: 'key-123',
        is_active: false,
      };
      mockDBResponse([deactivated]);

      const response = await request
        .patch('/api/v1/admin/api-keys/key-123/deactivate')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.is_active).toBe(false);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE api_keys SET is_active = false'),
        expect.any(Array)
      );
    });
  });

  describe('PATCH /api/v1/admin/api-keys/:id/reactivate', () => {
    it('should reactivate API key', async () => {
      const reactivated = {
        id: 'key-123',
        is_active: true,
      };
      mockDBResponse([reactivated]);

      const response = await request
        .patch('/api/v1/admin/api-keys/key-123/reactivate')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.is_active).toBe(true);
    });
  });

  describe('DELETE /api/v1/admin/api-keys/:id', () => {
    it('should delete API key', async () => {
      mockDBResponse([]);

      const response = await request
        .delete('/api/v1/admin/api-keys/key-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM api_keys'),
        ['key-123']
      );
    });
  });

  describe('GET /api/v1/admin/api-keys/:id/usage', () => {
    it('should return API key usage statistics', async () => {
      mockDBResponse([{
        total_requests: '1000',
        total_credits: '5000',
        last_used_at: new Date('2025-10-29'),
      }]);

      const response = await request
        .get('/api/v1/admin/api-keys/key-123/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ start_date: '2025-10-01', end_date: '2025-10-31' });

      expect(response.status).toBe(200);
      expect(response.body.total_requests).toBe(1000);
      expect(response.body.total_credits).toBe(5000);
    });
  });

  describe('POST /api/v1/admin/api-keys/:id/rotate', () => {
    it('should rotate API key', async () => {
      const rotated = {
        id: 'key-123',
        key_prefix: 'pk_live_',
        organization_id: 'org-123',
      };
      mockDBResponse([rotated]);

      const response = await request
        .post('/api/v1/admin/api-keys/key-123/rotate')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('key-123');
      expect(response.body.key).toMatch(/^pk_live_/);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE api_keys'),
        expect.arrayContaining([expect.any(String), 'key-123'])
      );
    });
  });
});
