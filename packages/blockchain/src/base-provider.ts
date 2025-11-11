/**
 * Base interface for blockchain providers
 * All blockchain implementations must implement this interface
 */

import {
  BlockchainNetwork,
  AnchorResult,
  BatchAnchorResult,
  TransactionStatus,
  VerificationResult
} from './types';

export abstract class BlockchainProvider {
  protected network: BlockchainNetwork;

  constructor(network: BlockchainNetwork) {
    this.network = network;
  }

  /**
   * Anchor single data hash to blockchain
   */
  abstract anchorData(dataHash: string, metadata?: Record<string, any>): Promise<AnchorResult>;

  /**
   * Anchor multiple data hashes in a single transaction (batch)
   */
  abstract batchAnchorData(dataHashes: string[], metadata?: Record<string, any>): Promise<BatchAnchorResult>;

  /**
   * Get transaction status
   */
  abstract getTransactionStatus(txHash: string): Promise<TransactionStatus>;

  /**
   * Verify that data was anchored in a specific transaction
   */
  abstract verifyAnchor(txHash: string, dataHash: string): Promise<VerificationResult>;

  /**
   * Get current balance (for fee estimation)
   */
  abstract getBalance(): Promise<string>;

  /**
   * Get network name
   */
  getNetwork(): BlockchainNetwork {
    return this.network;
  }

  /**
   * Estimate fee for anchoring operation
   */
  abstract estimateFee(dataCount?: number): Promise<string>;
}
