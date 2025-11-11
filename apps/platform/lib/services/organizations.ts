import apiClient from '../api-client';
import type {
  Organization,
  OrganizationsListResponse,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  ChangePlanDto,
  ChangeStatusDto,
  OrganizationUsage,
  OrganizationFilters,
} from '@/types/api';

export const organizationsService = {
  // Get all organizations with filters
  async getOrganizations(filters?: OrganizationFilters): Promise<OrganizationsListResponse> {
    const response = await apiClient.get('/admin/organizations', { params: filters });
    return response.data;
  },

  // Get organization by ID
  async getOrganization(id: string): Promise<Organization> {
    const response = await apiClient.get(`/admin/organizations/${id}`);
    return response.data;
  },

  // Create new organization
  async createOrganization(data: CreateOrganizationDto): Promise<Organization> {
    const response = await apiClient.post('/admin/organizations', data);
    return response.data;
  },

  // Update organization
  async updateOrganization(id: string, data: UpdateOrganizationDto): Promise<Organization> {
    const response = await apiClient.patch(`/admin/organizations/${id}`, data);
    return response.data;
  },

  // Change organization plan
  async changePlan(id: string, data: ChangePlanDto): Promise<Organization> {
    const response = await apiClient.patch(`/admin/organizations/${id}/plan`, data);
    return response.data;
  },

  // Change organization status
  async changeStatus(id: string, data: ChangeStatusDto): Promise<Organization> {
    const response = await apiClient.patch(`/admin/organizations/${id}/status`, data);
    return response.data;
  },

  // Get organization usage stats
  async getUsage(id: string): Promise<OrganizationUsage> {
    const response = await apiClient.get(`/admin/organizations/${id}/usage`);
    return response.data;
  },

  // Delete organization
  async deleteOrganization(id: string): Promise<void> {
    await apiClient.delete(`/admin/organizations/${id}`);
  },
};
