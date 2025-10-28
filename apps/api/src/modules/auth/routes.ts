import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { register, login } from './service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  organization: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(server: FastifyInstance) {
  // Register
  server.post('/register', {
    schema: {
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 2 },
          organization: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const data = registerSchema.parse(request.body);
        const result = await register(data, server.jwt.sign);

        return reply.code(201).send(result);
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation error', details: error.errors });
        }
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  // Login
  server.post('/login', {
    schema: {
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const data = loginSchema.parse(request.body);
        const result = await login(data, server.jwt.sign);

        return reply.send(result);
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation error', details: error.errors });
        }
        return reply.code(401).send({ error: error.message });
      }
    },
  });

  // Get current user
  server.get('/me', {
    schema: {
      tags: ['auth'],
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
      return reply.send(request.user);
    },
  });
}
