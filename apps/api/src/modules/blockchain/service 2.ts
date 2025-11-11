import { BlockchainManager } from '@proofpass/blockchain';
import { config } from '../../config/env';
import type { BlockchainNetwork, AnchorResult, BatchAnchorResult, TransactionStatus, VerificationResult } from '@proofpass/blockchain';

// Initialize BlockchainManager singleton
let blockchainManager: BlockchainManager | null = null;

function getBlockchainManager(): BlockchainManager {
  if (!blockchainManager) {
    blockchainManager = new BlockchainManager();

    // Add Stellar provider if configured
    if (config.blockchain.stellar.secretKey) {
      try {
        blockchainManager.addProvider({
          network: config.blockchain.stellar.network,
          privateKey: config.blockchain.stellar.secretKey,
        });
        console.log(`✅ Stellar ${config.blockchain.stellar.network} provider initialized`);
      } catch (error: any) {
        console.warn(`⚠️  Failed to initialize Stellar provider: ${error.message}`);
      }
    }

    // Add Optimism provider if configured
    if (config.blockchain.optimism.privateKey) {
      try {
        blockchainManager.addProvider({
          network: config.blockchain.optimism.network,
          privateKey: config.blockchain.optimism.privateKey,
          rpcUrl: config.blockchain.optimism.rpcUrl,
        });
        console.log(`✅ Optimism ${config.blockchain.optimism.network} provider initialized`);
      } catch (error: any) {
        console.warn(`⚠️  Failed to initialize Optimism provider: ${error.message}`);
      }
    }

    // Add Arbitrum provider if configured
    if (config.blockchain.arbitrum.privateKey) {
      try {
        blockchainManager.addProvider({
          network: config.blockchain.arbitrum.network,
          privateKey: config.blockchain.arbitrum.privateKey,
          rpcUrl: config.blockchain.arbitrum.rpcUrl,
        });
        console.log(`✅ Arbitrum ${config.blockchain.arbitrum.network} provider initialized`);
      } catch (error: any) {
        console.warn(`⚠️  Failed to initialize Arbitrum provider: ${error.message}`);
      }
    }

    // Set default network
    const defaultNetwork = config.blockchain.defaultNetwork as BlockchainNetwork;
    try {
      blockchainManager.setDefaultNetwork(defaultNetwork);
      console.log(`✅ Default blockchain network set to: ${defaultNetwork}`);
    } catch (error: any) {
      console.error(`❌ Failed to set default network: ${error.message}`);
    }

    // Log configured networks
    const networks = blockchainManager.getNetworks();
    console.log(`📡 Configured blockchain networks: ${networks.join(', ')}`);
  }

  return blockchainManager;
}

export interface AnchorDataInput {
  data: string;
  network?: BlockchainNetwork;
  metadata?: Record<string, any>;
}

export interface AnchorDataResponse extends AnchorResult {
  network: BlockchainNetwork;
  dataHash: string;
}

/**
 * Anchor data to blockchain (any configured network)
 */
export async function anchorData(input: AnchorDataInput): Promise<AnchorDataResponse> {
  const manager = getBlockchainManager();
  const provider = manager.getProvider(input.network);

  // Create hash of the data
  const crypto = await import('crypto');
  const dataHash = crypto.createHash('sha256').update(input.data).digest('hex');

  // Anchor to blockchain
  const result = await provider.anchorData(dataHash, input.metadata);

  return {
    ...result,
    network: result.network,
    dataHash,
  };
}

/**
 * Batch anchor multiple data hashes to blockchain
 */
export async function batchAnchorData(
  dataHashes: string[],
  network?: BlockchainNetwork,
  metadata?: Record<string, any>
): Promise<BatchAnchorResult> {
  const manager = getBlockchainManager();
  const provider = manager.getProvider(network);

  return await provider.batchAnchorData(dataHashes, metadata);
}

/**
 * Get transaction status by hash
 */
export async function getTransactionStatus(
  txHash: string,
  network?: BlockchainNetwork
): Promise<TransactionStatus> {
  const manager = getBlockchainManager();
  const provider = manager.getProvider(network);

  return await provider.getTransactionStatus(txHash);
}

/**
 * Verify that data was anchored in a transaction
 */
export async function verifyAnchor(
  txHash: string,
  dataHash: string,
  network?: BlockchainNetwork
): Promise<VerificationResult> {
  const manager = getBlockchainManager();
  const provider = manager.getProvider(network);

  return await provider.verifyAnchor(txHash, dataHash);
}

/**
 * Get account balance for a blockchain network
 */
export async function getBalance(network?: BlockchainNetwork): Promise<{
  balance: string;
  network: BlockchainNetwork;
}> {
  const manager = getBlockchainManager();
  const provider = manager.getProvider(network);

  const balance = await provider.getBalance();

  return {
    balance,
    network: provider.network,
  };
}

/**
 * Estimate fee for anchoring data
 */
export async function estimateFee(
  dataCount: number = 1,
  network?: BlockchainNetwork
): Promise<{ fee: string; network: BlockchainNetwork }> {
  const manager = getBlockchainManager();
  const provider = manager.getProvider(network);

  const fee = await provider.estimateFee(dataCount);

  return {
    fee,
    network: provider.network,
  };
}

/**
 * Get blockchain info for all configured networks
 */
export function getBlockchainInfo() {
  const manager = getBlockchainManager();
  const networks = manager.getNetworks();
  const defaultNetwork = manager.getDefaultNetwork();

  return {
    networks,
    defaultNetwork,
    count: networks.length,
  };
}

/**
 * Get list of available blockchain networks
 */
export function getAvailableNetworks(): BlockchainNetwork[] {
  const manager = getBlockchainManager();
  return manager.getNetworks();
}
