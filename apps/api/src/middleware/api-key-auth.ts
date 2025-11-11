/**
 * API Key Authentication Middleware
 * Authenticates client applications using API keys (pk_live_* or pk_test_*)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../config/database';
import bcrypt from 'bcrypt';

export async function authenticateAPIKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // 1. Extract API key from header
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.code(401).send({
      error: 'API key required',
      message: 'Please provide an API key in the X-API-Key header'
    });
  }

  // 2. Validate format (pk_live_* or pk_test_*)
  const prefix = apiKey.substring(0, 8); // pk_live_ or pk_test_

  if (!prefix.startsWith('pk_')) {
    return reply.code(401).send({
      error: 'Invalid API key format',
      message: 'API key must start with pk_live_ or pk_test_'
    });
  }

  try {
    // 3. Find key in database by prefix
    const result = await query(`
      SELECT
        ak.id,
        ak.key_hash,
        ak.is_active,
        ak.expires_at,
        o.id as org_id,
        o.status as org_status,
        o.plan_id,
        p.name as plan_name,
        p.requests_per_day,
        p.blockchain_ops_per_month
      FROM api_keys ak
      JOIN organizations o ON ak.organization_id = o.id
      JOIN plans p ON o.plan_id = p.id
      WHERE ak.key_prefix = $1
        AND ak.is_active = true
        AND o.status = 'active'
      LIMIT 1
    `, [prefix]);

    if (result.rows.length === 0) {
      return reply.code(401).send({
        error: 'Invalid API key',
        message: 'API key not found or organization is not active'
      });
    }

    const keyRecord = result.rows[0];

    // 4. Verify hash with bcrypt
    const isValid = await bcrypt.compare(apiKey, keyRecord.key_hash);

    if (!isValid) {
      return reply.code(401).send({
        error: 'Invalid API key',
        message: 'API key authentication failed'
      });
    }

    // 5. Check expiration
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return reply.code(401).send({
        error: 'API key expired',
        message: 'This API key has expired. Please generate a new one.'
      });
    }

    // 6. Check rate limits (daily)
    const usageResult = await query(`
      SELECT COUNT(*) as count
      FROM usage_records
      WHERE organization_id = $1
        AND date = CURRENT_DATE
    `, [keyRecord.org_id]);

    const todayUsage = parseInt(usageResult.rows[0].count);
    const limit = keyRecord.requests_per_day;

    // -1 means unlimited
    if (limit !== -1 && todayUsage >= limit) {
      const resetTime = new Date();
      resetTime.setHours(24, 0, 0, 0);

      return reply.code(429).send({
        error: 'Rate limit exceeded',
        message: `Daily rate limit of ${limit} requests exceeded`,
        limit,
        current: todayUsage,
        reset_at: resetTime.toISOString()
      });
    }

    // 7. Attach client info to request
    request.client = {
      orgId: keyRecord.org_id,
      apiKeyId: keyRecord.id,
      plan: keyRecord.plan_name,
      limits: {
        requestsPerDay: keyRecord.requests_per_day,
        blockchainOpsPerMonth: keyRecord.blockchain_ops_per_month
      }
    };

    // 8. Update last_used_at (fire and forget)
    query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [keyRecord.id]
    ).catch(err => request.log.error(err, 'Failed to update last_used_at'));

    // Add rate limit headers
    reply.header('X-RateLimit-Limit', limit);
    reply.header('X-RateLimit-Remaining', limit === -1 ? 999999 : Math.max(0, limit - todayUsage - 1));
    reply.header('X-RateLimit-Reset', new Date().setHours(24, 0, 0, 0));

  } catch (error) {
    request.log.error(error, 'API key authentication failed');
    return reply.code(500).send({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
}
