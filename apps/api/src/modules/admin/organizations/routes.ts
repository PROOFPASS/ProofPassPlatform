/**
 * Admin - Organizations Routes
 */

import { FastifyInstance } from 'fastify';
import {
  createOrganization,
  listOrganizations,
  getOrganization,
  updateOrganization,
  updateOrganizationPlan,
  updateOrganizationStatus,
  getOrganizationUsage,
  deleteOrganization,
} from './service';
import { requireAdmin } from '../../../middleware/rbac';

// Cast middleware to any to avoid Fastify's strict type inference issues with custom preHandlers
const adminPreHandler = requireAdmin as any;

export async function adminOrganizationRoutes(server: FastifyInstance) {
  // Create organization
  server.post('/organizations', {
    schema: {
      description: 'Create a new organization (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          plan_id: { type: 'string', format: 'uuid' },
          billing_email: { type: 'string', format: 'email' },
          billing_contact: { type: 'string' },
          country: { type: 'string', minLength: 2, maxLength: 2 },
          subscription_start: { type: 'string', format: 'date-time' },
          subscription_end: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            status: { type: 'string' },
            created_at: { type: 'string' }
          }
        }
      }
    },
    preHandler: adminPreHandler,
    handler: async (request, reply) => {
      try {
        const org = await createOrganization(request.body as any);
        return reply.code(201).send(org);
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });

  // List organizations
  server.get('/organizations', {
    schema: {
      description: 'List all organizations (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'suspended', 'cancelled'] },
          plan: { type: 'string' },
          limit: { type: 'number', default: 50, minimum: 1, maximum: 100 },
          offset: { type: 'number', default: 0, minimum: 0 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            organizations: { type: 'array' },
            total: { type: 'number' }
          }
        }
      }
    },
    preHandler: adminPreHandler,
    handler: async (request) => {
      const result = await listOrganizations(request.query as any);
      return result;
    }
  });

  // Get organization by ID
  server.get('/organizations/:id', {
    schema: {
      description: 'Get organization details (admin only)',
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
    preHandler: adminPreHandler,
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const org = await getOrganization(id);

      if (!org) {
        return reply.code(404).send({ error: 'Organization not found' });
      }

      return org;
    }
  });

  // Update organization
  server.patch('/organizations/:id', {
    schema: {
      description: 'Update organization (admin only)',
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
        properties: {
          name: { type: 'string' },
          billing_email: { type: 'string', format: 'email' },
          billing_contact: { type: 'string' },
          billing_address: { type: 'string' },
          tax_id: { type: 'string' },
          country: { type: 'string', minLength: 2, maxLength: 2 },
          payment_method: { type: 'string' },
          payment_notes: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    },
    preHandler: adminPreHandler,
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const org = await updateOrganization(id, request.body as any);
        return reply.send(org);
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });

  // Update organization plan
  server.patch('/organizations/:id/plan', {
    schema: {
      description: 'Update organization plan (admin only)',
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
        required: ['plan_id'],
        properties: {
          plan_id: { type: 'string', format: 'uuid' },
          subscription_end: { type: 'string', format: 'date-time' }
        }
      }
    },
    preHandler: adminPreHandler,
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { plan_id, subscription_end } = request.body as any;

        const org = await updateOrganizationPlan(
          id,
          plan_id,
          subscription_end ? new Date(subscription_end) : undefined
        );

        return reply.send(org);
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });

  // Update organization status
  server.patch('/organizations/:id/status', {
    schema: {
      description: 'Update organization status (admin only)',
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
          status: { type: 'string', enum: ['active', 'suspended', 'cancelled'] }
        }
      }
    },
    preHandler: adminPreHandler,
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { status } = request.body as any;

        const org = await updateOrganizationStatus(id, status);
        return reply.send(org);
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });

  // Get organization usage
  server.get('/organizations/:id/usage', {
    schema: {
      description: 'Get organization usage statistics (admin only)',
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
    preHandler: adminPreHandler,
    handler: async (request) => {
      const { id } = request.params as { id: string };
      const usage = await getOrganizationUsage(id);
      return usage;
    }
  });

  // Delete organization
  server.delete('/organizations/:id', {
    schema: {
      description: 'Delete organization (soft delete - sets status to cancelled)',
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
    preHandler: adminPreHandler,
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        await deleteOrganization(id);
        return reply.code(204).send();
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });
}
