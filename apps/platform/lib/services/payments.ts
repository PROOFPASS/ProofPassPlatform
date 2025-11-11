import apiClient from '../api-client';
import type {
  Payment,
  CreatePaymentDto,
  PaymentFilters,
} from '@/types/api';

export const paymentsService = {
  // Get all payments with filters
  async getPayments(filters?: PaymentFilters): Promise<{ payments: Payment[]; total: number }> {
    const response = await apiClient.get('/admin/payments', { params: filters });
    return response.data;
  },

  // Get payment by ID
  async getPayment(id: string): Promise<Payment> {
    const response = await apiClient.get(`/admin/payments/${id}`);
    return response.data;
  },

  // Create new payment
  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    const response = await apiClient.post('/admin/payments', data);
    return response.data;
  },

  // Update payment status
  async updatePaymentStatus(id: string, status: 'pending' | 'confirmed' | 'failed'): Promise<Payment> {
    const response = await apiClient.patch(`/admin/payments/${id}/status`, { status });
    return response.data;
  },

  // Delete payment
  async deletePayment(id: string): Promise<void> {
    await apiClient.delete(`/admin/payments/${id}`);
  },
};
