import { apiKeysService } from '@/lib/services/api-keys';
import apiClient from '@/lib/api-client';

jest.mock('@/lib/api-client');

describe('API Keys Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getApiKeys', () => {
    it('should fetch API keys with filters', async () => {
      const mockData = {
        api_keys: [
          {
            id: '1',
            organization_id: '1',
            key_prefix: 'pk_live_',
            status: 'active',
            environment: 'production',
          },
        ],
        total: 1,
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await apiKeysService.getApiKeys({
        status: 'active',
        environment: 'production',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/admin/api-keys', {
        params: { status: 'active', environment: 'production' },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('getApiKey', () => {
    it('should fetch a single API key by ID', async () => {
      const mockApiKey = {
        id: '1',
        organization_id: '1',
        organization_name: 'Test Org',
        key_prefix: 'pk_live_',
        status: 'active',
        environment: 'production',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockApiKey });

      const result = await apiKeysService.getApiKey('1');

      expect(apiClient.get).toHaveBeenCalledWith('/admin/api-keys/1');
      expect(result).toEqual(mockApiKey);
    });
  });

  describe('createApiKey', () => {
    it('should create a new API key and return plain key', async () => {
      const newApiKey = {
        organization_id: '1',
        environment: 'production' as const,
        name: 'Production Key',
      };

      const mockResponse = {
        api_key: {
          id: '1',
          ...newApiKey,
          key_prefix: 'pk_live_',
          status: 'active',
        },
        plain_key: 'pk_live_1234567890abcdef',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await apiKeysService.createApiKey(newApiKey);

      expect(apiClient.post).toHaveBeenCalledWith('/admin/api-keys', newApiKey);
      expect(result).toEqual(mockResponse);
      expect(result.plain_key).toBeDefined();
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      const mockResponse = {
        id: '1',
        status: 'revoked',
        revoked_at: new Date().toISOString(),
      };

      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await apiKeysService.revokeApiKey('1');

      expect(apiClient.patch).toHaveBeenCalledWith('/admin/api-keys/1/revoke');
      expect(result.status).toBe('revoked');
    });
  });

  describe('activateApiKey', () => {
    it('should activate an API key', async () => {
      const mockResponse = {
        id: '1',
        status: 'active',
      };

      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await apiKeysService.activateApiKey('1');

      expect(apiClient.patch).toHaveBeenCalledWith('/admin/api-keys/1/activate');
      expect(result.status).toBe('active');
    });
  });

  describe('getApiKeyUsage', () => {
    it('should fetch API key usage statistics', async () => {
      const mockUsage = {
        total_requests: 1000,
        requests_today: 50,
        last_used_at: new Date().toISOString(),
        usage_by_day: [
          { date: '2024-01-01', count: 100 },
          { date: '2024-01-02', count: 150 },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockUsage });

      const result = await apiKeysService.getApiKeyUsage('1');

      expect(apiClient.get).toHaveBeenCalledWith('/admin/api-keys/1/usage');
      expect(result).toEqual(mockUsage);
      expect(result.usage_by_day).toHaveLength(2);
    });
  });

  describe('deleteApiKey', () => {
    it('should delete an API key', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await apiKeysService.deleteApiKey('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/admin/api-keys/1');
    });
  });
});
