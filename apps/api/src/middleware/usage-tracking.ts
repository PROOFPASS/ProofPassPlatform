/**
 * Usage Tracking Middleware
 * Tracks API usage for billing and analytics
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../config/database';

// Credit costs per operation type
const CREDIT_COSTS = {
  'blockchain_anchor': 10,
  'attestation_create': 5,
  'passport_create': 3,
  'zkp_generate': 20,
  'api_call': 1,
} as const;

/**
 * Determine operation type from request path and method
 */
function getOperationType(path: string, method: string): keyof typeof CREDIT_COSTS {
  if (path.includes('/blockchain/anchor')) return 'blockchain_anchor';
  if (path.includes('/attestations') && method === 'POST') return 'attestation_create';
  if (path.includes('/passports') && method === 'POST') return 'passport_create';
  if (path.includes('/zkp') && method === 'POST') return 'zkp_generate';
  return 'api_call';
}

/**
 * Track usage middleware
 * Call this in onResponse hook to track after request completes
 */
export async function trackUsage(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const client = request.client;

  // Only track if request is authenticated with API key
  if (!client) {
    return;
  }

  try {
    // Determine operation type
    const path = request.routerPath || request.url;
    const operationType = getOperationType(path, request.method);
    const creditsUsed = CREDIT_COSTS[operationType] || 1;

    // Insert usage record
    await query(`
      INSERT INTO usage_records (
        organization_id,
        api_key_id,
        endpoint,
        method,
        status_code,
        operation_type,
        credits_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      client.orgId,
      client.apiKeyId,
      path,
      request.method,
      reply.statusCode,
      operationType,
      creditsUsed
    ]);

    // Update aggregates (async, don't wait)
    updateAggregates(
      client.orgId,
      operationType,
      creditsUsed,
      reply.statusCode,
      request.log
    ).catch(err =>
      request.log.error(err, 'Failed to update usage aggregates')
    );

  } catch (error) {
    // Don't fail the request if tracking fails
    request.log.error(error, 'Usage tracking failed');
  }
}

/**
 * Update daily aggregates for organization
 */
async function updateAggregates(
  orgId: string,
  operationType: string,
  credits: number,
  statusCode: number,
  logger: any
): Promise<void> {
  const isBlockchainOp = operationType === 'blockchain_anchor';
  const isAttestation = operationType === 'attestation_create';

  const status2xx = statusCode >= 200 && statusCode < 300 ? 1 : 0;
  const status4xx = statusCode >= 400 && statusCode < 500 ? 1 : 0;
  const status5xx = statusCode >= 500 ? 1 : 0;

  try {
    await query(`
      INSERT INTO usage_aggregates (
        organization_id,
        date,
        total_requests,
        blockchain_ops,
        attestations_created,
        total_credits_used,
        requests_2xx,
        requests_4xx,
        requests_5xx
      ) VALUES ($1, CURRENT_DATE, 1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (organization_id, date)
      DO UPDATE SET
        total_requests = usage_aggregates.total_requests + 1,
        blockchain_ops = usage_aggregates.blockchain_ops + $2,
        attestations_created = usage_aggregates.attestations_created + $3,
        total_credits_used = usage_aggregates.total_credits_used + $4,
        requests_2xx = usage_aggregates.requests_2xx + $5,
        requests_4xx = usage_aggregates.requests_4xx + $6,
        requests_5xx = usage_aggregates.requests_5xx + $7,
        updated_at = NOW()
    `, [
      orgId,
      isBlockchainOp ? 1 : 0,
      isAttestation ? 1 : 0,
      credits,
      status2xx,
      status4xx,
      status5xx
    ]);
  } catch (error) {
    logger.error(error, 'Failed to update aggregates');
  }
}
