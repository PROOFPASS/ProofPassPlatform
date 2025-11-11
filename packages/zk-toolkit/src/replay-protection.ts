/**
 * Replay Protection System
 *
 * Prevents reuse of ZK proofs and blockchain transactions
 * Tracks nullifiers and transaction hashes in database
 */

export interface NullifierRecord {
  nullifier: string;
  timestamp: Date;
  proofType: string;
  metadata?: Record<string, any>;
}

export interface TransactionRecord {
  txHash: string;
  blockchain: string;
  timestamp: Date;
  dataHash: string;
  metadata?: Record<string, any>;
}

/**
 * In-memory storage (for demo)
 * In production, use PostgreSQL or Redis
 */
class ReplayProtectionStore {
  private nullifiers: Map<string, NullifierRecord> = new Map();
  private transactions: Map<string, TransactionRecord> = new Map();

  /**
   * Check if a nullifier has been used before
   */
  async hasNullifier(nullifier: string): Promise<boolean> {
    return this.nullifiers.has(nullifier);
  }

  /**
   * Record a new nullifier
   */
  async recordNullifier(record: NullifierRecord): Promise<void> {
    if (this.nullifiers.has(record.nullifier)) {
      throw new Error('Nullifier already used (replay attack detected)');
    }

    this.nullifiers.set(record.nullifier, record);
  }

  /**
   * Check if a transaction has been recorded before
   */
  async hasTransaction(txHash: string): Promise<boolean> {
    return this.transactions.has(txHash);
  }

  /**
   * Record a new transaction
   */
  async recordTransaction(record: TransactionRecord): Promise<void> {
    if (this.transactions.has(record.txHash)) {
      throw new Error('Transaction already recorded (replay attack detected)');
    }

    this.transactions.set(record.txHash, record);
  }

  /**
   * Get nullifier record
   */
  async getNullifier(nullifier: string): Promise<NullifierRecord | null> {
    return this.nullifiers.get(nullifier) || null;
  }

  /**
   * Get transaction record
   */
  async getTransaction(txHash: string): Promise<TransactionRecord | null> {
    return this.transactions.get(txHash) || null;
  }

  /**
   * Cleanup old records (older than retention period)
   */
  async cleanup(retentionDays: number = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    let removed = 0;

    // Cleanup nullifiers
    for (const [key, record] of this.nullifiers.entries()) {
      if (record.timestamp < cutoff) {
        this.nullifiers.delete(key);
        removed++;
      }
    }

    // Cleanup transactions
    for (const [key, record] of this.transactions.entries()) {
      if (record.timestamp < cutoff) {
        this.transactions.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    nullifierCount: number;
    transactionCount: number;
    oldestNullifier: Date | null;
    oldestTransaction: Date | null;
  }> {
    let oldestNullifier: Date | null = null;
    let oldestTransaction: Date | null = null;

    for (const record of this.nullifiers.values()) {
      if (!oldestNullifier || record.timestamp < oldestNullifier) {
        oldestNullifier = record.timestamp;
      }
    }

    for (const record of this.transactions.values()) {
      if (!oldestTransaction || record.timestamp < oldestTransaction) {
        oldestTransaction = record.timestamp;
      }
    }

    return {
      nullifierCount: this.nullifiers.size,
      transactionCount: this.transactions.size,
      oldestNullifier,
      oldestTransaction,
    };
  }
}

// Singleton instance
const store = new ReplayProtectionStore();

/**
 * Verify and record a ZK proof nullifier
 *
 * Throws error if nullifier was already used (replay attack)
 */
export async function verifyAndRecordNullifier(
  nullifier: string,
  proofType: string,
  metadata?: Record<string, any>
): Promise<void> {
  // Check if nullifier exists
  if (await store.hasNullifier(nullifier)) {
    const existing = await store.getNullifier(nullifier);
    throw new Error(
      `Replay attack detected: Nullifier already used on ${existing?.timestamp.toISOString()}`
    );
  }

  // Record new nullifier
  await store.recordNullifier({
    nullifier,
    timestamp: new Date(),
    proofType,
    metadata,
  });
}

/**
 * Verify and record a blockchain transaction
 *
 * Throws error if transaction was already recorded (replay attack)
 */
export async function verifyAndRecordTransaction(
  txHash: string,
  blockchain: string,
  dataHash: string,
  metadata?: Record<string, any>
): Promise<void> {
  // Check if transaction exists
  if (await store.hasTransaction(txHash)) {
    const existing = await store.getTransaction(txHash);
    throw new Error(
      `Replay attack detected: Transaction already recorded on ${existing?.timestamp.toISOString()}`
    );
  }

  // Record new transaction
  await store.recordTransaction({
    txHash,
    blockchain,
    timestamp: new Date(),
    dataHash,
    metadata,
  });
}

/**
 * Check if a nullifier has been used (read-only)
 */
export async function isNullifierUsed(nullifier: string): Promise<boolean> {
  return store.hasNullifier(nullifier);
}

/**
 * Check if a transaction has been recorded (read-only)
 */
export async function isTransactionRecorded(txHash: string): Promise<boolean> {
  return store.hasTransaction(txHash);
}

/**
 * Cleanup old records
 */
export async function cleanupOldRecords(retentionDays: number = 90): Promise<number> {
  return store.cleanup(retentionDays);
}

/**
 * Get protection statistics
 */
export async function getProtectionStats() {
  return store.getStats();
}

/**
 * SQL Migration for PostgreSQL implementation
 *
 * Run this to create database tables for production:
 */
export const SQL_MIGRATION = `
-- Nullifier tracking table
CREATE TABLE IF NOT EXISTS nullifiers (
  nullifier VARCHAR(128) PRIMARY KEY,
  proof_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  INDEX idx_nullifier_timestamp (timestamp),
  INDEX idx_nullifier_type (proof_type)
);

-- Transaction tracking table
CREATE TABLE IF NOT EXISTS transactions (
  tx_hash VARCHAR(128) PRIMARY KEY,
  blockchain VARCHAR(50) NOT NULL,
  data_hash VARCHAR(64) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  INDEX idx_tx_timestamp (timestamp),
  INDEX idx_tx_blockchain (blockchain),
  INDEX idx_tx_data_hash (data_hash)
);

-- Cleanup job (run daily via cron)
-- DELETE FROM nullifiers WHERE timestamp < NOW() - INTERVAL '90 days';
-- DELETE FROM transactions WHERE timestamp < NOW() - INTERVAL '90 days';
`;

/**
 * PostgreSQL implementation (for production)
 *
 * Replace in-memory store with this:
 */
export class PostgreSQLReplayProtectionStore {
  constructor(private pool: any) {}

  async hasNullifier(nullifier: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM nullifiers WHERE nullifier = $1',
      [nullifier]
    );
    return result.rows.length > 0;
  }

  async recordNullifier(record: NullifierRecord): Promise<void> {
    try {
      await this.pool.query(
        'INSERT INTO nullifiers (nullifier, proof_type, timestamp, metadata) VALUES ($1, $2, $3, $4)',
        [record.nullifier, record.proofType, record.timestamp, JSON.stringify(record.metadata)]
      );
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('Nullifier already used (replay attack detected)');
      }
      throw error;
    }
  }

  async hasTransaction(txHash: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM transactions WHERE tx_hash = $1',
      [txHash]
    );
    return result.rows.length > 0;
  }

  async recordTransaction(record: TransactionRecord): Promise<void> {
    try {
      await this.pool.query(
        'INSERT INTO transactions (tx_hash, blockchain, data_hash, timestamp, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          record.txHash,
          record.blockchain,
          record.dataHash,
          record.timestamp,
          JSON.stringify(record.metadata),
        ]
      );
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('Transaction already recorded (replay attack detected)');
      }
      throw error;
    }
  }

  async cleanup(retentionDays: number = 90): Promise<number> {
    const nullifierResult = await this.pool.query(
      'DELETE FROM nullifiers WHERE timestamp < NOW() - INTERVAL \'$1 days\'',
      [retentionDays]
    );

    const txResult = await this.pool.query(
      'DELETE FROM transactions WHERE timestamp < NOW() - INTERVAL \'$1 days\'',
      [retentionDays]
    );

    return nullifierResult.rowCount + txResult.rowCount;
  }
}
