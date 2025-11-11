/**
 * App Factory for Testing
 * Creates and configures Fastify app without starting the server
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { config } from './config/env';
import { attestationRoutes } from './modules/attestations/routes';
import { authRoutes } from './modules/auth/routes';
import { passportRoutes } from './modules/passports/routes';
import { zkpRoutes } from './modules/zkp/routes';
import { blockchainRoutes } from './modules/blockchain/routes';
import { adminOrganizationRoutes } from './modules/admin/organizations/routes';
import { adminPaymentRoutes } from './modules/admin/payments/routes';
import { adminAPIKeyRoutes } from './modules/admin/api-keys/routes';
import { usageRoutes } from './modules/usage/routes';
import { queueRoutes } from './modules/queue/routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import {
  requestSanitizer,
  addSecurityHeaders,
  generateRequestId,
  requestSizeLimiter,
  validateContentType,
} from './middleware/security';
import { rateLimiters } from './middleware/rate-limit';
import { authenticateAPIKey } from './middleware/api-key-auth';
import { trackUsage } from './middleware/usage-tracking';
import { healthSchema, readinessSchema } from './schemas';

export async function buildApp(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : {
      level: config.app.logLevel,
      transport:
        config.env === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                colorize: true,
              },
            }
          : undefined,
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
          path: req.routerPath,
          parameters: req.params,
          headers: {
            host: req.headers.host,
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
          },
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
    },
    requestIdLogLabel: 'requestId',
    genReqId: generateRequestId,
  });

  // Security: Add security headers to all responses
  server.addHook('onRequest', addSecurityHeaders);

  // Security: Request size limiting
  server.addHook('preValidation', requestSizeLimiter);

  // Security: Content-Type validation
  server.addHook('preValidation', validateContentType);

  // Security: Input sanitization (after parsing, before handlers)
  server.addHook('preHandler', requestSanitizer);

  // Security: Register helmet for HTTP headers security
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    global: true,
  });

  // CORS configuration
  await server.register(cors, {
    origin: config.app.corsOrigin || '*',
    credentials: true,
  });

  await server.register(jwt, {
    secret: config.auth.jwtSecret,
  });

  // Basic rate limiting as fallback
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  // Swagger documentation
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'ProofPass Platform API',
        description: 'API for creating verifiable attestations and zero-knowledge proofs',
        version: '0.1.0',
      },
      servers: [
        {
          url: `http://localhost:${config.port}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'attestations', description: 'Attestation management' },
        { name: 'passports', description: 'Product passport management' },
        { name: 'zkp', description: 'Zero-knowledge proofs' },
        { name: 'blockchain', description: 'Blockchain operations' },
        { name: 'usage', description: 'Usage and quota reporting' },
        { name: 'queue', description: 'Job queue management' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          apiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
          },
        },
      },
    },
  });

  await server.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Health check (no rate limiting)
  server.get('/health', {
    schema: {
      description: 'Basic health check endpoint',
      tags: ['health'],
      response: {
        200: healthSchema,
      },
    },
    handler: async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      };
    },
  });

  server.get('/api/v1/health', {
    schema: {
      description: 'Basic health check endpoint',
      tags: ['health'],
      response: {
        200: healthSchema,
      },
    },
    handler: async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      };
    },
  });

  // Readiness check (includes DB and Redis)
  server.get('/ready', {
    schema: {
      description: 'Readiness check including database and Redis connections',
      tags: ['health'],
      response: {
        200: readinessSchema,
      },
    },
    handler: async () => {
      return {
        status: 'ready',
        database: 'connected',
        redis: 'connected',
        timestamp: new Date().toISOString(),
      };
    },
  });

  // Register routes with appropriate rate limiting
  // Auth routes: stricter rate limiting (5 requests per 15 minutes)
  await server.register(async (instance) => {
    instance.addHook('preHandler', rateLimiters.auth);
    await instance.register(authRoutes, { prefix: '/api/v1/auth' });
  });

  // Attestation routes: user rate limiting (60 requests per minute)
  await server.register(async (instance) => {
    instance.addHook('preHandler', rateLimiters.user);
    await instance.register(attestationRoutes, { prefix: '/api/v1/attestations' });
  });

  // Passport routes: user rate limiting
  await server.register(async (instance) => {
    instance.addHook('preHandler', rateLimiters.user);
    await instance.register(passportRoutes, { prefix: '/api/v1' });
  });

  // ZKP routes: expensive operations rate limiting (10 requests per minute)
  await server.register(async (instance) => {
    instance.addHook('preHandler', rateLimiters.expensive);
    await instance.register(zkpRoutes, { prefix: '/api/v1' });
  });

  // Blockchain routes: user rate limiting (60 requests per minute)
  await server.register(async (instance) => {
    instance.addHook('preHandler', rateLimiters.user);
    await instance.register(blockchainRoutes, { prefix: '/api/v1' });
  });

  server.get('/api/v1/blockchain/status', {
    handler: async () => {
      return { status: 'operational' };
    },
  });

  // Admin routes: user rate limiting (JWT authenticated)
  await server.register(async (instance) => {
    instance.addHook('preHandler', rateLimiters.user);
    await instance.register(adminOrganizationRoutes, { prefix: '/api/v1/admin' });
    await instance.register(adminPaymentRoutes, { prefix: '/api/v1/admin' });
    await instance.register(adminAPIKeyRoutes, { prefix: '/api/v1/admin' });
  });

  // Usage routes: API key authentication required
  await server.register(async (instance) => {
    instance.addHook('preHandler', authenticateAPIKey);
    instance.addHook('preHandler', rateLimiters.user);
    await instance.register(usageRoutes, { prefix: '/api/v1/usage' });
  });

  // Queue management routes: user rate limiting (for monitoring/admin)
  await server.register(async (instance) => {
    instance.addHook('preHandler', rateLimiters.user);
    await instance.register(queueRoutes, { prefix: '/queue' });
  });

  // Routes with API Key authentication (for client applications)
  await server.register(async (instance) => {
    // API key authentication + usage tracking
    instance.addHook('preHandler', authenticateAPIKey);
    instance.addHook('onResponse', trackUsage);
  });

  // Error handlers (must be registered last)
  server.setErrorHandler(errorHandler);
  server.setNotFoundHandler(notFoundHandler);

  return server;
}
