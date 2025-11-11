/**
 * Admin - API Keys Routes
 */

import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../../middleware/rbac';
import {
  generateAPIKey,
  listAPIKeys,
  getAPIKey,
  deactivateAPIKey,
  reactivateAPIKey,
  deleteAPIKey,
  getAPIKeyUsage,
  rotateAPIKey,
} from './service';

export async function adminAPIKeyRoutes(server: FastifyInstance) {
  // Generate new API key
  server.post('/api-keys', {
    schema: {
      description: 'Generate a new API key for an organization (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['organization_id', 'user_id', 'name', 'environment'],
        properties: {
          organization_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          name: { type: 'string', minLength: 1 },
          environment: { type: 'string', enum: ['live', 'test'] },
          expires_at: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            apiKey: { type: 'object' },
            plainKey: {
              type: 'string',
              description: 'IMPORTANT: This is shown only once. Save it securely!'
            }
          }
        }
      }
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      try {
        const data = request.body as any;

        if (data.expires_at) {
          data.expires_at = new Date(data.expires_at);
        }

        const result = await generateAPIKey(data);

        return reply.code(201).send({
          ...result,
          warning: 'IMPORTANT: The plainKey is shown only once. Save it securely!'
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });

  // List API keys for organization
  server.get('/api-keys', {
    schema: {
      description: 'List API keys for an organization (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['organization_id'],
        properties: {
          organization_id: { type: 'string', format: 'uuid' },
          include_inactive: { type: 'boolean', default: false }
        }
      }
    },
    preHandler: requireAdmin,
    handler: async (request) => {
      const { organization_id, include_inactive } = request.query as any;
      const apiKeys = await listAPIKeys(organization_id, include_inactive);
      return { apiKeys };
    }
  });

  // Get API key by ID
  server.get('/api-keys/:id', {
    schema: {
      description: 'Get API key details (admin only)',
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
      const apiKey = await getAPIKey(id);

      if (!apiKey) {
        return reply.code(404).send({ error: 'API key not found' });
      }

      return apiKey;
    }
  });

  // Deactivate API key
  server.patch('/api-keys/:id/deactivate', {
    schema: {
      description: 'Deactivate an API key (admin only)',
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
      try {
        const { id } = request.params as { id: string };
        const apiKey = await deactivateAPIKey(id);
        return reply.send(apiKey);
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });

  // Reactivate API key
  server.patch('/api-keys/:id/reactivate', {
    schema: {
      description: 'Reactivate an API key (admin only)',
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
      try {
        const { id } = request.params as { id: string };
        const apiKey = await reactivateAPIKey(id);
        return reply.send(apiKey);
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });

  // Delete API key
  server.delete('/api-keys/:id', {
    schema: {
      description: 'Permanently delete an API key (admin only)',
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
      try {
        const { id } = request.params as { id: string };
        await deleteAPIKey(id);
        return reply.code(204).send();
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });

  // Get API key usage
  server.get('/api-keys/:id/usage', {
    schema: {
      description: 'Get API key usage statistics (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'number', default: 30, minimum: 1, maximum: 365 }
        }
      }
    },
    preHandler: requireAdmin,
    handler: async (request) => {
      const { id } = request.params as { id: string };
      const { days } = request.query as any;

      const usage = await getAPIKeyUsage(id, days || 30);
      return usage;
    }
  });

  // Rotate API key
  server.post('/api-keys/:id/rotate', {
    schema: {
      description: 'Rotate an API key (generate new one and deactivate old one)',
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
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1 }
        }
      }
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { name } = request.body as any;

        const result = await rotateAPIKey(id, name);

        return reply.code(201).send({
          ...result,
          warning: 'IMPORTANT: The plainKey is shown only once. Save it securely!'
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ error: error.message });
      }
    }
  });
}
