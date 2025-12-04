/**
 * Unit Tests: Usage Tracking Middleware
 */

import { trackUsage } from '../../../middleware/usage-tracking';
import { query } from '../../../config/database';

jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}));

// Helper functions for mocking
const mockQuery = query as jest.MockedFunction<typeof query>;

function resetMocks() {
  mockQuery.mockReset();
}

describe('Usage Tracking Middleware', () => {
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    resetMocks();

    mockRequest = {
      client: {
        orgId: 'org-123',
        apiKeyId: 'key-123',
      },
      routerPath: '/api/v1/blockchain/anchor',
      url: '/api/v1/blockchain/anchor',
      method: 'POST',
      log: {
        error: jest.fn(),
      },
    };

    mockReply = {
      statusCode: 201,
    };

    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as any);
  });

  describe('Track Request', () => {
    it('should insert usage record for blockchain_anchor', async () => {
      await trackUsage(mockRequest, mockReply);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_records'),
        expect.arrayContaining([
          'org-123',
          'key-123',
          '/api/v1/blockchain/anchor',
          'POST',
          201,
          'blockchain_anchor',
          10, // Credits for blockchain anchor
        ])
      );
    });

    it('should track attestation_create with 5 credits', async () => {
      mockRequest.routerPath = '/api/v1/attestations';
      mockRequest.method = 'POST';

      await trackUsage(mockRequest, mockReply);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_records'),
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          'attestation_create',
          5,
        ])
      );
    });

    it('should track passport_create with 3 credits', async () => {
      mockRequest.routerPath = '/api/v1/passports';
      mockRequest.method = 'POST';

      await trackUsage(mockRequest, mockReply);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_records'),
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          'passport_create',
          3,
        ])
      );
    });

    it('should track zkp_generate with 20 credits', async () => {
      mockRequest.routerPath = '/api/v1/zkp';
      mockRequest.method = 'POST';

      await trackUsage(mockRequest, mockReply);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_records'),
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          'zkp_generate',
          20,
        ])
      );
    });

    it('should track generic api_call with 1 credit', async () => {
      mockRequest.routerPath = '/api/v1/other/endpoint';
      mockRequest.method = 'GET';

      await trackUsage(mockRequest, mockReply);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_records'),
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          'api_call',
          1,
        ])
      );
    });
  });

  describe('No Client Info', () => {
    it('should not track if request.client is undefined', async () => {
      mockRequest.client = undefined;

      await trackUsage(mockRequest, mockReply);

      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should not throw if tracking fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(trackUsage(mockRequest, mockReply)).resolves.not.toThrow();
      expect(mockRequest.log.error).toHaveBeenCalled();
    });
  });

  describe('Aggregates Update', () => {
    it('should call aggregate update (async)', async () => {
      await trackUsage(mockRequest, mockReply);

      // First call: insert usage_record
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('INSERT INTO usage_records'),
        expect.any(Array)
      );

      // Wait for async aggregate update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second call should be aggregate update
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_aggregates'),
        expect.any(Array)
      );
    });
  });
});
