/**
 * Centralized Error Handler Middleware
 * Provides consistent error responses and logging
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';

  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class InternalError extends Error {
  statusCode = 500;
  code = 'INTERNAL_ERROR';

  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalError';
  }
}

/**
 * Global error handler
 */
export async function errorHandler(
  error: FastifyError | AppError | ZodError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log error with context
  request.log.error({
    err: error,
    url: request.url,
    method: request.method,
    userId: (request.user as any)?.id,
    ip: request.ip,
  }, 'Request error');

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
      requestId: request.id,
    });
  }

  // Handle custom app errors
  if ('statusCode' in error && error.statusCode) {
    return reply.code(error.statusCode).send({
      error: error.name,
      code: (error as AppError).code || 'ERROR',
      message: error.message,
      details: (error as AppError).details,
      requestId: request.id,
    });
  }

  // Handle Fastify errors
  if ('statusCode' in error) {
    return reply.code(error.statusCode || 500).send({
      error: error.name,
      code: error.code || 'ERROR',
      message: error.message,
      requestId: request.id,
    });
  }

  // Handle unknown errors
  return reply.code(500).send({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
    requestId: request.id,
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
  reply.code(404).send({
    error: 'Not Found',
    code: 'NOT_FOUND',
    message: `Route ${request.method} ${request.url} not found`,
    requestId: request.id,
  });
}
