import axios, { AxiosInstance, AxiosError } from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get session from NextAuth
    const session = await getSession();

    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data: any = error.response.data;

      if (status === 401) {
        // Unauthorized - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login?error=SessionExpired';
        }
      } else if (status === 403) {
        // Forbidden
        console.error('Access forbidden:', data.message);
      } else if (status === 429) {
        // Rate limit exceeded
        console.error('Rate limit exceeded:', data.message);
      }

      return Promise.reject({
        message: data.message || data.error || 'An error occurred',
        status,
        data,
      });
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        message: 'No response from server',
        status: 0,
      });
    } else {
      // Error setting up request
      return Promise.reject({
        message: error.message || 'Request failed',
        status: 0,
      });
    }
  }
);

export default apiClient;

// Helper functions for common API calls

export const api = {
  // Organizations
  organizations: {
    list: (params?: any) => apiClient.get('/api/v1/admin/organizations', { params }),
    get: (id: string) => apiClient.get(`/api/v1/admin/organizations/${id}`),
    create: (data: any) => apiClient.post('/api/v1/admin/organizations', data),
    update: (id: string, data: any) => apiClient.patch(`/api/v1/admin/organizations/${id}`, data),
    updatePlan: (id: string, data: any) => apiClient.patch(`/api/v1/admin/organizations/${id}/plan`, data),
    updateStatus: (id: string, data: any) => apiClient.patch(`/api/v1/admin/organizations/${id}/status`, data),
    getUsage: (id: string, params?: any) => apiClient.get(`/api/v1/admin/organizations/${id}/usage`, { params }),
    delete: (id: string) => apiClient.delete(`/api/v1/admin/organizations/${id}`),
  },

  // Payments
  payments: {
    list: (params?: any) => apiClient.get('/api/v1/admin/payments', { params }),
    get: (id: string) => apiClient.get(`/api/v1/admin/payments/${id}`),
    create: (data: any) => apiClient.post('/api/v1/admin/payments', data),
    updateStatus: (id: string, data: any) => apiClient.patch(`/api/v1/admin/payments/${id}/status`, data),
    getStats: (params?: any) => apiClient.get('/api/v1/admin/payments/stats', { params }),
    getPending: () => apiClient.get('/api/v1/admin/payments/pending'),
  },

  // API Keys
  apiKeys: {
    list: (params?: any) => apiClient.get('/api/v1/admin/api-keys', { params }),
    get: (id: string) => apiClient.get(`/api/v1/admin/api-keys/${id}`),
    generate: (data: any) => apiClient.post('/api/v1/admin/api-keys/generate', data),
    deactivate: (id: string) => apiClient.patch(`/api/v1/admin/api-keys/${id}/deactivate`),
    reactivate: (id: string) => apiClient.patch(`/api/v1/admin/api-keys/${id}/reactivate`),
    rotate: (id: string) => apiClient.post(`/api/v1/admin/api-keys/${id}/rotate`),
    getUsage: (id: string, params?: any) => apiClient.get(`/api/v1/admin/api-keys/${id}/usage`, { params }),
    delete: (id: string) => apiClient.delete(`/api/v1/admin/api-keys/${id}`),
  },
};
