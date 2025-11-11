/**
 * Advanced Rate Limiting Middleware
 * Implements per-user and per-IP rate limiting with Redis
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { redisClient } from '../config/redis';
import { RateLimitError } from './error-handler';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Global rate limit (per IP)
  global: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    keyPrefix: 'rl:global',
  },
  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    keyPrefix: 'rl:auth',
  },
  // Authenticated user actions
  user: {
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    keyPrefix: 'rl:user',
  },
  // Expensive operations (proof generation, blockchain)
  expensive: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    keyPrefix: 'rl:expensive',
  },
};

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Get identifier (user ID or IP)
    const userId = (request.user as any)?.id;
    const identifier = userId || request.ip;
    const key = `${config.keyPrefix}:${identifier}`;

    try {
      // Get current count
      const current = await redisClient.get(key);
      const count = current ? parseInt(current, 10) : 0;

      // Check if limit exceeded
      if (count >= config.max) {
        const ttl = await redisClient.ttl(key);

        reply.header('X-RateLimit-Limit', config.max);
        reply.header('X-RateLimit-Remaining', 0);
        reply.header('X-RateLimit-Reset', Date.now() + (ttl * 1000));
        reply.header('Retry-After', ttl);

        throw new RateLimitError(
          `Rate limit exceeded. Try again in ${ttl} seconds.`
        );
      }

      // Increment counter
      const newCount = await redisClient.incr(key);

      // Set expiry on first request
      if (newCount === 1) {
        await redisClient.pExpire(key, config.windowMs);
      }

      // Add rate limit headers
      reply.header('X-RateLimit-Limit', config.max);
      reply.header('X-RateLimit-Remaining', Math.max(0, config.max - newCount));
      reply.header('X-RateLimit-Reset', Date.now() + config.windowMs);

    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      // Log error but don't block request if Redis fails
      request.log.error({ err: error }, 'Rate limit check failed');
    }
  };
}

/**
 * Rate limit prehandlers for common use cases
 */
export const rateLimiters = {
  global: createRateLimiter(rateLimitConfigs.global),
  auth: createRateLimiter(rateLimitConfigs.auth),
  user: createRateLimiter(rateLimitConfigs.user),
  expensive: createRateLimiter(rateLimitConfigs.expensive),
};
