import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createAttestation, getAttestation, getAttestations, verifyAttestation } from './service';
import {
  createAttestationBodySchema,
  attestationSchema,
  attestationListResponseSchema,
  verificationResponseSchema,
  errorSchema,
} from '../../schemas';
import type { CreateAttestationDTO } from '@proofpass/types';

const createAttestationSchema = z.object({
  subject: z.string(),
  type: z.string(),
  claims: z.record(z.any()),
  blockchain_network: z.enum([
    'stellar-testnet',
    'stellar-mainnet',
    'optimism',
    'optimism-sepolia',
    'arbitrum',
    'arbitrum-sepolia',
  ]).optional(),
});

export async function attestationRoutes(server: FastifyInstance) {
  // Create attestation
  server.post('/', {
    schema: {
      description: 'Create a new W3C Verifiable Credential attestation and anchor it to the blockchain',
      tags: ['attestations'],
      security: [{ bearerAuth: [] }],
      body: createAttestationBodySchema,
      response: {
        201: attestationSchema,
        400: errorSchema,
        401: errorSchema,
        500: errorSchema,
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
        const data = createAttestationSchema.parse(request.body) as CreateAttestationDTO;
        const user = request.user as any;
        const attestation = await createAttestation(data, user.id);

        return reply.code(201).send(attestation);
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation error', details: error.errors });
        }
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Get all attestations for user
  server.get('/', {
    schema: {
      description: 'Get all attestations created by the authenticated user',
      tags: ['attestations'],
      security: [{ bearerAuth: [] }],
      response: {
        200: attestationListResponseSchema,
        401: errorSchema,
        500: errorSchema,
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
        const user = request.user as any;
        const attestations = await getAttestations(user.id);

        return reply.send({ attestations });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Get specific attestation
  server.get('/:id', {
    schema: {
      description: 'Get a specific attestation by ID',
      tags: ['attestations'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Attestation ID' },
        },
      },
      response: {
        200: attestationSchema,
        401: errorSchema,
        404: errorSchema,
        500: errorSchema,
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
        const user = request.user as any;
        const attestation = await getAttestation(id, user.id);

        if (!attestation) {
          return reply.code(404).send({ error: 'Attestation not found' });
        }

        return reply.send(attestation);
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Verify attestation (public endpoint)
  server.post('/:id/verify', {
    schema: {
      description: 'Verify the authenticity and blockchain anchor of an attestation (public endpoint)',
      tags: ['attestations'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Attestation ID to verify' },
        },
      },
      response: {
        200: verificationResponseSchema,
        500: errorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await verifyAttestation(id);

        return reply.send(result);
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });
}
