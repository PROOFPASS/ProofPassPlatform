/**
 * Database Test Helpers
 * Utilities for setting up and tearing down test databases
 */

import { Pool } from 'pg';

let testPool: Pool | null = null;

/**
 * Create a test database pool
 */
export function createTestPool(): Pool {
  if (!testPool) {
    testPool = new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'proofpass_test',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
    });
  }
  return testPool;
}

/**
 * Close test database pool
 */
export async function closeTestPool(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

/**
 * Clean all test data from database
 */
export async function cleanDatabase(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM zk_proofs');
  await pool.query('DELETE FROM passport_attestations');
  await pool.query('DELETE FROM product_passports');
  await pool.query('DELETE FROM attestations');
  await pool.query('DELETE FROM blockchain_transactions');
  await pool.query('DELETE FROM users');
}

/**
 * Create a test user in database
 */
export async function createTestUser(
  pool: Pool,
  data: {
    email: string;
    password_hash: string;
    name: string;
    api_key_hash: string;
  }
): Promise<any> {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, api_key_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.email, data.password_hash, data.name, data.api_key_hash]
  );
  return result.rows[0];
}

/**
 * Create a test attestation in database
 */
export async function createTestAttestation(
  pool: Pool,
  userId: string,
  data: {
    subject: string;
    type: string;
    claims: any;
  }
): Promise<any> {
  const result = await pool.query(
    `INSERT INTO attestations
      (user_id, issuer_did, subject, type, claims, issued_at, credential, blockchain_network, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      userId,
      `did:proofpass:${userId}`,
      data.subject,
      data.type,
      JSON.stringify(data.claims),
      new Date().toISOString(),
      JSON.stringify({}),
      'stellar',
      'pending',
    ]
  );
  return result.rows[0];
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an operation multiple times
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await waitFor(delay);
      }
    }
  }

  throw lastError;
}
