/**
 * Integration Tests: Admin Payments API
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

describe('Admin Payments API Integration', () => {
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

  describe('POST /api/v1/admin/payments', () => {
    it('should register a new payment', async () => {
      const payment = {
        id: 'pay-123',
        organization_id: 'org-123',
        amount: 99.00,
        currency: 'USD',
        status: 'completed',
        payment_method: 'bank_transfer',
        reference: 'TRF-2025-001',
        notes: 'Pro plan subscription',
        created_at: new Date(),
      };

      mockDBResponse([payment]);

      const response = await request
        .post('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organization_id: 'org-123',
          amount: 99.00,
          currency: 'USD',
          payment_method: 'bank_transfer',
          reference: 'TRF-2025-001',
          notes: 'Pro plan subscription',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('pay-123');
      expect(response.body.amount).toBe(99.00);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payments'),
        expect.arrayContaining(['org-123', 99.00, 'USD'])
      );
    });

    it('should return 400 if required fields missing', async () => {
      const response = await request
        .post('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organization_id: 'org-123',
          // Missing amount
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request
        .post('/api/v1/admin/payments')
        .send({
          organization_id: 'org-123',
          amount: 99.00,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/admin/payments', () => {
    it('should list all payments with pagination', async () => {
      mockDBResponse([{ total: '50' }]);
      mockDBResponse([
        {
          id: 'pay-1',
          organization_id: 'org-1',
          amount: 99.00,
          currency: 'USD',
          status: 'completed',
        },
        {
          id: 'pay-2',
          organization_id: 'org-2',
          amount: 299.00,
          currency: 'USD',
          status: 'pending',
        },
      ]);

      const response = await request
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 20, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.payments).toHaveLength(2);
      expect(response.body.total).toBe(50);
    });

    it('should filter by organization_id', async () => {
      mockDBResponse([{ total: '5' }]);
      mockDBResponse([
        { id: 'pay-1', organization_id: 'org-123', amount: 99.00 },
      ]);

      const response = await request
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ organization_id: 'org-123' });

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE organization_id'),
        expect.arrayContaining(['org-123'])
      );
    });

    it('should filter by status', async () => {
      mockDBResponse([{ total: '3' }]);
      mockDBResponse([
        { id: 'pay-1', status: 'pending' },
      ]);

      const response = await request
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'pending' });

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status'),
        expect.arrayContaining(['pending'])
      );
    });
  });

  describe('GET /api/v1/admin/payments/:id', () => {
    it('should return payment by ID', async () => {
      const payment = {
        id: 'pay-123',
        organization_id: 'org-123',
        amount: 99.00,
        currency: 'USD',
        status: 'completed',
      };
      mockDBResponse([payment]);

      const response = await request
        .get('/api/v1/admin/payments/pay-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('pay-123');
      expect(response.body.amount).toBe(99.00);
    });

    it('should return 404 if payment not found', async () => {
      mockDBResponse([]);

      const response = await request
        .get('/api/v1/admin/payments/pay-nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/admin/payments/:id/status', () => {
    it('should update payment status to completed', async () => {
      const updated = {
        id: 'pay-123',
        status: 'completed',
        confirmed_at: new Date(),
      };
      mockDBResponse([updated]);

      const response = await request
        .patch('/api/v1/admin/payments/pay-123/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
    });

    it('should update payment status to failed', async () => {
      const updated = {
        id: 'pay-123',
        status: 'failed',
      };
      mockDBResponse([updated]);

      const response = await request
        .patch('/api/v1/admin/payments/pay-123/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'failed' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('failed');
    });
  });

  describe('GET /api/v1/admin/payments/stats', () => {
    it('should return payment statistics', async () => {
      mockDBResponse([{
        total_revenue: '15000.00',
        total_payments: '50',
        pending_amount: '1200.00',
        completed_amount: '13800.00',
      }]);

      const response = await request
        .get('/api/v1/admin/payments/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ start_date: '2025-01-01', end_date: '2025-01-31' });

      expect(response.status).toBe(200);
      expect(response.body.total_revenue).toBe(15000.00);
      expect(response.body.total_payments).toBe(50);
    });
  });

  describe('GET /api/v1/admin/payments/pending', () => {
    it('should return all pending payments', async () => {
      mockDBResponse([
        { id: 'pay-1', status: 'pending', amount: 99.00 },
        { id: 'pay-2', status: 'pending', amount: 299.00 },
      ]);

      const response = await request
        .get('/api/v1/admin/payments/pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.payments).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'pending'"),
        expect.any(Array)
      );
    });
  });
});
