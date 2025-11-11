/**
 * Integration Tests: Admin Organizations API
 */

import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { mockQuery, resetMocks, mockDBResponse, createMockOrganization } from '../helpers/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn(),
  },
}));

// Import app factory
import { buildApp } from '../../app';

describe('Admin Organizations API Integration', () => {
  let app: FastifyInstance;
  let request: any;
  let authToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    request = supertest(app.server);

    // Mock admin login to get JWT token
    const adminEmail = 'admin@proofpass.co';
    const adminPassword = 'admin123';

    mockDBResponse([{
      id: 'admin-1',
      email: adminEmail,
      password_hash: '$2b$10$hash', // Mocked bcrypt hash
      role: 'admin',
    }]);

    const loginResponse = await request
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/v1/admin/organizations', () => {
    it('should create a new organization', async () => {
      const freePlanId = 'plan-free-123';
      const orgId = 'org-new-123';

      // Mock free plan lookup
      mockDBResponse([{ id: freePlanId }]);

      // Mock organization creation
      mockDBResponse([createMockOrganization({
        id: orgId,
        name: 'New Test Org',
        email: 'neworg@test.com',
        plan_id: freePlanId,
      })]);

      const response = await request
        .post('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Test Org',
          email: 'neworg@test.com',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(orgId);
      expect(response.body.name).toBe('New Test Org');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM plans WHERE slug'),
        ['free']
      );
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request
        .post('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Missing Email Org',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('validation');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request
        .post('/api/v1/admin/organizations')
        .send({
          name: 'Unauthorized Org',
          email: 'unauth@test.com',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/admin/organizations', () => {
    it('should list organizations with pagination', async () => {
      // Mock count query
      mockDBResponse([{ total: '25' }]);

      // Mock list query
      mockDBResponse([
        createMockOrganization({ id: 'org-1', name: 'Org 1' }),
        createMockOrganization({ id: 'org-2', name: 'Org 2' }),
      ]);

      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.organizations).toHaveLength(2);
      expect(response.body.total).toBe(25);
      expect(response.body.pagination).toEqual({
        limit: 10,
        offset: 0,
        total: 25,
      });
    });

    it('should filter by status', async () => {
      mockDBResponse([{ total: '5' }]);
      mockDBResponse([
        createMockOrganization({ status: 'suspended' }),
      ]);

      const response = await request
        .get('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'suspended' });

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE o.status'),
        expect.arrayContaining(['suspended'])
      );
    });
  });

  describe('GET /api/v1/admin/organizations/:id', () => {
    it('should return organization by ID', async () => {
      const org = createMockOrganization({ id: 'org-123', name: 'Test Org' });
      mockDBResponse([org]);

      const response = await request
        .get('/api/v1/admin/organizations/org-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('org-123');
      expect(response.body.name).toBe('Test Org');
    });

    it('should return 404 if organization not found', async () => {
      mockDBResponse([]);

      const response = await request
        .get('/api/v1/admin/organizations/org-nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PATCH /api/v1/admin/organizations/:id', () => {
    it('should update organization fields', async () => {
      const updated = createMockOrganization({
        id: 'org-123',
        name: 'Updated Name',
        billing_email: 'new@billing.com',
      });
      mockDBResponse([updated]);

      const response = await request
        .patch('/api/v1/admin/organizations/org-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          billing_email: 'new@billing.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.billing_email).toBe('new@billing.com');
    });

    it('should return 400 if no fields to update', async () => {
      const response = await request
        .patch('/api/v1/admin/organizations/org-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/admin/organizations/:id/plan', () => {
    it('should update organization plan', async () => {
      const updated = createMockOrganization({
        id: 'org-123',
        plan_id: 'plan-pro-123',
        subscription_end: new Date('2025-12-31'),
      });
      mockDBResponse([updated]);

      const response = await request
        .patch('/api/v1/admin/organizations/org-123/plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan_id: 'plan-pro-123',
          subscription_end: '2025-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.plan_id).toBe('plan-pro-123');
    });
  });

  describe('PATCH /api/v1/admin/organizations/:id/status', () => {
    it('should suspend organization', async () => {
      const suspended = createMockOrganization({
        id: 'org-123',
        status: 'suspended',
      });
      mockDBResponse([suspended]);

      const response = await request
        .patch('/api/v1/admin/organizations/org-123/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'suspended' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('suspended');
    });

    it('should activate organization', async () => {
      const active = createMockOrganization({
        id: 'org-123',
        status: 'active',
      });
      mockDBResponse([active]);

      const response = await request
        .patch('/api/v1/admin/organizations/org-123/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('active');
    });
  });

  describe('GET /api/v1/admin/organizations/:id/usage', () => {
    it('should return organization usage stats', async () => {
      mockDBResponse([{
        total_requests: '1500',
        total_credits: '5000',
        blockchain_anchors: '100',
        attestations: '300',
        passports: '200',
      }]);

      const response = await request
        .get('/api/v1/admin/organizations/org-123/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ start_date: '2025-01-01', end_date: '2025-01-31' });

      expect(response.status).toBe(200);
      expect(response.body.total_requests).toBe(1500);
      expect(response.body.total_credits).toBe(5000);
    });
  });

  describe('DELETE /api/v1/admin/organizations/:id', () => {
    it('should soft delete organization', async () => {
      const deleted = createMockOrganization({
        id: 'org-123',
        status: 'deleted',
      });
      mockDBResponse([deleted]);

      const response = await request
        .delete('/api/v1/admin/organizations/org-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('deleted');
    });
  });
});
