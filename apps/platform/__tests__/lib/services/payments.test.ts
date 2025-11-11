import { paymentsService } from '@/lib/services/payments';
import apiClient from '@/lib/api-client';

jest.mock('@/lib/api-client');

describe('Payments Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPayments', () => {
    it('should fetch payments with filters', async () => {
      const mockData = {
        payments: [
          {
            id: '1',
            organization_id: '1',
            amount: 1000,
            currency: 'USD',
            status: 'confirmed',
          },
        ],
        total: 1,
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await paymentsService.getPayments({ status: 'confirmed' });

      expect(apiClient.get).toHaveBeenCalledWith('/admin/payments', {
        params: { status: 'confirmed' },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('getPayment', () => {
    it('should fetch a single payment by ID', async () => {
      const mockPayment = {
        id: '1',
        organization_id: '1',
        organization_name: 'Test Org',
        amount: 1000,
        currency: 'USD',
        status: 'confirmed',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockPayment });

      const result = await paymentsService.getPayment('1');

      expect(apiClient.get).toHaveBeenCalledWith('/admin/payments/1');
      expect(result).toEqual(mockPayment);
    });
  });

  describe('createPayment', () => {
    it('should create a new payment', async () => {
      const newPayment = {
        organization_id: '1',
        amount: 1000,
        currency: 'USD',
        payment_method: 'Transferencia' as const,
        reference: 'TRX-001',
      };

      const mockResponse = {
        id: '1',
        ...newPayment,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await paymentsService.createPayment(newPayment);

      expect(apiClient.post).toHaveBeenCalledWith('/admin/payments', newPayment);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      const mockResponse = {
        id: '1',
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      };

      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await paymentsService.updatePaymentStatus('1', 'confirmed');

      expect(apiClient.patch).toHaveBeenCalledWith('/admin/payments/1/status', {
        status: 'confirmed',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deletePayment', () => {
    it('should delete a payment', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await paymentsService.deletePayment('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/admin/payments/1');
    });
  });
});
