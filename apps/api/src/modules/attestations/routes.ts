import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createAttestation, getAttestation, getAttestations, verifyAttestation } from './service';

const createAttestationSchema = z.object({
  subject: z.string(),
  type: z.string(),
  claims: z.record(z.any()),
  blockchain_network: z.enum(['stellar', 'optimism']).optional(),
});

export async function attestationRoutes(server: FastifyInstance) {
  // Create attestation
  server.post('/', {
    schema: {
      tags: ['attestations'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['subject', 'type', 'claims'],
        properties: {
          subject: { type: 'string' },
          type: { type: 'string' },
          claims: { type: 'object' },
          blockchain_network: { type: 'string', enum: ['stellar', 'optimism'] },
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
        const data = createAttestationSchema.parse(request.body);
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
      tags: ['attestations'],
      security: [{ bearerAuth: [] }],
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
      tags: ['attestations'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
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
      tags: ['attestations'],
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
        const result = await verifyAttestation(id);

        return reply.send(result);
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });
}
