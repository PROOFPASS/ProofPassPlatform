import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { register, login } from './service';
import {
  registerBodySchema,
  loginBodySchema,
  authResponseSchema,
  userSchema,
  errorSchema,
} from '../../schemas';

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
      description: 'Register a new user account',
      tags: ['auth'],
      body: registerBodySchema,
      response: {
        201: authResponseSchema,
        400: errorSchema,
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
      description: 'Login with email and password',
      tags: ['auth'],
      body: loginBodySchema,
      response: {
        200: authResponseSchema,
        401: errorSchema,
        400: errorSchema,
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
      description: 'Get current authenticated user information',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: userSchema,
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
      return reply.send(request.user);
    },
  });
}
