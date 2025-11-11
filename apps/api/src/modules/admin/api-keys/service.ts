/**
 * Admin - API Keys Service
 * Generate and manage API keys for organizations
 */

import { query } from '../../../config/database';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export interface APIKey {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  expires_at?: Date;
  last_used_at?: Date;
  created_at: Date;
}

export interface CreateAPIKeyDTO {
  organization_id: string;
  user_id: string;
  name: string;
  environment: 'live' | 'test';
  expires_at?: Date;
}

/**
 * Generate a new API key
 */
export async function generateAPIKey(data: CreateAPIKeyDTO): Promise<{
  apiKey: APIKey;
  plainKey: string; // Return plain key only once!
}> {
  // Generate random key
  const prefix = data.environment === 'live' ? 'pk_live_' : 'pk_test_';
  const randomBytes = crypto.randomBytes(32);
  const plainKey = prefix + randomBytes.toString('base64url');

  // Hash key for storage
  const keyHash = await bcrypt.hash(plainKey, 10);

  // Insert into database
  const result = await query(`
    INSERT INTO api_keys (
      organization_id,
      user_id,
      name,
      key_prefix,
      key_hash,
      is_active,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, true, $6)
    RETURNING id, organization_id, user_id, name, key_prefix, is_active, expires_at, created_at
  `, [
    data.organization_id,
    data.user_id,
    data.name,
    prefix,
    keyHash,
    data.expires_at
  ]);

  return {
    apiKey: result.rows[0],
    plainKey // IMPORTANT: Only returned once!
  };
}

/**
 * List API keys for an organization
 */
export async function listAPIKeys(
  organizationId: string,
  includeInactive = false
): Promise<APIKey[]> {
  let queryStr = `
    SELECT
      id,
      organization_id,
      user_id,
      name,
      key_prefix,
      is_active,
      expires_at,
      last_used_at,
      created_at
    FROM api_keys
    WHERE organization_id = $1
  `;

  const params: any[] = [organizationId];

  if (!includeInactive) {
    queryStr += ' AND is_active = true';
  }

  queryStr += ' ORDER BY created_at DESC';

  const result = await query(queryStr, params);
  return result.rows;
}

/**
 * Get API key by ID
 */
export async function getAPIKey(keyId: string): Promise<APIKey | null> {
  const result = await query(`
    SELECT
      id,
      organization_id,
      user_id,
      name,
      key_prefix,
      is_active,
      expires_at,
      last_used_at,
      created_at
    FROM api_keys
    WHERE id = $1
  `, [keyId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Deactivate an API key
 */
export async function deactivateAPIKey(keyId: string): Promise<APIKey> {
  const result = await query(`
    UPDATE api_keys
    SET is_active = false
    WHERE id = $1
    RETURNING id, organization_id, user_id, name, key_prefix, is_active, expires_at, last_used_at, created_at
  `, [keyId]);

  if (result.rows.length === 0) {
    throw new Error('API key not found');
  }

  return result.rows[0];
}

/**
 * Reactivate an API key
 */
export async function reactivateAPIKey(keyId: string): Promise<APIKey> {
  const result = await query(`
    UPDATE api_keys
    SET is_active = true
    WHERE id = $1
    RETURNING id, organization_id, user_id, name, key_prefix, is_active, expires_at, last_used_at, created_at
  `, [keyId]);

  if (result.rows.length === 0) {
    throw new Error('API key not found');
  }

  return result.rows[0];
}

/**
 * Delete an API key permanently
 */
export async function deleteAPIKey(keyId: string): Promise<void> {
  await query('DELETE FROM api_keys WHERE id = $1', [keyId]);
}

/**
 * Get API key usage statistics
 */
export async function getAPIKeyUsage(keyId: string, days = 30): Promise<{
  total_requests: number;
  last_used_at?: Date;
  daily_usage: Array<{ date: Date; requests: number }>;
}> {
  // Total requests
  const totalResult = await query(`
    SELECT COUNT(*) as total_requests
    FROM usage_records
    WHERE api_key_id = $1
      AND date >= CURRENT_DATE - INTERVAL '${days} days'
  `, [keyId]);

  // Last used
  const lastUsedResult = await query(`
    SELECT last_used_at
    FROM api_keys
    WHERE id = $1
  `, [keyId]);

  // Daily usage
  const dailyResult = await query(`
    SELECT
      date,
      COUNT(*) as requests
    FROM usage_records
    WHERE api_key_id = $1
      AND date >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY date
    ORDER BY date DESC
  `, [keyId]);

  return {
    total_requests: parseInt(totalResult.rows[0].total_requests),
    last_used_at: lastUsedResult.rows[0]?.last_used_at,
    daily_usage: dailyResult.rows
  };
}

/**
 * Rotate API key (generate new one and deactivate old one)
 */
export async function rotateAPIKey(
  oldKeyId: string,
  newKeyName: string
): Promise<{
  newApiKey: APIKey;
  plainKey: string;
  oldKeyDeactivated: boolean;
}> {
  // Get old key info
  const oldKey = await getAPIKey(oldKeyId);
  if (!oldKey) {
    throw new Error('API key not found');
  }

  // Generate new key
  const environment = oldKey.key_prefix.includes('live') ? 'live' : 'test';
  const { apiKey, plainKey } = await generateAPIKey({
    organization_id: oldKey.organization_id,
    user_id: oldKey.user_id,
    name: newKeyName,
    environment,
    expires_at: oldKey.expires_at
  });

  // Deactivate old key
  await deactivateAPIKey(oldKeyId);

  return {
    newApiKey: apiKey,
    plainKey,
    oldKeyDeactivated: true
  };
}
