/**
 * Tests para ArbitrumProvider
 * Coverage objetivo: 100%
 */

import { ArbitrumProvider } from '../src/providers/arbitrum-provider';
import { ethers } from 'ethers';

// Mock ethers (mismo mock que Optimism)
jest.mock('ethers', () => {
  const mockWallet = {
    address: '0x1234567890123456789012345678901234567890',
    sendTransaction: jest.fn(),
  };

  const mockProvider = {
    getBalance: jest.fn(),
    getFeeData: jest.fn(),
    getTransaction: jest.fn(),
    getTransactionReceipt: jest.fn(),
    getBlock: jest.fn(),
    getBlockNumber: jest.fn(),
  };

  return {
    ethers: {
      JsonRpcProvider: jest.fn(() => mockProvider),
      Wallet: jest.fn(() => mockWallet),
      formatEther: jest.fn((value: bigint) => (Number(value) / 1e18).toString()),
      parseUnits: jest.fn((value: string) => BigInt(Math.floor(parseFloat(value) * 1e9))),
    },
  };
});

describe('ArbitrumProvider', () => {
  let provider: ArbitrumProvider;
  let mockWallet: any;
  let mockJsonRpcProvider: any;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new ArbitrumProvider('arbitrum-sepolia', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    mockWallet = (ethers.Wallet as jest.Mock).mock.results[0]?.value;
    mockJsonRpcProvider = (ethers.JsonRpcProvider as jest.Mock).mock.results[0]?.value;
  });

  describe('Constructor', () => {
    it('debe crear provider para Arbitrum Sepolia', () => {
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://sepolia-rollup.arbitrum.io/rpc');
      expect(provider.getNetwork()).toBe('arbitrum-sepolia');
    });

    it('debe crear provider para Arbitrum Mainnet', () => {
      new ArbitrumProvider('arbitrum', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://arb1.arbitrum.io/rpc');
    });

    it('debe usar custom RPC URL si se proporciona', () => {
      new ArbitrumProvider(
        'arbitrum-sepolia',
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        'https://custom-rpc.example.com'
      );
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://custom-rpc.example.com');
    });
  });

  describe('anchorData', () => {
    it('debe anclar datos correctamente', async () => {
      const mockReceipt = {
        hash: '0xdef456',
        blockNumber: 54321,
        gasUsed: BigInt(21000),
        gasPrice: BigInt(100000000), // 0.1 gwei
      };

      const mockTx = {
        wait: jest.fn().mockResolvedValue(mockReceipt),
      };

      mockWallet.sendTransaction.mockResolvedValue(mockTx);

      const result = await provider.anchorData('def456abc123', { source: 'test' });

      expect(mockWallet.sendTransaction).toHaveBeenCalledWith({
        to: mockWallet.address,
        value: 0,
        data: '0xdef456abc123',
      });

      expect(result).toMatchObject({
        txHash: '0xdef456',
        blockNumber: 54321,
        network: 'arbitrum-sepolia',
        metadata: { source: 'test' },
      });
      expect(result.fee).toBe('2100000000000');
    });

    it('debe lanzar error si la transacción falla', async () => {
      mockWallet.sendTransaction.mockRejectedValue(new Error('Network error'));

      await expect(provider.anchorData('abc123')).rejects.toThrow('Failed to anchor data on Arbitrum');
    });

    it('debe lanzar error si no hay receipt', async () => {
      const mockTx = {
        wait: jest.fn().mockResolvedValue(null),
      };

      mockWallet.sendTransaction.mockResolvedValue(mockTx);

      await expect(provider.anchorData('abc123')).rejects.toThrow('Transaction receipt not available');
    });
  });

  describe('batchAnchorData', () => {
    it('debe anclar múltiples hashes en una transacción', async () => {
      const hashes = ['hash1', 'hash2', 'hash3', 'hash4'];
      const mockReceipt = {
        hash: '0xbatch456',
        blockNumber: 54322,
        gasUsed: BigInt(60000),
        gasPrice: BigInt(100000000),
      };

      const mockTx = {
        wait: jest.fn().mockResolvedValue(mockReceipt),
      };

      mockWallet.sendTransaction.mockResolvedValue(mockTx);

      const result = await provider.batchAnchorData(hashes, { batch: true });

      expect(mockWallet.sendTransaction).toHaveBeenCalledWith({
        to: mockWallet.address,
        value: 0,
        data: '0xhash1hash2hash3hash4',
      });

      expect(result).toMatchObject({
        txHash: '0xbatch456',
        blockNumber: 54322,
        network: 'arbitrum-sepolia',
        anchored: 4,
        failed: 0,
      });

      expect(result.results).toHaveLength(4);
      expect(result.results[0]).toMatchObject({
        index: 0,
        success: true,
        hash: 'hash1',
      });
    });

    it('debe lanzar error si batch anchor falla', async () => {
      mockWallet.sendTransaction.mockRejectedValue(new Error('Batch failed'));

      await expect(provider.batchAnchorData(['hash1', 'hash2'])).rejects.toThrow(
        'Failed to batch anchor on Arbitrum'
      );
    });
  });

  describe('getTransactionStatus', () => {
    it('debe retornar status de transacción confirmada', async () => {
      const mockTx = {
        blockNumber: 54321,
      };

      const mockReceipt = {
        blockNumber: 54321,
        gasUsed: BigInt(21000),
        gasPrice: BigInt(100000000),
      };

      const mockBlock = {
        timestamp: 1704067200,
      };

      mockJsonRpcProvider.getTransaction.mockResolvedValue(mockTx);
      mockJsonRpcProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
      mockJsonRpcProvider.getBlock.mockResolvedValue(mockBlock);
      mockJsonRpcProvider.getBlockNumber.mockResolvedValue(54331);

      const result = await provider.getTransactionStatus('0xdef456');

      expect(result).toMatchObject({
        hash: '0xdef456',
        network: 'arbitrum-sepolia',
        confirmed: true,
        confirmations: 10,
        blockNumber: 54321,
      });
    });

    it('debe retornar not confirmed si no hay transacción', async () => {
      mockJsonRpcProvider.getTransaction.mockResolvedValue(null);

      const result = await provider.getTransactionStatus('0xnotfound');

      expect(result).toMatchObject({
        hash: '0xnotfound',
        network: 'arbitrum-sepolia',
        confirmed: false,
      });
    });

    it('debe manejar errores y retornar not confirmed', async () => {
      mockJsonRpcProvider.getTransaction.mockRejectedValue(new Error('RPC error'));

      const result = await provider.getTransactionStatus('0xerror');

      expect(result).toMatchObject({
        hash: '0xerror',
        network: 'arbitrum-sepolia',
        confirmed: false,
      });
    });
  });

  describe('verifyAnchor', () => {
    it('debe verificar anchor correctamente', async () => {
      const mockTx = {
        data: '0xdef456abc123',
        blockNumber: 54321,
      };

      const mockReceipt = {
        blockNumber: 54321,
      };

      const mockBlock = {
        timestamp: 1704067200,
      };

      mockJsonRpcProvider.getTransaction.mockResolvedValue(mockTx);
      mockJsonRpcProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
      mockJsonRpcProvider.getBlock.mockResolvedValue(mockBlock);

      const result = await provider.verifyAnchor('0xdef456', 'def456abc123');

      expect(result).toMatchObject({
        valid: true,
        txHash: '0xdef456',
        network: 'arbitrum-sepolia',
        dataHash: 'def456abc123',
        blockNumber: 54321,
      });
    });

    it('debe retornar invalid si el hash no coincide', async () => {
      const mockTx = {
        data: '0xwronghash',
        blockNumber: 54321,
      };

      const mockReceipt = {
        blockNumber: 54321,
      };

      mockJsonRpcProvider.getTransaction.mockResolvedValue(mockTx);
      mockJsonRpcProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await provider.verifyAnchor('0xdef456', 'correcthash');

      expect(result.valid).toBe(false);
    });

    it('debe retornar invalid si no hay transacción', async () => {
      mockJsonRpcProvider.getTransaction.mockResolvedValue(null);

      const result = await provider.verifyAnchor('0xnotfound', 'hash');

      expect(result).toMatchObject({
        valid: false,
        txHash: '0xnotfound',
        network: 'arbitrum-sepolia',
        dataHash: 'hash',
      });
    });

    it('debe manejar errores y retornar invalid', async () => {
      mockJsonRpcProvider.getTransaction.mockRejectedValue(new Error('Error'));

      const result = await provider.verifyAnchor('0xerror', 'hash');

      expect(result.valid).toBe(false);
    });
  });

  describe('getBalance', () => {
    it('debe retornar el balance en ETH', async () => {
      mockJsonRpcProvider.getBalance.mockResolvedValue(BigInt('2500000000000000000')); // 2.5 ETH

      const balance = await provider.getBalance();

      expect(mockJsonRpcProvider.getBalance).toHaveBeenCalledWith(mockWallet.address);
      expect(balance).toBe('2.5');
    });
  });

  describe('estimateFee', () => {
    it('debe estimar fee para una transacción', async () => {
      mockJsonRpcProvider.getFeeData.mockResolvedValue({
        gasPrice: BigInt(100000000), // 0.1 gwei
      });

      const fee = await provider.estimateFee(1);

      expect(fee).toBe('2200000000000'); // (21000 + 1000) * 0.1 gwei
    });

    it('debe estimar fee para múltiples transacciones', async () => {
      mockJsonRpcProvider.getFeeData.mockResolvedValue({
        gasPrice: BigInt(100000000),
      });

      const fee = await provider.estimateFee(5);

      expect(fee).toBe('2600000000000'); // (21000 + 5000) * 0.1 gwei
    });

    it('debe usar fee por defecto si getFeeData falla', async () => {
      mockJsonRpcProvider.getFeeData.mockResolvedValue({
        gasPrice: null,
      });

      const fee = await provider.estimateFee(1);

      expect(fee).toBeTruthy();
    });
  });
});
