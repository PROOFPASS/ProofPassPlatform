/**
 * OpenTelemetry Middleware for Fastify
 * Automatic tracing and metrics for HTTP requests
 */

import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';
import { recordHttpRequest } from './metrics';

const tracer = trace.getTracer('proofpass-api-http');

export interface TelemetryMiddlewareOptions {
  enableTracing: boolean;
  enableMetrics: boolean;
  ignoreRoutes?: string[];
}

const defaultOptions: TelemetryMiddlewareOptions = {
  enableTracing: true,
  enableMetrics: true,
  ignoreRoutes: ['/health', '/metrics', '/ready'],
};

/**
 * Middleware para tracking automático de requests HTTP con OpenTelemetry
 */
export function telemetryMiddleware(
  options: Partial<TelemetryMiddlewareOptions> = {}
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  const config = { ...defaultOptions, ...options };

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const startTime = Date.now();
    const route = request.routeOptions?.url || request.url;

    // Skip ignored routes
    if (config.ignoreRoutes?.some((ignored) => route.startsWith(ignored))) {
      return;
    }

    let span: Span | undefined;

    // Start tracing span
    if (config.enableTracing) {
      span = tracer.startSpan(`HTTP ${request.method} ${route}`, {
        attributes: {
          'http.method': request.method,
          'http.url': request.url,
          'http.route': route,
          'http.user_agent': request.headers['user-agent'] || 'unknown',
          'http.client_ip': request.ip,
        },
      });

      // Set span as active context
      context.with(trace.setSpan(context.active(), span), () => {
        // Request is processed within this context
      });
    }

    // Store span reference for use in response handling
    // Note: In a real implementation, you'd use request.telemetry.span
    (request as any)._telemetrySpan = span;
    (request as any)._telemetryStartTime = startTime;
    (request as any)._telemetryConfig = config;
    (request as any)._telemetryRoute = route;
  };
}

/**
 * Plugin de Fastify para integrar OpenTelemetry
 */
export async function telemetryPlugin(
  fastify: FastifyInstance,
  options: Partial<TelemetryMiddlewareOptions> = {}
): Promise<void> {
  const config = { ...defaultOptions, ...options };

  fastify.addHook('onRequest', telemetryMiddleware(options));

  // Hook para registrar cuando la respuesta termine
  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
    const span = (request as any)._telemetrySpan as Span | undefined;
    const startTime = (request as any)._telemetryStartTime as number | undefined;
    const route = (request as any)._telemetryRoute as string | undefined;

    if (!startTime || !route) return payload;

    const duration = Date.now() - startTime;
    const statusCode = reply.statusCode;

    // Record metrics
    if (config.enableMetrics) {
      const requestSize = request.headers['content-length']
        ? parseInt(request.headers['content-length'], 10)
        : undefined;

      const responseSize = payload ? Buffer.byteLength(String(payload)) : undefined;

      recordHttpRequest(request.method, route, statusCode, duration, requestSize, responseSize);
    }

    // Update span with response data
    if (span) {
      span.setAttributes({
        'http.status_code': statusCode,
        'http.response_content_length': reply.getHeader('content-length') || 0,
      });

      // Set span status based on HTTP status code
      if (statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${statusCode}`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      span.end();
    }

    return payload;
  });

  // Hook para manejar errores
  fastify.addHook('onError', async (request: FastifyRequest, _reply: FastifyReply, error: Error) => {
    const span = (request as any)._telemetrySpan as Span | undefined;
    if (span) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }
  });

  // Agregar contexto de telemetría al request
  fastify.decorateRequest('telemetry', {
    span: null,
    tracer,
  });
}

/**
 * Helper para crear custom spans manualmente
 */
export function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const span = tracer.startSpan(name, { attributes });

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Get current active span
 */
export function getCurrentSpan() {
  return trace.getSpan(context.active());
}

/**
 * Add event to current span
 */
export function addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>) {
  const span = getCurrentSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Add attribute to current span
 */
export function setSpanAttribute(key: string, value: string | number | boolean) {
  const span = getCurrentSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}
