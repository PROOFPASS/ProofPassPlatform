/**
 * Integration tests for ZK Proof API
 * Tests complete ZKP flow with mocked services
 */

import Fastify, { FastifyInstance } from 'fastify';
import { zkpRoutes } from '../../src/modules/zkp/routes';
import jwt from '@fastify/jwt';
import { ZKProofFactory } from '../helpers/factories';

// Mock the service layer
jest.mock('../../src/modules/zkp/service', () => ({
  generateZKProof: jest.fn(),
  getZKProof: jest.fn(),
  listZKProofs: jest.fn(),
  verifyZKProof: jest.fn(),
  getProofsForAttestation: jest.fn(),
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
  generateZKProof,
  getZKProof,
  listZKProofs,
  verifyZKProof,
  getProofsForAttestation,
} from '../../src/modules/zkp/service';

describe('ZK Proof Integration Tests', () => {
  let app: FastifyInstance;
  const mockGenerateProof = generateZKProof as jest.MockedFunction<typeof generateZKProof>;
  const mockGetProof = getZKProof as jest.MockedFunction<typeof getZKProof>;
  const mockListProofs = listZKProofs as jest.MockedFunction<typeof listZKProofs>;
  const mockVerifyProof = verifyZKProof as jest.MockedFunction<typeof verifyZKProof>;
  const mockGetProofsForAttestation = getProofsForAttestation as jest.MockedFunction<
    typeof getProofsForAttestation
  >;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(jwt, { secret: 'test-secret' });
    await app.register(zkpRoutes, { prefix: '/api/v1' });
    await app.ready();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/zkp/proofs', () => {
    const attestationId = '550e8400-e29b-41d4-a716-446655440000';

    it('should generate threshold proof', async () => {
      const mockProof = ZKProofFactory.build({ circuit_type: 'threshold' });
      mockGenerateProof.mockResolvedValue(mockProof);

      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/zkp/proofs',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          attestation_id: attestationId,
          circuit_type: 'threshold',
          private_inputs: { value: 95 },
          public_inputs: { threshold: 90 },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('proof');
      expect(body.circuit_type).toBe('threshold');
    });

    it('should generate range proof', async () => {
      const mockProof = ZKProofFactory.build({ circuit_type: 'range' });
      mockGenerateProof.mockResolvedValue(mockProof);

      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/zkp/proofs',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          attestation_id: attestationId,
          circuit_type: 'range',
          private_inputs: { value: 5 },
          public_inputs: { min: 2, max: 8 },
        },
      });

      expect(response.statusCode).toBe(201);
    });

    it('should generate set_membership proof', async () => {
      const mockProof = ZKProofFactory.build({ circuit_type: 'set_membership' });
      mockGenerateProof.mockResolvedValue(mockProof);

      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/zkp/proofs',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          attestation_id: attestationId,
          circuit_type: 'set_membership',
          private_inputs: { value: 'B' },
          public_inputs: { set: ['A', 'B', 'C'] },
        },
      });

      expect(response.statusCode).toBe(201);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/zkp/proofs',
        payload: {
          attestation_id: attestationId,
          circuit_type: 'threshold',
          private_inputs: { value: 95 },
          public_inputs: { threshold: 90 },
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/zkp/proofs',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          attestation_id: attestationId,
          // Missing circuit_type and inputs
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle proof generation errors', async () => {
      mockGenerateProof.mockRejectedValue(new Error('Proof generation failed: invalid inputs'));

      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/zkp/proofs',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          attestation_id: attestationId,
          circuit_type: 'threshold',
          private_inputs: { value: 85 },
          public_inputs: { threshold: 90 },
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/zkp/proofs/:id', () => {
    it('should get proof by ID', async () => {
      const proofId = '550e8400-e29b-41d4-a716-446655440010';
      const mockProof = ZKProofFactory.build({ id: proofId });
      mockGetProof.mockResolvedValue(mockProof);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/zkp/proofs/${proofId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(proofId);
    });

    it('should return 404 for non-existent proof', async () => {
      const proofId = '550e8400-e29b-41d4-a716-446655440011';
      mockGetProof.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/zkp/proofs/${proofId}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/zkp/proofs', () => {
    it('should list user proofs', async () => {
      const mockProofs = ZKProofFactory.buildMany(3);
      mockListProofs.mockResolvedValue(mockProofs);

      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/zkp/proofs',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.proofs).toHaveLength(3);
      expect(body.count).toBe(3);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/zkp/proofs',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should respect pagination parameters', async () => {
      mockListProofs.mockResolvedValue([]);

      const token = app.jwt.sign({ id: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/zkp/proofs?limit=10&offset=20',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockListProofs).toHaveBeenCalledWith('user-123', 10, 20);
    });
  });

  describe('GET /api/v1/zkp/proofs/:id/verify', () => {
    it('should verify valid proof', async () => {
      const proofId = '550e8400-e29b-41d4-a716-446655440010';
      const mockProof = ZKProofFactory.build({ id: proofId, verified: true });
      mockVerifyProof.mockResolvedValue({
        valid: true,
        proof: mockProof,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/zkp/proofs/${proofId}/verify`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.valid).toBe(true);
      expect(body.proof).toBeDefined();
    });

    it('should detect invalid proof', async () => {
      const proofId = '550e8400-e29b-41d4-a716-446655440011';
      const mockProof = ZKProofFactory.build({ id: proofId, verified: false });
      mockVerifyProof.mockResolvedValue({
        valid: false,
        proof: mockProof,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/zkp/proofs/${proofId}/verify`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.valid).toBe(false);
    });

    it('should return 404 for non-existent proof', async () => {
      const proofId = '550e8400-e29b-41d4-a716-446655440012';
      mockVerifyProof.mockRejectedValue(new Error('Proof not found'));

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/zkp/proofs/${proofId}/verify`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/attestations/:attestationId/proofs', () => {
    it('should get proofs for attestation', async () => {
      const attestationId = '550e8400-e29b-41d4-a716-446655440020';
      const mockProofs = ZKProofFactory.buildMany(2);
      mockGetProofsForAttestation.mockResolvedValue(mockProofs);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/attestations/${attestationId}/proofs`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.proofs).toHaveLength(2);
      expect(body.count).toBe(2);
    });

    it('should return empty array when no proofs exist', async () => {
      const attestationId = '550e8400-e29b-41d4-a716-446655440021';
      mockGetProofsForAttestation.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/attestations/${attestationId}/proofs`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.proofs).toHaveLength(0);
    });
  });
});
