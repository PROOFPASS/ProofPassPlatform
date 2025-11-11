import * as StellarSdk from '@stellar/stellar-sdk';
import {
  StellarConfig,
  AnchorDataResult,
  BatchAnchorResult,
  TransactionInfo,
  AnchorMetadata,
  RetryOptions
} from './types';
import crypto from 'crypto';

export class StellarClient {
  private server: StellarSdk.Horizon.Server;
  private keypair: StellarSdk.Keypair;
  private network: StellarSdk.Networks;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(config: StellarConfig) {
    // Setup network
    if (config.network === 'testnet') {
      this.server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      this.network = StellarSdk.Networks.TESTNET;
    } else {
      this.server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');
      this.network = StellarSdk.Networks.PUBLIC;
    }

    // Setup keypair
    this.keypair = StellarSdk.Keypair.fromSecret(config.secretKey);

    // Setup retry configuration
    this.maxRetries = config.maxRetries || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<string> {
    const account = await this.server.loadAccount(this.keypair.publicKey());
    const nativeBalance = account.balances.find(
      (balance: any) => balance.asset_type === 'native'
    );
    return nativeBalance?.balance || '0';
  }

  /**
   * Create a new Stellar account (for testing purposes)
   * In production, accounts should be created via Stellar's account creation flow
   */
  static async createTestAccount(network: 'testnet' | 'mainnet' = 'testnet'): Promise<{
    publicKey: string;
    secretKey: string;
  }> {
    if (network === 'mainnet') {
      throw new Error('Cannot create test accounts on mainnet');
    }

    const keypair = StellarSdk.Keypair.random();

    // Fund account using Friendbot (testnet only)
    try {
      await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(keypair.publicKey())}`
      );

      return {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
      };
    } catch (error) {
      throw new Error(`Failed to create test account: ${error}`);
    }
  }

  /**
   * Anchor attestation data to Stellar blockchain
   * This creates a hash of the data and stores it in the memo field
   */
  async anchorData(data: string): Promise<AnchorDataResult> {
    try {
      // Create hash of the data
      const dataHash = crypto.createHash('sha256').update(data).digest('hex');

      // Load account to get sequence number
      const account = await this.server.loadAccount(this.keypair.publicKey());

      // Build transaction
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.network,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: 'proofpass',
            value: dataHash.slice(0, 64), // Max 64 bytes
          })
        )
        .addMemo(StellarSdk.Memo.hash(Buffer.from(dataHash.slice(0, 32), 'hex')))
        .setTimeout(30)
        .build();

      // Sign transaction
      transaction.sign(this.keypair);

      // Submit transaction
      const result = await this.server.submitTransaction(transaction);

      return {
        txHash: result.hash,
        sequence: account.sequenceNumber(),
        fee: StellarSdk.BASE_FEE,
        timestamp: new Date(),
      };
    } catch (error: any) {
      throw new Error(`Failed to anchor data to Stellar: ${error.message}`);
    }
  }

  /**
   * Query transaction by hash
   */
  async getTransaction(txHash: string): Promise<TransactionInfo | null> {
    try {
      const tx = await this.server.transactions().transaction(txHash).call();

      return {
        hash: tx.hash,
        memo: tx.memo,
        sequence: tx.source_account_sequence,
        sourceAccount: tx.source_account,
        feeCharged: tx.fee_charged.toString(),
        operationCount: tx.operation_count,
        createdAt: new Date(tx.created_at),
        successful: tx.successful,
      };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to query transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction history for this account
   */
  async getTransactionHistory(limit: number = 10): Promise<TransactionInfo[]> {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(this.keypair.publicKey())
        .limit(limit)
        .order('desc')
        .call();

      return transactions.records.map((tx: any) => ({
        hash: tx.hash,
        memo: tx.memo,
        sequence: tx.source_account_sequence,
        sourceAccount: tx.source_account,
        feeCharged: tx.fee_charged,
        operationCount: tx.operation_count,
        createdAt: new Date(tx.created_at),
        successful: tx.successful,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  /**
   * Verify that data was anchored in a specific transaction
   */
  async verifyAnchor(txHash: string, data: string): Promise<boolean> {
    try {
      const tx = await this.getTransaction(txHash);
      if (!tx || !tx.successful) {
        return false;
      }

      // Create hash of the data
      const dataHash = crypto.createHash('sha256').update(data).digest('hex');

      // Check if memo matches
      if (tx.memo && typeof tx.memo === 'string') {
        const memoHash = Buffer.from(tx.memo, 'base64').toString('hex');
        return memoHash === dataHash.slice(0, 32);
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get public key
   */
  getPublicKey(): string {
    return this.keypair.publicKey();
  }
}
