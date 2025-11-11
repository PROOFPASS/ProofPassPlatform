/**
 * @proofpass/blockchain
 * Multi-blockchain support for ProofPass (Optimism, Arbitrum, Stellar)
 */

// Core
export { BlockchainManager } from './blockchain-manager';
export { BlockchainProvider } from './base-provider';

// Providers
export { OptimismProvider } from './providers/optimism-provider';
export { ArbitrumProvider } from './providers/arbitrum-provider';
export { StellarProvider } from './providers/stellar-provider';

// Types
export type {
  BlockchainNetwork,
  BlockchainConfig,
  AnchorResult,
  BatchAnchorResult,
  TransactionStatus,
  VerificationResult
} from './types';
