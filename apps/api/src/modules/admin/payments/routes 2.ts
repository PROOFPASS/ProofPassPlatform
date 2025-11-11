/**
 * Admin - Payments Routes
 */

import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../../middleware/rbac';
import {
  createPayment,
  listPayments,
  getPayment,
  updatePaymentStatus,
  getPaymentStats,
  getPendingPayments,
} from './service';

export async function adminPaymentRoutes(server: FastifyInstance) {
  // Create payment
  server.post('/payments', {
    schema: {
      description: 'Register a new payment (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['organization_id', 'amount', 'payment_date', 'payment_method'],
        properties: {
          organization_id: { type: 'string', format: 'uuid' },
          amount: { type: 'number', minimum: 0 },
          currency: { type: 'string', default: 'USD', maxLength: 3 },
          payment_date: { type: 'string', format: 'date' },
          payment_method: { type: 'string' },
          reference_number: { type: 'string' },
          period_start: { type: 'string', format: 'date' },
          period_end: { type: 'string', format: 'date' },
          notes: { type: 'string' },
          proof_url: { type: 'string', format: 'uri' },
          auto_extend_subscription: { type: 'boolean', default: true }
        }
      }
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
        const user = request.user as any;
        (request as any).userId = user.id;
      } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = (request as any).userId;
        const payment = await createPayment(request.body as any, userId);
        return reply.code(201).send(payment);
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });

  // List payments
  server.get('/payments', {
    schema: {
      description: 'List all payments (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          organization_id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'rejected'] },
          payment_method: { type: 'string' },
          from_date: { type: 'string', format: 'date' },
          to_date: { type: 'string', format: 'date' },
          limit: { type: 'number', default: 50, minimum: 1, maximum: 100 },
          offset: { type: 'number', default: 0, minimum: 0 }
        }
      }
    },
    preHandler: requireAdmin,
    handler: async (request) => {
      const filters = request.query as any;

      // Convert date strings to Date objects
      if (filters.from_date) filters.from_date = new Date(filters.from_date);
      if (filters.to_date) filters.to_date = new Date(filters.to_date);

      const result = await listPayments(filters);
      return result;
    }
  });

  // Get payment by ID
  server.get('/payments/:id', {
    schema: {
      description: 'Get payment details (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const payment = await getPayment(id);

      if (!payment) {
        return reply.code(404).send({ error: 'Payment not found' });
      }

      return payment;
    }
  });

  // Update payment status
  server.patch('/payments/:id/status', {
    schema: {
      description: 'Update payment status (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['pending', 'confirmed', 'rejected'] }
        }
      }
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
        const user = request.user as any;
        (request as any).userId = user.id;
      } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { status } = request.body as any;
        const userId = (request as any).userId;

        const payment = await updatePaymentStatus(id, status, userId);
        return reply.send(payment);
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });

  // Get payment statistics
  server.get('/payments/stats', {
    schema: {
      description: 'Get payment statistics (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          organization_id: { type: 'string', format: 'uuid' },
          from_date: { type: 'string', format: 'date' },
          to_date: { type: 'string', format: 'date' }
        }
      }
    },
    preHandler: requireAdmin,
    handler: async (request) => {
      const filters = request.query as any;

      if (filters.from_date) filters.from_date = new Date(filters.from_date);
      if (filters.to_date) filters.to_date = new Date(filters.to_date);

      const stats = await getPaymentStats(filters);
      return stats;
    }
  });

  // Get pending payments
  server.get('/payments/pending', {
    schema: {
      description: 'Get pending payments awaiting confirmation (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }]
    },
    preHandler: requireAdmin,
    handler: async () => {
      const payments = await getPendingPayments();
      return { payments };
    }
  });
}
