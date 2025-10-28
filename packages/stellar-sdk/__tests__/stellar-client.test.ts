/**
 * Unit tests for Stellar Client
 * Tests blockchain integration functionality
 */

import { StellarClient } from '../src/stellar-client';

// Mock Stellar SDK
jest.mock('@stellar/stellar-sdk', () => ({
  Keypair: {
    random: jest.fn().mockReturnValue({
      publicKey: () => 'GTEST123',
      secret: () => 'STEST123',
    }),
    fromSecret: jest.fn().mockReturnValue({
      publicKey: () => 'GTEST123',
    }),
  },
  Networks: {
    TESTNET: 'Test SDF Network ; September 2015',
    PUBLIC: 'Public Global Stellar Network ; September 2015',
  },
  BASE_FEE: '100',
  Horizon: {
    Server: jest.fn().mockImplementation(() => ({
      loadAccount: jest.fn().mockResolvedValue({
        sequenceNumber: () => '123',
        balances: [{ asset_type: 'native', balance: '1000.00' }],
      }),
      submitTransaction: jest.fn().mockResolvedValue({
        hash: 'test-tx-hash',
      }),
      transactions: jest.fn().mockReturnValue({
        transaction: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue({
            hash: 'test-tx-hash',
            source_account_sequence: '123',
            source_account: 'GTEST123',
            fee_charged: 100,
            operation_count: 1,
            created_at: new Date().toISOString(),
            successful: true,
          }),
        }),
        forAccount: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              call: jest.fn().mockResolvedValue({
                records: [],
              }),
            }),
          }),
        }),
      }),
    })),
  },
  TransactionBuilder: jest.fn().mockImplementation(() => ({
    addOperation: jest.fn().mockReturnThis(),
    addMemo: jest.fn().mockReturnThis(),
    setTimeout: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({
      sign: jest.fn(),
    }),
  })),
  Operation: {
    manageData: jest.fn(),
  },
  Memo: {
    hash: jest.fn(),
  },
}));

describe('StellarClient', () => {
  let client: StellarClient;

  beforeEach(() => {
    client = new StellarClient({
      network: 'testnet',
      secretKey: 'STEST123',
      publicKey: 'GTEST123',
    });
  });

  describe('constructor', () => {
    it('should initialize with testnet configuration', () => {
      const testnetClient = new StellarClient({
        network: 'testnet',
        secretKey: 'STEST',
        publicKey: 'GTEST',
      });
      expect(testnetClient).toBeDefined();
    });

    it('should initialize with mainnet configuration', () => {
      const mainnetClient = new StellarClient({
        network: 'mainnet',
        secretKey: 'SMAIN',
        publicKey: 'GMAIN',
      });
      expect(mainnetClient).toBeDefined();
    });
  });

  describe('getBalance', () => {
    it('should return account balance', async () => {
      const balance = await client.getBalance();
      expect(balance).toBe('1000.00');
    });
  });

  describe('getPublicKey', () => {
    it('should return public key', () => {
      const publicKey = client.getPublicKey();
      expect(publicKey).toBe('GTEST123');
    });
  });

  describe('anchorData', () => {
    it('should anchor data to blockchain', async () => {
      const result = await client.anchorData('test data');

      expect(result).toBeDefined();
      expect(result.txHash).toBe('test-tx-hash');
      expect(result.sequence).toBe('123');
      expect(result.fee).toBe('100');
    });

    it('should handle anchor errors', async () => {
      // Mock loadAccount to throw an error for this test
      const mockServer = require('@stellar/stellar-sdk').Horizon.Server;
      mockServer.mockImplementationOnce(() => ({
        loadAccount: jest.fn().mockRejectedValue(new Error('Account not found')),
        submitTransaction: jest.fn(),
        transactions: jest.fn(),
      }));

      const errorClient = new StellarClient({
        network: 'testnet',
        secretKey: 'STEST123',
        publicKey: 'GTEST123',
      });

      await expect(errorClient.anchorData('error data')).rejects.toThrow('Failed to anchor data to Stellar');
    });
  });

  describe('getTransaction', () => {
    it('should retrieve transaction by hash', async () => {
      const tx = await client.getTransaction('test-tx-hash');

      expect(tx).toBeDefined();
      expect(tx?.hash).toBe('test-tx-hash');
      expect(tx?.successful).toBe(true);
    });

    it('should return null for non-existent transaction', async () => {
      const mockServer = require('@stellar/stellar-sdk').Horizon.Server;
      mockServer.mockImplementationOnce(() => ({
        transactions: () => ({
          transaction: () => ({
            call: jest.fn().mockRejectedValue({ response: { status: 404 } }),
          }),
        }),
      }));

      const testClient = new StellarClient({
        network: 'testnet',
        secretKey: 'STEST',
        publicKey: 'GTEST',
      });

      const tx = await testClient.getTransaction('non-existent');
      expect(tx).toBeNull();
    });
  });

  describe('getTransactionHistory', () => {
    it('should retrieve transaction history', async () => {
      const history = await client.getTransactionHistory(10);
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});
