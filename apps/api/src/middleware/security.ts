/**
 * Security Middleware
 * Input sanitization, request validation, and security checks
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { ValidationError } from './error-handler';

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .trim();
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check for SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b.*=.*|'\s*OR\s*'1'\s*=\s*'1)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Request sanitization middleware
 */
export async function requestSanitizer(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Sanitize query parameters
  if (request.query && typeof request.query === 'object') {
    const sanitizedQuery: Record<string, any> = {};
    for (const [key, value] of Object.entries(request.query)) {
      if (typeof value === 'string') {
        // Check for SQL injection
        if (detectSQLInjection(value)) {
          throw new ValidationError('Invalid input detected');
        }
        sanitizedQuery[key] = sanitizeString(value);
      } else {
        sanitizedQuery[key] = value;
      }
    }
    request.query = sanitizedQuery;
  }

  // Sanitize body (for string fields only, preserve structured data)
  if (request.body && typeof request.body === 'object') {
    sanitizeObject(request.body);
  }
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Check for SQL injection
      if (detectSQLInjection(value)) {
        throw new ValidationError('Invalid input detected');
      }
      // Only sanitize if it's not a special field (like passwords, hashes, etc.)
      if (!key.includes('password') && !key.includes('hash') && !key.includes('proof')) {
        obj[key] = sanitizeString(value);
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitizeObject(value);
    }
  }
}

/**
 * Request size limiter
 */
export async function requestSizeLimiter(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const contentLength = request.headers['content-length'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength && parseInt(contentLength, 10) > maxSize) {
    throw new ValidationError('Request body too large', {
      maxSize: '10MB',
      received: contentLength,
    });
  }
}

/**
 * API Key validation and rotation check
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  // API key format validation
  const apiKeyRegex = /^[a-f0-9]{64}$/i;
  if (!apiKeyRegex.test(apiKey)) {
    return false;
  }

  // Additional validation logic can be added here
  // e.g., check expiration, rotation status, etc.

  return true;
}

/**
 * Content-Type validation
 */
export async function validateContentType(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers['content-type'];

    if (!contentType) {
      throw new ValidationError('Content-Type header required');
    }

    if (!contentType.includes('application/json')) {
      throw new ValidationError('Content-Type must be application/json');
    }
  }
}

/**
 * Request ID generator
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Security headers configuration
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

/**
 * Add security headers to response
 */
export async function addSecurityHeaders(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  Object.entries(securityHeaders).forEach(([header, value]) => {
    reply.header(header, value);
  });

  // Add request ID to response
  reply.header('X-Request-ID', request.id);
}
