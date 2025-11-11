/**
 * DID Manager Service
 *
 * Manages storage, retrieval, and reuse of user DIDs
 */

import { pool } from '../config/database';
import * as crypto from 'crypto';
import { generateKeyPair, publicKeyToDID, secretKeyToHex, hexToSecretKey } from '@proofpass/vc-toolkit';

export interface UserDID {
  id: string;
  user_id: string;
  did: string;
  did_method: string;
  public_key: string;
  is_primary: boolean;
  created_at: Date;
  last_used_at: Date | null;
  usage_count: number;
}

export interface CreateDIDOptions {
  userId: string;
  didMethod?: 'key' | 'web';
  setPrimary?: boolean;
}

// Encryption key from environment (must be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.DID_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypt private key for storage
 */
function encryptPrivateKey(privateKey: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return IV + encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt private key from storage
 */
function decryptPrivateKey(encryptedData: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const [ivHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Create and store a new DID for a user
 */
export async function createUserDID(options: CreateDIDOptions): Promise<UserDID> {
  const { userId, didMethod = 'key', setPrimary = false } = options;

  // Generate new key pair
  const keyPair = await generateKeyPair();
  const did = publicKeyToDID(keyPair.publicKey);
  const secretKeyHex = secretKeyToHex(keyPair.secretKey);
  const publicKeyHex = Buffer.from(keyPair.publicKey).toString('hex');

  // Encrypt private key
  const encryptedSecretKey = encryptPrivateKey(secretKeyHex);

  // If setting as primary, unset any existing primary DIDs
  if (setPrimary) {
    await pool.query(
      'UPDATE user_dids SET is_primary = false WHERE user_id = $1',
      [userId]
    );
  }

  // Store DID
  const result = await pool.query(
    `INSERT INTO user_dids (user_id, did, did_method, public_key, private_key_encrypted, is_primary)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, did, didMethod, publicKeyHex, encryptedSecretKey, setPrimary]
  );

  return result.rows[0];
}

/**
 * Get user's primary DID
 */
export async function getPrimaryDID(userId: string): Promise<UserDID | null> {
  const result = await pool.query(
    'SELECT * FROM user_dids WHERE user_id = $1 AND is_primary = true',
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Get or create user's primary DID
 */
export async function getOrCreatePrimaryDID(userId: string): Promise<UserDID> {
  let primary = await getPrimaryDID(userId);

  if (!primary) {
    primary = await createUserDID({ userId, setPrimary: true });
  }

  return primary;
}

/**
 * Get all DIDs for a user
 */
export async function getUserDIDs(userId: string): Promise<UserDID[]> {
  const result = await pool.query(
    'SELECT * FROM user_dids WHERE user_id = $1 ORDER BY is_primary DESC, created_at DESC',
    [userId]
  );

  return result.rows;
}

/**
 * Get DID by ID
 */
export async function getDIDById(didId: string): Promise<UserDID | null> {
  const result = await pool.query(
    'SELECT * FROM user_dids WHERE id = $1',
    [didId]
  );

  return result.rows[0] || null;
}

/**
 * Get decrypted private key for a DID
 */
export async function getDIDPrivateKey(didId: string): Promise<Uint8Array | null> {
  const result = await pool.query(
    'SELECT private_key_encrypted FROM user_dids WHERE id = $1',
    [didId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const encryptedKey = result.rows[0].private_key_encrypted;
  const decryptedHex = decryptPrivateKey(encryptedKey);

  return hexToSecretKey(decryptedHex);
}

/**
 * Update DID usage statistics
 */
export async function updateDIDUsage(didId: string): Promise<void> {
  await pool.query(
    `UPDATE user_dids
     SET usage_count = usage_count + 1,
         last_used_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [didId]
  );
}

/**
 * Set a DID as primary
 */
export async function setPrimaryDID(userId: string, didId: string): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify DID belongs to user
    const didCheck = await client.query(
      'SELECT id FROM user_dids WHERE id = $1 AND user_id = $2',
      [didId, userId]
    );

    if (didCheck.rows.length === 0) {
      throw new Error('DID not found or does not belong to user');
    }

    // Unset all primary DIDs for user
    await client.query(
      'UPDATE user_dids SET is_primary = false WHERE user_id = $1',
      [userId]
    );

    // Set new primary
    await client.query(
      'UPDATE user_dids SET is_primary = true WHERE id = $1',
      [didId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete a DID
 */
export async function deleteDID(userId: string, didId: string): Promise<void> {
  const result = await pool.query(
    'DELETE FROM user_dids WHERE id = $1 AND user_id = $2 AND is_primary = false',
    [didId, userId]
  );

  if (result.rowCount === 0) {
    throw new Error('Cannot delete primary DID or DID not found');
  }
}

/**
 * Get DID with key pair for signing
 */
export async function getDIDForSigning(userId: string, didId?: string): Promise<{
  did: UserDID;
  keyPair: {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  };
}> {
  let did: UserDID | null;

  if (didId) {
    did = await getDIDById(didId);
    if (!did || did.user_id !== userId) {
      throw new Error('DID not found or does not belong to user');
    }
  } else {
    did = await getOrCreatePrimaryDID(userId);
  }

  const secretKey = await getDIDPrivateKey(did.id);
  if (!secretKey) {
    throw new Error('Could not decrypt private key');
  }

  const publicKey = Buffer.from(did.public_key, 'hex');

  // Update usage
  await updateDIDUsage(did.id);

  return {
    did,
    keyPair: {
      publicKey,
      secretKey
    }
  };
}
