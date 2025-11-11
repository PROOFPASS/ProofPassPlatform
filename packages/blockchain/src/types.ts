/**
 * Common types for multi-blockchain support
 */

export type BlockchainNetwork = 'stellar-testnet' | 'stellar-mainnet' | 'optimism' | 'optimism-sepolia' | 'arbitrum' | 'arbitrum-sepolia';

export interface BlockchainConfig {
  network: BlockchainNetwork;
  privateKey?: string;
  rpcUrl?: string;
  apiKey?: string;
}

export interface AnchorResult {
  txHash: string;
  blockNumber?: number;
  ledger?: number;
  network: BlockchainNetwork;
  timestamp: Date;
  fee: string;
  metadata?: Record<string, any>;
}

export interface BatchAnchorResult {
  txHash: string;
  blockNumber?: number;
  ledger?: number;
  network: BlockchainNetwork;
  timestamp: Date;
  fee: string;
  anchored: number;
  failed: number;
  results: Array<{
    index: number;
    success: boolean;
    hash?: string;
    error?: string;
  }>;
}

export interface TransactionStatus {
  hash: string;
  network: BlockchainNetwork;
  confirmed: boolean;
  confirmations?: number;
  blockNumber?: number;
  ledger?: number;
  timestamp?: Date;
  fee?: string;
}

export interface VerificationResult {
  valid: boolean;
  txHash: string;
  network: BlockchainNetwork;
  dataHash: string;
  timestamp?: Date;
  blockNumber?: number;
}
