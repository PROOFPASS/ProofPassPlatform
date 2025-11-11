/**
 * Unit Tests: API Key Authentication Middleware
 */

import { authenticateAPIKey } from '../../../middleware/api-key-auth';
import * as bcrypt from 'bcrypt';
import { mockQuery, resetMocks, mockDBResponse } from '../../helpers/database';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}));

jest.mock('bcrypt');

describe('API Key Authentication Middleware', () => {
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    resetMocks();

    mockRequest = {
      headers: {},
      log: {
        error: jest.fn(),
      },
    };

    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
    };
  });

  describe('Missing API Key', () => {
    it('should return 401 if X-API-Key header is missing', async () => {
      await authenticateAPIKey(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'API key required',
        message: 'Please provide an API key in the X-API-Key header'
      });
    });
  });

  describe('Invalid API Key Format', () => {
    it('should return 401 if API key does not start with pk_', async () => {
      mockRequest.headers['x-api-key'] = 'invalid_key';

      await authenticateAPIKey(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Invalid API key format',
        message: 'API key must start with pk_live_ or pk_test_'
      });
    });
  });

  describe('Valid API Key - Database Lookup', () => {
    it('should return 401 if API key not found in database', async () => {
      mockRequest.headers['x-api-key'] = 'pk_live_test123';

      mockDBResponse([]); // No rows found

      await authenticateAPIKey(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Invalid API key',
        message: 'API key not found or organization is not active'
      });
    });

    it('should return 401 if bcrypt verification fails', async () => {
      mockRequest.headers['x-api-key'] = 'pk_live_test123';

      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-123',
        org_status: 'active',
        plan_name: 'Pro',
        requests_per_day: 10000,
        blockchain_ops_per_month: 1000,
      }]);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await authenticateAPIKey(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Invalid API key',
        message: 'API key authentication failed'
      });
    });

    it('should return 401 if API key is expired', async () => {
      mockRequest.headers['x-api-key'] = 'pk_live_test123';

      const pastDate = new Date('2023-01-01');
      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: true,
        expires_at: pastDate,
        org_id: 'org-123',
        org_status: 'active',
        plan_name: 'Pro',
        requests_per_day: 10000,
      }]);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authenticateAPIKey(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'API key expired',
        message: 'This API key has expired. Please generate a new one.'
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 if daily rate limit exceeded', async () => {
      mockRequest.headers['x-api-key'] = 'pk_live_test123';

      // First query: get API key
      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-123',
        plan_name: 'Free',
        requests_per_day: 100,
      }]);

      // Second query: get usage count
      mockDBResponse([{ count: '100' }]);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authenticateAPIKey(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(429);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Rate limit exceeded',
          limit: 100,
          current: 100,
        })
      );
    });

    it('should allow unlimited requests for plans with limit = -1', async () => {
      mockRequest.headers['x-api-key'] = 'pk_live_test123';

      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-123',
        plan_name: 'Enterprise',
        requests_per_day: -1, // Unlimited
      }]);

      mockDBResponse([{ count: '999999' }]); // High usage

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authenticateAPIKey(mockRequest, mockReply);

      expect(mockReply.code).not.toHaveBeenCalledWith(429);
      expect(mockRequest.client).toBeDefined();
    });
  });

  describe('Successful Authentication', () => {
    it('should attach client info to request on successful auth', async () => {
      mockRequest.headers['x-api-key'] = 'pk_live_test123';

      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-123',
        plan_name: 'Pro',
        requests_per_day: 10000,
        blockchain_ops_per_month: 1000,
      }]);

      mockDBResponse([{ count: '50' }]); // Current usage

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authenticateAPIKey(mockRequest, mockReply);

      expect(mockRequest.client).toEqual({
        orgId: 'org-123',
        apiKeyId: 'key-123',
        plan: 'Pro',
        limits: {
          requestsPerDay: 10000,
          blockchainOpsPerMonth: 1000,
        },
      });
    });

    it('should set rate limit headers on successful auth', async () => {
      mockRequest.headers['x-api-key'] = 'pk_live_test123';

      mockDBResponse([{
        id: 'key-123',
        key_hash: '$2b$10$hash',
        is_active: true,
        org_id: 'org-123',
        requests_per_day: 100,
      }]);

      mockDBResponse([{ count: '45' }]);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authenticateAPIKey(mockRequest, mockReply);

      expect(mockReply.header).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
      expect(mockReply.header).toHaveBeenCalledWith('X-RateLimit-Remaining', 55);
      expect(mockReply.header).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });
  });

  describe('Error Handling', () => {
    it('should return 500 if database query fails', async () => {
      mockRequest.headers['x-api-key'] = 'pk_live_test123';

      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      await authenticateAPIKey(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Internal server error during authentication'
      });
    });
  });
});
