import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  generateZKProof,
  getZKProof,
  listZKProofs,
  verifyZKProof,
  getProofsForAttestation,
} from './service';
import { zkProofSchema, zkVerificationResponseSchema, errorSchema } from '../../schemas';

const generateProofSchema = z.object({
  attestation_id: z.string().uuid(),
  circuit_type: z.enum(['threshold', 'range', 'set_membership']),
  private_inputs: z.record(z.any()),
  public_inputs: z.record(z.any()),
});

export async function zkpRoutes(server: FastifyInstance): Promise<void> {
  // Generate ZK proof
  server.post('/zkp/proofs', {
    schema: {
      description: 'Generate a zero-knowledge proof from an attestation',
      tags: ['zkp'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['attestation_id', 'circuit_type', 'private_inputs', 'public_inputs'],
        properties: {
          attestation_id: { type: 'string', format: 'uuid', description: 'Attestation ID to create proof from' },
          circuit_type: {
            type: 'string',
            enum: ['threshold', 'range', 'set_membership'],
            description: 'Type of ZK circuit to use'
          },
          private_inputs: { type: 'object', description: 'Private inputs (not revealed in proof)' },
          public_inputs: { type: 'object', description: 'Public inputs (revealed in proof)' },
        },
      },
      response: {
        201: zkProofSchema,
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
        const data = generateProofSchema.parse(request.body);
        const userId = (request.user as any).id;

        const proof = await generateZKProof(data, userId);

        return reply.code(201).send(proof);
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation error', details: error.errors });
        }
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  // Get ZK proof by ID
  server.get('/zkp/proofs/:id', {
    schema: {
      tags: ['zkp'],
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

        const proof = await getZKProof(id);

        if (!proof) {
          return reply.code(404).send({ error: 'Proof not found' });
        }

        return reply.send(proof);
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // List user's ZK proofs
  server.get('/zkp/proofs', {
    schema: {
      tags: ['zkp'],
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

        const proofs = await listZKProofs(userId, limit, offset);

        return reply.send({ proofs, count: proofs.length });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Verify ZK proof
  server.get('/zkp/proofs/:id/verify', {
    schema: {
      description: 'Verify a zero-knowledge proof (public endpoint)',
      tags: ['zkp'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Proof ID to verify' },
        },
      },
      response: {
        200: zkVerificationResponseSchema,
        404: errorSchema,
        500: errorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const result = await verifyZKProof(id);

        return reply.send(result);
      } catch (error: any) {
        if (error.message === 'Proof not found') {
          return reply.code(404).send({ error: error.message });
        }
        return reply.code(500).send({ error: error.message });
      }
    },
  });

  // Get proofs for attestation
  server.get('/attestations/:attestationId/proofs', {
    schema: {
      tags: ['zkp'],
      params: {
        type: 'object',
        properties: {
          attestationId: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { attestationId } = request.params as { attestationId: string };

        const proofs = await getProofsForAttestation(attestationId);

        return reply.send({ proofs, count: proofs.length });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  });
}
