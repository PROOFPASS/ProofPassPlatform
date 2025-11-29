/**
 * Stellar blockchain provider
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { BlockchainProvider } from '../base-provider';
import {
  BlockchainNetwork,
  AnchorResult,
  BatchAnchorResult,
  TransactionStatus,
  VerificationResult
} from '../types';

export class StellarProvider extends BlockchainProvider {
  private server: StellarSdk.Horizon.Server;
  private keypair: StellarSdk.Keypair;
  private networkPassphrase: string;

  constructor(network: BlockchainNetwork, secretKey: string) {
    super(network);

    // Setup network
    if (network === 'stellar-testnet') {
      this.server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      this.networkPassphrase = StellarSdk.Networks.TESTNET;
    } else {
      this.server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');
      this.networkPassphrase = StellarSdk.Networks.PUBLIC;
    }

    this.keypair = StellarSdk.Keypair.fromSecret(secretKey);
  }

  async anchorData(dataHash: string, metadata?: Record<string, any>): Promise<AnchorResult> {
    try {
      const account = await this.server.loadAccount(this.keypair.publicKey());

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: 'proofpass',
            value: dataHash.slice(0, 64),
          })
        )
        .addMemo(StellarSdk.Memo.hash(Buffer.from(dataHash.slice(0, 32), 'hex')))
        .setTimeout(30)
        .build();

      transaction.sign(this.keypair);
      const result = await this.server.submitTransaction(transaction);

      return {
        txHash: result.hash,
        ledger: result.ledger,
        network: this.network,
        timestamp: new Date(),
        fee: StellarSdk.BASE_FEE,
        metadata,
      };
    } catch (error: any) {
      throw new Error(`Failed to anchor data on Stellar: ${error.message}`);
    }
  }

  async batchAnchorData(dataHashes: string[], metadata?: Record<string, any>): Promise<BatchAnchorResult> {
    try {
      const account = await this.server.loadAccount(this.keypair.publicKey());

      // Stellar allows up to 100 operations per transaction
      const MAX_OPS = Math.min(dataHashes.length, 100);
      const txBuilder = new StellarSdk.TransactionBuilder(account, {
        fee: (parseInt(StellarSdk.BASE_FEE) * MAX_OPS).toString(),
        networkPassphrase: this.networkPassphrase,
      });

      // Add manage data operations for each hash
      for (let i = 0; i < MAX_OPS; i++) {
        txBuilder.addOperation(
          StellarSdk.Operation.manageData({
            name: `proof_${i}`,
            value: dataHashes[i].slice(0, 64),
          })
        );
      }

      const transaction = txBuilder.setTimeout(30).build();
      transaction.sign(this.keypair);
      const result = await this.server.submitTransaction(transaction);

      return {
        txHash: result.hash,
        ledger: result.ledger,
        network: this.network,
        timestamp: new Date(),
        fee: (parseInt(StellarSdk.BASE_FEE) * MAX_OPS).toString(),
        anchored: MAX_OPS,
        failed: dataHashes.length - MAX_OPS,
        results: dataHashes.map((_, i) => ({
          index: i,
          success: i < MAX_OPS,
          hash: i < MAX_OPS ? dataHashes[i] : undefined,
          error: i >= MAX_OPS ? 'Exceeded max operations per transaction' : undefined,
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to batch anchor on Stellar: ${error.message}`);
    }
  }

  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    try {
      const tx = await this.server.transactions().transaction(txHash).call();

      return {
        hash: tx.hash,
        network: this.network,
        confirmed: tx.successful,
        ledger: tx.ledger_attr,
        timestamp: new Date(tx.created_at),
        fee: tx.fee_charged.toString(),
      };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return {
          hash: txHash,
          network: this.network,
          confirmed: false,
        };
      }
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  async verifyAnchor(txHash: string, dataHash: string): Promise<VerificationResult> {
    try {
      const tx = await this.server.transactions().transaction(txHash).call();

      if (!tx.successful) {
        return {
          valid: false,
          txHash,
          network: this.network,
          dataHash,
        };
      }

      // Check memo
      let memoMatches = false;
      if (tx.memo && typeof tx.memo === 'string') {
        const memoHash = Buffer.from(tx.memo, 'base64').toString('hex');
        memoMatches = memoHash === dataHash.slice(0, 32);
      }

      return {
        valid: memoMatches,
        txHash,
        network: this.network,
        dataHash,
        timestamp: new Date(tx.created_at),
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
    const account = await this.server.loadAccount(this.keypair.publicKey());
    const nativeBalance = account.balances.find(
      (balance: any) => balance.asset_type === 'native'
    );
    return nativeBalance?.balance || '0';
  }

  async estimateFee(dataCount: number = 1): Promise<string> {
    return (parseInt(StellarSdk.BASE_FEE) * dataCount).toString();
  }
}
