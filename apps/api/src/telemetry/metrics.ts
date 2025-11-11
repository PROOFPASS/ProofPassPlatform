/**
 * Custom Metrics for ProofPass API
 * Business-specific metrics using OpenTelemetry
 */

import { metrics } from '@opentelemetry/api';
import type { Counter, Histogram, ObservableGauge } from '@opentelemetry/api';

interface MetricsCollection {
  // Request metrics
  httpRequestsTotal: Counter;
  httpRequestDuration: Histogram;
  httpRequestSize: Histogram;
  httpResponseSize: Histogram;

  // Business metrics
  vcIssuedTotal: Counter;
  vcVerifiedTotal: Counter;
  vcVerificationFailures: Counter;
  didOperationsTotal: Counter;

  // API Key metrics
  apiKeyRequestsTotal: Counter;
  apiKeyQuotaExceeded: Counter;

  // Database metrics
  dbQueryDuration: Histogram;
  dbConnectionsActive: ObservableGauge;

  // Redis metrics
  redisOperationsDuration: Histogram;
  redisConnectionErrors: Counter;

  // Blockchain metrics
  stellarTransactionsTotal: Counter;
  stellarTransactionDuration: Histogram;
  stellarTransactionFailures: Counter;
}

let metricsInstance: MetricsCollection | null = null;

export function initializeMetrics(): MetricsCollection {
  if (metricsInstance) {
    return metricsInstance;
  }

  const meter = metrics.getMeter('proofpass-api', '1.0.0');

  // HTTP Request Metrics
  const httpRequestsTotal = meter.createCounter('http_requests_total', {
    description: 'Total number of HTTP requests',
  });

  const httpRequestDuration = meter.createHistogram('http_request_duration_ms', {
    description: 'HTTP request duration in milliseconds',
    unit: 'ms',
  });

  const httpRequestSize = meter.createHistogram('http_request_size_bytes', {
    description: 'HTTP request size in bytes',
    unit: 'bytes',
  });

  const httpResponseSize = meter.createHistogram('http_response_size_bytes', {
    description: 'HTTP response size in bytes',
    unit: 'bytes',
  });

  // Business Metrics - Verifiable Credentials
  const vcIssuedTotal = meter.createCounter('vc_issued_total', {
    description: 'Total number of Verifiable Credentials issued',
  });

  const vcVerifiedTotal = meter.createCounter('vc_verified_total', {
    description: 'Total number of Verifiable Credentials verified',
  });

  const vcVerificationFailures = meter.createCounter('vc_verification_failures_total', {
    description: 'Total number of VC verification failures',
  });

  const didOperationsTotal = meter.createCounter('did_operations_total', {
    description: 'Total number of DID operations (create, resolve, update)',
  });

  // API Key Metrics
  const apiKeyRequestsTotal = meter.createCounter('api_key_requests_total', {
    description: 'Total number of requests per API key',
  });

  const apiKeyQuotaExceeded = meter.createCounter('api_key_quota_exceeded_total', {
    description: 'Total number of quota exceeded events',
  });

  // Database Metrics
  const dbQueryDuration = meter.createHistogram('db_query_duration_ms', {
    description: 'Database query duration in milliseconds',
    unit: 'ms',
  });

  const dbConnectionsActive = meter.createObservableGauge('db_connections_active', {
    description: 'Number of active database connections',
  });

  // Redis Metrics
  const redisOperationsDuration = meter.createHistogram('redis_operation_duration_ms', {
    description: 'Redis operation duration in milliseconds',
    unit: 'ms',
  });

  const redisConnectionErrors = meter.createCounter('redis_connection_errors_total', {
    description: 'Total number of Redis connection errors',
  });

  // Blockchain Metrics
  const stellarTransactionsTotal = meter.createCounter('stellar_transactions_total', {
    description: 'Total number of Stellar transactions',
  });

  const stellarTransactionDuration = meter.createHistogram('stellar_transaction_duration_ms', {
    description: 'Stellar transaction duration in milliseconds',
    unit: 'ms',
  });

  const stellarTransactionFailures = meter.createCounter('stellar_transaction_failures_total', {
    description: 'Total number of failed Stellar transactions',
  });

  metricsInstance = {
    httpRequestsTotal,
    httpRequestDuration,
    httpRequestSize,
    httpResponseSize,
    vcIssuedTotal,
    vcVerifiedTotal,
    vcVerificationFailures,
    didOperationsTotal,
    apiKeyRequestsTotal,
    apiKeyQuotaExceeded,
    dbQueryDuration,
    dbConnectionsActive,
    redisOperationsDuration,
    redisConnectionErrors,
    stellarTransactionsTotal,
    stellarTransactionDuration,
    stellarTransactionFailures,
  };

  return metricsInstance;
}

export function getMetrics(): MetricsCollection {
  if (!metricsInstance) {
    return initializeMetrics();
  }
  return metricsInstance;
}

// Helper functions for common metric recording patterns
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  durationMs: number,
  requestSize?: number,
  responseSize?: number
): void {
  const metrics = getMetrics();

  const attributes = {
    method,
    route,
    status_code: statusCode.toString(),
    status_class: `${Math.floor(statusCode / 100)}xx`,
  };

  metrics.httpRequestsTotal.add(1, attributes);
  metrics.httpRequestDuration.record(durationMs, attributes);

  if (requestSize) {
    metrics.httpRequestSize.record(requestSize, attributes);
  }

  if (responseSize) {
    metrics.httpResponseSize.record(responseSize, attributes);
  }
}

export function recordVCIssued(credentialType: string, issuerDid: string): void {
  const metrics = getMetrics();
  metrics.vcIssuedTotal.add(1, {
    credential_type: credentialType,
    issuer: issuerDid,
  });
}

export function recordVCVerified(success: boolean, verifierDid?: string): void {
  const metrics = getMetrics();
  if (success) {
    metrics.vcVerifiedTotal.add(1, { verifier: verifierDid || 'unknown' });
  } else {
    metrics.vcVerificationFailures.add(1, { verifier: verifierDid || 'unknown' });
  }
}

export function recordDIDOperation(operation: 'create' | 'resolve' | 'update', method: string): void {
  const metrics = getMetrics();
  metrics.didOperationsTotal.add(1, {
    operation,
    did_method: method,
  });
}

export function recordAPIKeyRequest(apiKeyId: string, tier: string, quotaExceeded: boolean): void {
  const metrics = getMetrics();
  metrics.apiKeyRequestsTotal.add(1, {
    api_key_id: apiKeyId,
    tier,
  });

  if (quotaExceeded) {
    metrics.apiKeyQuotaExceeded.add(1, {
      api_key_id: apiKeyId,
      tier,
    });
  }
}

export function recordDBQuery(operation: string, table: string, durationMs: number): void {
  const metrics = getMetrics();
  metrics.dbQueryDuration.record(durationMs, {
    operation,
    table,
  });
}

export function recordRedisOperation(operation: string, durationMs: number, error?: boolean): void {
  const metrics = getMetrics();
  metrics.redisOperationsDuration.record(durationMs, { operation });

  if (error) {
    metrics.redisConnectionErrors.add(1, { operation });
  }
}

export function recordStellarTransaction(
  operation: string,
  success: boolean,
  durationMs: number
): void {
  const metrics = getMetrics();
  metrics.stellarTransactionsTotal.add(1, { operation, success: success.toString() });
  metrics.stellarTransactionDuration.record(durationMs, { operation });

  if (!success) {
    metrics.stellarTransactionFailures.add(1, { operation });
  }
}
