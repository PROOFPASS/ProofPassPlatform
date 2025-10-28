import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { config } from './config/env';
import { connectRedis } from './config/redis';
import { pool } from './config/database';
import { attestationRoutes } from './modules/attestations/routes';
import { authRoutes } from './modules/auth/routes';
import { passportRoutes } from './modules/passports/routes';
import { zkpRoutes } from './modules/zkp/routes';

const server = Fastify({
  logger: {
    level: config.app.logLevel,
    transport:
      config.env === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

async function start() {
  try {
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
    });

    // CORS configuration
    await server.register(cors, {
      origin: config.app.corsOrigin,
      credentials: true,
    });

    await server.register(jwt, {
      secret: config.auth.jwtSecret,
    });

    await server.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
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

    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await server.register(authRoutes, { prefix: '/api/v1/auth' });
    await server.register(attestationRoutes, { prefix: '/api/v1/attestations' });
    await server.register(passportRoutes, { prefix: '/api/v1' });
    await server.register(zkpRoutes, { prefix: '/api/v1' });

    // Connect to Redis
    await connectRedis();

    // Test database connection
    await pool.query('SELECT NOW()');
    server.log.info('Database connected successfully');

    // Start server
    await server.listen({ port: config.port, host: '0.0.0.0' });
    server.log.info(`Server running on http://localhost:${config.port}`);
    server.log.info(`API Documentation: http://localhost:${config.port}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    server.log.info(`Received ${signal}, closing server...`);
    await server.close();
    await pool.end();
    process.exit(0);
  });
});

start();
