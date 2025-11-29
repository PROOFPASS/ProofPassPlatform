import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  createProductPassport,
  getProductPassport,
  getProductPassportByProductId,
  listProductPassports,
  verifyProductPassport,
  addAttestationToPassport,
} from './service';
import { passportSchema, verificationResponseSchema, errorSchema } from '../../schemas';

const createPassportSchema = z.object({
  product_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  attestation_ids: z.array(z.string().uuid()).min(1),
  blockchain_network: z
    .enum([
      'stellar-testnet',
      'stellar-mainnet',
      'optimism',
      'optimism-sepolia',
      'arbitrum',
      'arbitrum-sepolia',
    ])
    .optional(),
});

const addAttestationSchema = z.object({
  attestation_id: z.string().uuid(),
});

export async function passportRoutes(server: FastifyInstance): Promise<void> {
  // Create product passport
  server.post('/passports', {
    schema: {
      description: 'Create a new product passport by aggregating multiple attestations',
      tags: ['passports'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['product_id', 'name', 'attestation_ids'],
        properties: {
          product_id: { type: 'string', description: 'Unique product identifier' },
          name: { type: 'string', description: 'Product name' },
          description: { type: 'string', description: 'Product description' },
          attestation_ids: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            description: 'Array of attestation IDs to include'
          },
          blockchain_network: {
            type: 'string',
            enum: [
              'stellar-testnet',
              'stellar-mainnet',
              'optimism',
              'optimism-sepolia',
              'arbitrum',
              'arbitrum-sepolia',
            ],
            description: 'Blockchain network for anchoring'
          },
        },
      },
      response: {
        201: passportSchema,
        400: errorSchema,
        401: errorSchema,
      },
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    },
    handler: async (request, reply) => {
      try {
        const data = createPassportSchema.parse(request.body);
        const userId = (request.user as any).id;

        const passport = await createProductPassport(data, userId);

        return reply.code(201).send(passport);
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation error', details: error.errors });
        }
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  // Get product passport by ID
  server.get('/passports/:id', {
    schema: {
      description: 'Get a product passport by its ID (public endpoint)',
      tags: ['passports'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Passport ID' },
        },
      },
      response: {
        200: passportSchema,
        404: errorSchema,
        500: errorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const passport = await getProductPassport(id);

        if (!passport) {
          return reply.code(404).send({ error: 'Passport not found' });
        }

        return reply.send(passport);
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Get product passport by product ID
  server.get('/passports/product/:productId', {
    schema: {
      tags: ['passports'],
      params: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { productId } = request.params as { productId: string };

        const passport = await getProductPassportByProductId(productId);

        if (!passport) {
          return reply.code(404).send({ error: 'Passport not found' });
        }

        return reply.send(passport);
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // List user's product passports
  server.get('/passports', {
    schema: {
      tags: ['passports'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'number', minimum: 0, default: 0 },
        },
      },
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    },
    handler: async (request, reply) => {
      try {
        const userId = (request.user as any).id;
        const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };

        const passports = await listProductPassports(userId, limit, offset);

        return reply.send({ passports, count: passports.length });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Verify product passport
  server.get('/passports/:id/verify', {
    schema: {
      tags: ['passports'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const verificationResult = await verifyProductPassport(id);

        return reply.send(verificationResult);
      } catch (error: any) {
        if (error.message === 'Passport not found') {
          return reply.code(404).send({ error: error.message });
        }
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Add attestation to passport
  server.post('/passports/:id/attestations', {
    schema: {
      tags: ['passports'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['attestation_id'],
        properties: {
          attestation_id: { type: 'string', format: 'uuid' },
        },
      },
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = addAttestationSchema.parse(request.body);
        const userId = (request.user as any).id;

        const passport = await addAttestationToPassport(id, data.attestation_id, userId);

        return reply.send(passport);
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation error', details: error.errors });
        }
        return reply.code(400).send({ error: error.message });
      }
    },
  });
}
