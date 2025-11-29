/**
 * Tests para StellarProvider
 * Coverage objetivo: 100%
 */

import { StellarProvider } from '../src/providers/stellar-provider';
import * as StellarSdk from '@stellar/stellar-sdk';

// Mock Stellar SDK - all mock functions must be created inside the factory
jest.mock('@stellar/stellar-sdk', () => {
  // Create mocks inside factory to avoid hoisting issues
  const mockPublicKey = jest.fn(() => 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
  const mockLoadAccount = jest.fn();
  const mockSubmitTransaction = jest.fn();
  const mockCall = jest.fn();
  const mockTransaction = jest.fn(() => ({ call: mockCall }));
  const mockTransactions = jest.fn(() => ({ transaction: mockTransaction }));

  const mockKeypair = {
    publicKey: mockPublicKey,
  };

  const mockServer = {
    loadAccount: mockLoadAccount,
    submitTransaction: mockSubmitTransaction,
    transactions: mockTransactions,
  };

  return {
    __esModule: true,
    Horizon: {
      Server: jest.fn(() => mockServer),
    },
    Keypair: {
      fromSecret: jest.fn(() => mockKeypair),
    },
    Networks: {
      TESTNET: 'Test SDF Network ; September 2015',
      PUBLIC: 'Public Global Stellar Network ; September 2015',
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
      manageData: jest.fn((params) => ({ name: params.name, value: params.value })),
    },
    Memo: {
      hash: jest.fn((buffer) => `memo_${buffer.toString('hex')}`),
    },
    BASE_FEE: '100',
    // Expose mock functions for tests
    __mocks: {
      mockCall,
      mockLoadAccount,
      mockSubmitTransaction,
      mockPublicKey,
    },
  };
});

// Access the mock functions after the mock is set up
const getMocks = () => (StellarSdk as any).__mocks;

describe('StellarProvider', () => {
  let provider: StellarProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    const mocks = getMocks();
    mocks.mockCall.mockReset();
    mocks.mockLoadAccount.mockReset();
    mocks.mockSubmitTransaction.mockReset();
    provider = new StellarProvider('stellar-testnet', 'SCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
  });

  describe('Constructor', () => {
    it('debe crear provider para Stellar Testnet', () => {
      expect(StellarSdk.Horizon.Server).toHaveBeenCalledWith('https://horizon-testnet.stellar.org');
      expect(provider.getNetwork()).toBe('stellar-testnet');
    });

    it('debe crear provider para Stellar Mainnet', () => {
      new StellarProvider('stellar-mainnet', 'SCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
      expect(StellarSdk.Horizon.Server).toHaveBeenCalledWith('https://horizon.stellar.org');
    });
  });

  describe('anchorData', () => {
    it('debe anclar datos correctamente', async () => {
      const mocks = getMocks();
      const mockAccount = {
        sequenceNumber: jest.fn(() => '123'),
      };

      mocks.mockLoadAccount.mockResolvedValue(mockAccount);
      mocks.mockSubmitTransaction.mockResolvedValue({
        hash: 'stellar_tx_hash_123',
        ledger: 12345,
      });

      const result = await provider.anchorData('abc123def456', { source: 'test' });

      expect(mocks.mockLoadAccount).toHaveBeenCalledWith(mocks.mockPublicKey());
      expect(StellarSdk.TransactionBuilder).toHaveBeenCalled();
      expect(StellarSdk.Operation.manageData).toHaveBeenCalledWith({
        name: 'proofpass',
        value: 'abc123def456',
      });

      expect(result).toMatchObject({
        txHash: 'stellar_tx_hash_123',
        ledger: 12345,
        network: 'stellar-testnet',
        fee: '100',
        metadata: { source: 'test' },
      });
    });

    it('debe lanzar error si falla el anclaje', async () => {
      const mocks = getMocks();
      mocks.mockLoadAccount.mockRejectedValue(new Error('Account not found'));

      await expect(provider.anchorData('abc123')).rejects.toThrow('Failed to anchor data on Stellar');
    });
  });

  describe('batchAnchorData', () => {
    it('debe anclar múltiples hashes (hasta 100)', async () => {
      const mocks = getMocks();
      const hashes = Array.from({ length: 50 }, (_, i) => `hash${i}`);
      const mockAccount = {
        sequenceNumber: jest.fn(() => '123'),
      };

      mocks.mockLoadAccount.mockResolvedValue(mockAccount);
      mocks.mockSubmitTransaction.mockResolvedValue({
        hash: 'stellar_batch_hash',
        ledger: 12346,
      });

      const result = await provider.batchAnchorData(hashes, { batch: true });

      expect(mocks.mockLoadAccount).toHaveBeenCalled();
      expect(result).toMatchObject({
        txHash: 'stellar_batch_hash',
        ledger: 12346,
        network: 'stellar-testnet',
        anchored: 50,
        failed: 0,
      });

      expect(result.results).toHaveLength(50);
      expect(result.results[0]).toMatchObject({
        index: 0,
        success: true,
        hash: 'hash0',
      });
    });

    it('debe limitar a 100 operaciones por transacción', async () => {
      const mocks = getMocks();
      const hashes = Array.from({ length: 150 }, (_, i) => `hash${i}`);
      const mockAccount = {
        sequenceNumber: jest.fn(() => '123'),
      };

      mocks.mockLoadAccount.mockResolvedValue(mockAccount);
      mocks.mockSubmitTransaction.mockResolvedValue({
        hash: 'stellar_batch_hash',
        ledger: 12346,
      });

      const result = await provider.batchAnchorData(hashes);

      expect(result.anchored).toBe(100);
      expect(result.failed).toBe(50);
      expect(result.results).toHaveLength(150);

      // Verificar que los primeros 100 son exitosos
      expect(result.results[99].success).toBe(true);
      // Y los siguientes fallan
      expect(result.results[100].success).toBe(false);
      expect(result.results[100].error).toBe('Exceeded max operations per transaction');
    });

    it('debe lanzar error si batch anchor falla', async () => {
      const mocks = getMocks();
      mocks.mockLoadAccount.mockRejectedValue(new Error('Network error'));

      await expect(provider.batchAnchorData(['hash1', 'hash2'])).rejects.toThrow(
        'Failed to batch anchor on Stellar'
      );
    });
  });

  describe('getTransactionStatus', () => {
    it('debe retornar status de transacción confirmada', async () => {
      const mocks = getMocks();
      const mockTx = {
        hash: 'stellar_tx_hash',
        successful: true,
        ledger_attr: 12345,
        created_at: '2024-01-01T00:00:00Z',
        fee_charged: '100',
      };

      mocks.mockCall.mockResolvedValue(mockTx);

      const result = await provider.getTransactionStatus('stellar_tx_hash');

      expect(result).toMatchObject({
        hash: 'stellar_tx_hash',
        network: 'stellar-testnet',
        confirmed: true,
        ledger: 12345,
        fee: '100',
      });
    });

    it('debe retornar not confirmed si transacción no existe (404)', async () => {
      const mocks = getMocks();
      const error: any = new Error('Not found');
      error.response = { status: 404 };
      mocks.mockCall.mockRejectedValue(error);

      const result = await provider.getTransactionStatus('not_found');

      expect(result).toMatchObject({
        hash: 'not_found',
        network: 'stellar-testnet',
        confirmed: false,
      });
    });

    it('debe lanzar error para otros errores', async () => {
      const mocks = getMocks();
      mocks.mockCall.mockRejectedValue(new Error('Network error'));

      await expect(provider.getTransactionStatus('error_tx')).rejects.toThrow(
        'Failed to get transaction status'
      );
    });
  });

  describe('verifyAnchor', () => {
    it('debe verificar anchor correctamente', async () => {
      const mocks = getMocks();
      // The memo should match the first 32 chars of the dataHash when converted from base64
      const dataHash = 'abc123def456789012345678901234567890';
      const mockTx = {
        hash: 'stellar_tx_hash',
        successful: true,
        memo: Buffer.from(dataHash.slice(0, 32), 'hex').toString('base64'),
        created_at: '2024-01-01T00:00:00Z',
      };

      mocks.mockCall.mockResolvedValue(mockTx);

      const result = await provider.verifyAnchor('stellar_tx_hash', dataHash);

      expect(result).toMatchObject({
        valid: true,
        txHash: 'stellar_tx_hash',
        network: 'stellar-testnet',
        dataHash: dataHash,
      });
    });

    it('debe retornar invalid si transacción no fue exitosa', async () => {
      const mocks = getMocks();
      const mockTx = {
        hash: 'stellar_tx_hash',
        successful: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      mocks.mockCall.mockResolvedValue(mockTx);

      const result = await provider.verifyAnchor('stellar_tx_hash', 'abc123');

      expect(result).toMatchObject({
        valid: false,
        txHash: 'stellar_tx_hash',
        network: 'stellar-testnet',
        dataHash: 'abc123',
      });
    });

    it('debe retornar invalid si el memo no coincide', async () => {
      const mocks = getMocks();
      const mockTx = {
        hash: 'stellar_tx_hash',
        successful: true,
        memo: Buffer.from('00000000000000000000000000000000', 'hex').toString('base64'),
        created_at: '2024-01-01T00:00:00Z',
      };

      mocks.mockCall.mockResolvedValue(mockTx);

      const result = await provider.verifyAnchor('stellar_tx_hash', 'ffffffffffffffffffffffffffffffff');

      expect(result.valid).toBe(false);
    });

    it('debe manejar errores y retornar invalid', async () => {
      const mocks = getMocks();
      mocks.mockCall.mockRejectedValue(new Error('Error'));

      const result = await provider.verifyAnchor('error_tx', 'hash');

      expect(result).toMatchObject({
        valid: false,
        txHash: 'error_tx',
        network: 'stellar-testnet',
        dataHash: 'hash',
      });
    });
  });

  describe('getBalance', () => {
    it('debe retornar el balance nativo', async () => {
      const mocks = getMocks();
      const mockAccount = {
        balances: [
          { asset_type: 'native', balance: '1000.5000000' },
          { asset_type: 'credit_alphanum4', balance: '500' },
        ],
      };

      mocks.mockLoadAccount.mockResolvedValue(mockAccount);

      const balance = await provider.getBalance();

      expect(balance).toBe('1000.5000000');
    });

    it('debe retornar 0 si no hay balance nativo', async () => {
      const mocks = getMocks();
      const mockAccount = {
        balances: [
          { asset_type: 'credit_alphanum4', balance: '500' },
        ],
      };

      mocks.mockLoadAccount.mockResolvedValue(mockAccount);

      const balance = await provider.getBalance();

      expect(balance).toBe('0');
    });
  });

  describe('estimateFee', () => {
    it('debe estimar fee para una operación', async () => {
      const fee = await provider.estimateFee(1);

      expect(fee).toBe('100'); // BASE_FEE * 1
    });

    it('debe estimar fee para múltiples operaciones', async () => {
      const fee = await provider.estimateFee(10);

      expect(fee).toBe('1000'); // BASE_FEE * 10
    });

    it('debe estimar fee para batch de 100', async () => {
      const fee = await provider.estimateFee(100);

      expect(fee).toBe('10000'); // BASE_FEE * 100
    });
  });
});
