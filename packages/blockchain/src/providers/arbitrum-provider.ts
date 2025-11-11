/**
 * Arbitrum (Ethereum L2) blockchain provider
 */

import { ethers } from 'ethers';
import { createHash } from 'crypto';
import { BlockchainProvider } from '../base-provider';
import {
  BlockchainNetwork,
  AnchorResult,
  BatchAnchorResult,
  TransactionStatus,
  VerificationResult
} from '../types';

export class ArbitrumProvider extends BlockchainProvider {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private chainId: number;

  constructor(network: BlockchainNetwork, privateKey: string, rpcUrl?: string) {
    super(network);

    // Setup network
    if (network === 'arbitrum') {
      this.chainId = 42161; // Arbitrum One
      this.provider = new ethers.JsonRpcProvider(
        rpcUrl || 'https://arb1.arbitrum.io/rpc'
      );
    } else {
      this.chainId = 421614; // Arbitrum Sepolia
      this.provider = new ethers.JsonRpcProvider(
        rpcUrl || 'https://sepolia-rollup.arbitrum.io/rpc'
      );
    }

    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  async anchorData(dataHash: string, metadata?: Record<string, any>): Promise<AnchorResult> {
    try {
      const tx = await this.wallet.sendTransaction({
        to: this.wallet.address,
        value: 0,
        data: '0x' + dataHash,
      });

      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not available');
      }

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        network: this.network,
        timestamp: new Date(),
        fee: (receipt.gasUsed * receipt.gasPrice).toString(),
        metadata,
      };
    } catch (error: any) {
      throw new Error(`Failed to anchor data on Arbitrum: ${error.message}`);
    }
  }

  async batchAnchorData(dataHashes: string[], metadata?: Record<string, any>): Promise<BatchAnchorResult> {
    try {
      const combinedData = '0x' + dataHashes.join('');

      const tx = await this.wallet.sendTransaction({
        to: this.wallet.address,
        value: 0,
        data: combinedData,
      });

      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not available');
      }

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        network: this.network,
        timestamp: new Date(),
        fee: (receipt.gasUsed * receipt.gasPrice).toString(),
        anchored: dataHashes.length,
        failed: 0,
        results: dataHashes.map((hash, i) => ({
          index: i,
          success: true,
          hash,
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to batch anchor on Arbitrum: ${error.message}`);
    }
  }

  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!tx) {
        return {
          hash: txHash,
          network: this.network,
          confirmed: false,
        };
      }

      const block = tx.blockNumber ? await this.provider.getBlock(tx.blockNumber) : null;

      return {
        hash: txHash,
        network: this.network,
        confirmed: receipt !== null,
        confirmations: receipt ? await this.provider.getBlockNumber() - receipt.blockNumber : 0,
        blockNumber: receipt?.blockNumber,
        timestamp: block ? new Date(block.timestamp * 1000) : undefined,
        fee: receipt ? (receipt.gasUsed * receipt.gasPrice).toString() : undefined,
      };
    } catch (error: any) {
      return {
        hash: txHash,
        network: this.network,
        confirmed: false,
      };
    }
  }

  async verifyAnchor(txHash: string, dataHash: string): Promise<VerificationResult> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!tx || !receipt) {
        return {
          valid: false,
          txHash,
          network: this.network,
          dataHash,
        };
      }

      const txData = tx.data.toLowerCase();
      const valid = txData.includes(dataHash.toLowerCase());

      const block = tx.blockNumber ? await this.provider.getBlock(tx.blockNumber) : null;

      return {
        valid,
        txHash,
        network: this.network,
        dataHash,
        timestamp: block ? new Date(block.timestamp * 1000) : undefined,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      return {
        valid: false,
        txHash,
        network: this.network,
        dataHash,
      };
    }
  }

  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  async estimateFee(dataCount: number = 1): Promise<string> {
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits('0.1', 'gwei');

    const estimatedGas = 21000 + (dataCount * 1000);

    return (gasPrice * BigInt(estimatedGas)).toString();
  }
}
