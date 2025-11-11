import apiClient from '../api-client';
import type {
  ApiKey,
  ApiKeyFilters,
  CreateApiKeyDto,
} from '@/types/api';

export const apiKeysService = {
  // Get all API keys with filters
  async getApiKeys(filters?: ApiKeyFilters): Promise<{ api_keys: ApiKey[]; total: number }> {
    const response = await apiClient.get('/admin/api-keys', { params: filters });
    return response.data;
  },

  // Get API key by ID
  async getApiKey(id: string): Promise<ApiKey> {
    const response = await apiClient.get(`/admin/api-keys/${id}`);
    return response.data;
  },

  // Create new API key
  async createApiKey(data: CreateApiKeyDto): Promise<{ api_key: ApiKey; plain_key: string }> {
    const response = await apiClient.post('/admin/api-keys', data);
    return response.data;
  },

  // Revoke API key
  async revokeApiKey(id: string): Promise<ApiKey> {
    const response = await apiClient.patch(`/admin/api-keys/${id}/revoke`);
    return response.data;
  },

  // Activate API key
  async activateApiKey(id: string): Promise<ApiKey> {
    const response = await apiClient.patch(`/admin/api-keys/${id}/activate`);
    return response.data;
  },

  // Delete API key
  async deleteApiKey(id: string): Promise<void> {
    await apiClient.delete(`/admin/api-keys/${id}`);
  },

  // Get API key usage stats
  async getApiKeyUsage(id: string): Promise<{
    total_requests: number;
    requests_today: number;
    last_used_at: string | null;
    usage_by_day: Array<{ date: string; count: number }>;
  }> {
    const response = await apiClient.get(`/admin/api-keys/${id}/usage`);
    return response.data;
  },
};
