export interface StellarConfig {
  network: 'testnet' | 'mainnet';
  secretKey: string;
  publicKey: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface AnchorDataResult {
  txHash: string;
  sequence: string;
  fee: string;
  timestamp: Date;
  ledger?: number;
}

export interface BatchAnchorResult {
  txHash: string;
  sequence: string;
  fee: string;
  timestamp: Date;
  anchored: number;
  ledger?: number;
}

export interface AnchorMetadata {
  type?: string;
  version?: string;
  [key: string]: any;
}

export interface TransactionInfo {
  hash: string;
  memo?: string;
  sequence: string;
  sourceAccount: string;
  feeCharged: string;
  operationCount: number;
  createdAt: Date;
  successful: boolean;
  ledger?: number;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}
