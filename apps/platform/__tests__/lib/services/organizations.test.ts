import { organizationsService } from '@/lib/services/organizations';
import apiClient from '@/lib/api-client';

jest.mock('@/lib/api-client');

describe('Organizations Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrganizations', () => {
    it('should fetch organizations with filters', async () => {
      const mockData = {
        organizations: [
          { id: '1', name: 'Org 1', status: 'active' },
          { id: '2', name: 'Org 2', status: 'active' },
        ],
        total: 2,
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await organizationsService.getOrganizations({
        status: 'active',
        limit: 10,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/admin/organizations', {
        params: { status: 'active', limit: 10 },
      });
      expect(result).toEqual(mockData);
    });

    it('should handle errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(
        organizationsService.getOrganizations()
      ).rejects.toThrow('API Error');
    });
  });

  describe('getOrganization', () => {
    it('should fetch a single organization by ID', async () => {
      const mockOrg = {
        id: '1',
        name: 'Test Org',
        status: 'active',
        plan_name: 'Pro',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockOrg });

      const result = await organizationsService.getOrganization('1');

      expect(apiClient.get).toHaveBeenCalledWith('/admin/organizations/1');
      expect(result).toEqual(mockOrg);
    });
  });

  describe('createOrganization', () => {
    it('should create a new organization', async () => {
      const newOrg = {
        name: 'New Org',
        email: 'test@example.com',
        country: 'AR',
      };

      const mockResponse = {
        id: '1',
        ...newOrg,
        status: 'active',
        plan_name: 'Free',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await organizationsService.createOrganization(newOrg);

      expect(apiClient.post).toHaveBeenCalledWith('/admin/organizations', newOrg);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('changeStatus', () => {
    it('should change organization status', async () => {
      const mockResponse = {
        id: '1',
        name: 'Test Org',
        status: 'suspended',
      };

      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await organizationsService.changeStatus('1', {
        status: 'suspended',
      });

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/admin/organizations/1/status',
        { status: 'suspended' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('changePlan', () => {
    it('should change organization plan', async () => {
      const mockResponse = {
        id: '1',
        name: 'Test Org',
        plan_name: 'Enterprise',
      };

      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await organizationsService.changePlan('1', {
        plan_slug: 'enterprise',
      });

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/admin/organizations/1/plan',
        { plan_slug: 'enterprise' }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
