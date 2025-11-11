/**
 * Blockchain Manager - Choose where to persist data
 */

import { BlockchainProvider } from './base-provider';
import { StellarProvider } from './providers/stellar-provider';
import { OptimismProvider } from './providers/optimism-provider';
import { ArbitrumProvider } from './providers/arbitrum-provider';
import { BlockchainConfig, BlockchainNetwork } from './types';

export class BlockchainManager {
  private providers: Map<BlockchainNetwork, BlockchainProvider>;
  private defaultNetwork?: BlockchainNetwork;

  constructor() {
    this.providers = new Map();
  }

  /**
   * Add a blockchain provider
   */
  addProvider(config: BlockchainConfig): void {
    let provider: BlockchainProvider;

    switch (config.network) {
      case 'stellar-testnet':
      case 'stellar-mainnet':
        if (!config.privateKey) {
          throw new Error('Stellar requires privateKey');
        }
        provider = new StellarProvider(config.network, config.privateKey);
        break;

      case 'optimism':
      case 'optimism-sepolia':
        if (!config.privateKey) {
          throw new Error('Optimism requires privateKey');
        }
        provider = new OptimismProvider(config.network, config.privateKey, config.rpcUrl);
        break;

      case 'arbitrum':
      case 'arbitrum-sepolia':
        if (!config.privateKey) {
          throw new Error('Arbitrum requires privateKey');
        }
        provider = new ArbitrumProvider(config.network, config.privateKey, config.rpcUrl);
        break;

      default:
        throw new Error(`Unsupported network: ${config.network}`);
    }

    this.providers.set(config.network, provider);

    // Set first provider as default
    if (!this.defaultNetwork) {
      this.defaultNetwork = config.network;
    }
  }

  /**
   * Get a specific blockchain provider
   */
  getProvider(network?: BlockchainNetwork): BlockchainProvider {
    const targetNetwork = network || this.defaultNetwork;

    if (!targetNetwork) {
      throw new Error('No blockchain providers configured');
    }

    const provider = this.providers.get(targetNetwork);

    if (!provider) {
      throw new Error(`Provider not found for network: ${targetNetwork}`);
    }

    return provider;
  }

  /**
   * Set default network
   */
  setDefaultNetwork(network: BlockchainNetwork): void {
    if (!this.providers.has(network)) {
      throw new Error(`Provider not configured for network: ${network}`);
    }
    this.defaultNetwork = network;
  }

  /**
   * Get all configured networks
   */
  getNetworks(): BlockchainNetwork[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get default network
   */
  getDefaultNetwork(): BlockchainNetwork | undefined {
    return this.defaultNetwork;
  }

  /**
   * Remove a provider
   */
  removeProvider(network: BlockchainNetwork): void {
    this.providers.delete(network);

    if (this.defaultNetwork === network) {
      this.defaultNetwork = this.providers.keys().next().value;
    }
  }
}
