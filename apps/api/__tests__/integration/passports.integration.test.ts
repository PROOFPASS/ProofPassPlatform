/**
 * Integration tests for Product Passport API
 * Tests complete passport flow with mocked services
 */

import Fastify, { FastifyInstance } from 'fastify';
import { passportRoutes } from '../../src/modules/passports/routes';
import jwt from '@fastify/jwt';
import { ProductPassportFactory } from '../helpers/factories';

// Mock the service layer
jest.mock('../../src/modules/passports/service', () => ({
  createProductPassport: jest.fn(),
  getProductPassport: jest.fn(),
  getProductPassportByProductId: jest.fn(),
  listProductPassports: jest.fn(),
  verifyProductPassport: jest.fn(),
  addAttestationToPassport: jest.fn(),
}));

// Mock database
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  pool: {
    query: jest.fn(),
    on: jest.fn(),
  },
}));

import {
  createProductPassport,
  getProductPassport,
  getProductPassportByProductId,
  listProductPassports,
  verifyProductPassport,
  addAttestationToPassport,
} from '../../src/modules/passports/service';

describe('Product Passport Integration Tests', () => {
  let app: FastifyInstance;
  const mockCreatePassport = createProductPassport as jest.MockedFunction<typeof createProductPassport>;
  const mockGetPassport = getProductPassport as jest.MockedFunction<typeof getProductPassport>;
  const mockGetPassportByProductId = getProductPassportByProductId as jest.MockedFunction<
    typeof getProductPassportByProductId
  >;
  const mockListPassports = listProductPassports as jest.MockedFunction<typeof listProductPassports>;
  const mockVerifyPassport = verifyProductPassport as jest.MockedFunction<typeof verifyProductPassport>;
  const mockAddAttestation = addAttestationToPassport as jest.MockedFunction<
    typeof addAttestationToPassport
  >;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(jwt, { secret: 'test-secret' });
    await app.register(passportRoutes, { prefix: '/api/v1' });
    await app.ready();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/passports', () => {
    const attestationId1 = '550e8400-e29b-41d4-a716-446655440000';
    const attestationId2 = '550e8400-e29b-41d4-a716-446655440001';

    it('should create a new product passport', async () => {
      const mockPassport = ProductPassportFactory.build();
      mockCreatePassport.mockResolvedValue(mockPassport);

      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/passports',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          product_id: 'PRODUCT-001',
          name: 'Test Product',
          attestation_ids: [attestationId1, attestationId2],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('product_id');
      expect(body).toHaveProperty('aggregated_credential');
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/passports',
        payload: {
          product_id: 'PRODUCT-001',
          name: 'Test Product',
          attestation_ids: [attestationId1],
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/passports',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          product_id: 'PRODUCT-001',
          // Missing name and attestation_ids
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/passports/:id', () => {
    it('should get passport by ID', async () => {
      const passportId = '550e8400-e29b-41d4-a716-446655440000';
      const mockPassport = ProductPassportFactory.build({ id: passportId });
      mockGetPassport.mockResolvedValue(mockPassport);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/passports/${passportId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(passportId);
    });

    it('should return 404 for non-existent passport', async () => {
      const passportId = '550e8400-e29b-41d4-a716-446655440001';
      mockGetPassport.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/passports/${passportId}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/passports/product/:productId', () => {
    it('should get passport by product ID', async () => {
      const mockPassport = ProductPassportFactory.build({ product_id: 'PRODUCT-001' });
      mockGetPassportByProductId.mockResolvedValue(mockPassport);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/passports/product/PRODUCT-001',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.product_id).toBe('PRODUCT-001');
    });

    it('should return 404 when product has no passport', async () => {
      mockGetPassportByProductId.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/passports/product/NON-EXISTENT',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/passports', () => {
    it('should list user passports', async () => {
      const mockPassports = ProductPassportFactory.buildMany(3);
      mockListPassports.mockResolvedValue(mockPassports);

      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/passports',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.passports).toHaveLength(3);
      expect(body.count).toBe(3);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/passports',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should respect pagination parameters', async () => {
      mockListPassports.mockResolvedValue([]);

      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/passports?limit=10&offset=20',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockListPassports).toHaveBeenCalledWith('user-123', 10, 20);
    });
  });

  describe('GET /api/v1/passports/:id/verify', () => {
    it('should verify passport', async () => {
      const passportId = '550e8400-e29b-41d4-a716-446655440000';
      const mockPassport = ProductPassportFactory.build({ id: passportId });
      mockVerifyPassport.mockResolvedValue({
        valid: true,
        passport: mockPassport,
        attestations_verified: [
          {
            attestation_id: 'att-1',
            valid: true,
            blockchain_verified: true,
            signature_verified: true,
          },
        ],
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/passports/${passportId}/verify`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.valid).toBe(true);
      expect(body.attestations_verified).toHaveLength(1);
    });

    it('should handle verification of invalid passport', async () => {
      const passportId = '550e8400-e29b-41d4-a716-446655440001';
      mockVerifyPassport.mockRejectedValue(new Error('Passport not found'));

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/passports/${passportId}/verify`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/passports/:id/attestations', () => {
    it('should add attestation to passport', async () => {
      const passportId = '550e8400-e29b-41d4-a716-446655440000';
      const attestationId = '550e8400-e29b-41d4-a716-446655440010';
      const mockPassport = ProductPassportFactory.build({ id: passportId });
      mockAddAttestation.mockResolvedValue(mockPassport);

      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/passports/${passportId}/attestations`,
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          attestation_id: attestationId,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockAddAttestation).toHaveBeenCalledWith(passportId, attestationId, 'user-123');
    });

    it('should require authentication', async () => {
      const passportId = '550e8400-e29b-41d4-a716-446655440000';
      const attestationId = '550e8400-e29b-41d4-a716-446655440010';

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/passports/${passportId}/attestations`,
        payload: {
          attestation_id: attestationId,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate attestation_id', async () => {
      const passportId = '550e8400-e29b-41d4-a716-446655440000';
      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/passports/${passportId}/attestations`,
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
