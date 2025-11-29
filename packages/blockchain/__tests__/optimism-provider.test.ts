/**
 * Tests para OptimismProvider
 * Coverage objetivo: 100%
 */

import { OptimismProvider } from '../src/providers/optimism-provider';
import { ethers } from 'ethers';

// Mock ethers
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

describe('OptimismProvider', () => {
  let provider: OptimismProvider;
  let mockWallet: any;
  let mockJsonRpcProvider: any;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OptimismProvider('optimism-sepolia', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    mockWallet = (ethers.Wallet as unknown as jest.Mock).mock.results[0]?.value;
    mockJsonRpcProvider = (ethers.JsonRpcProvider as unknown as jest.Mock).mock.results[0]?.value;
  });

  describe('Constructor', () => {
    it('debe crear provider para Optimism Sepolia', () => {
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://sepolia.optimism.io');
      expect(provider.getNetwork()).toBe('optimism-sepolia');
    });

    it('debe crear provider para Optimism Mainnet', () => {
      new OptimismProvider('optimism', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://mainnet.optimism.io');
    });

    it('debe usar custom RPC URL si se proporciona', () => {
      new OptimismProvider(
        'optimism-sepolia',
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        'https://custom-rpc.example.com'
      );
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://custom-rpc.example.com');
    });
  });

  describe('anchorData', () => {
    it('debe anclar datos correctamente', async () => {
      const mockReceipt = {
        hash: '0xabc123',
        blockNumber: 12345,
        gasUsed: BigInt(21000),
        gasPrice: BigInt(1000000000), // 1 gwei
      };

      const mockTx = {
        wait: jest.fn().mockResolvedValue(mockReceipt),
      };

      mockWallet.sendTransaction.mockResolvedValue(mockTx);

      const result = await provider.anchorData('abc123def456', { source: 'test' });

      expect(mockWallet.sendTransaction).toHaveBeenCalledWith({
        to: mockWallet.address,
        value: 0,
        data: '0xabc123def456',
      });

      expect(result).toMatchObject({
        txHash: '0xabc123',
        blockNumber: 12345,
        network: 'optimism-sepolia',
        metadata: { source: 'test' },
      });
      expect(result.fee).toBe('21000000000000');
    });

    it('debe lanzar error si la transacción falla', async () => {
      mockWallet.sendTransaction.mockRejectedValue(new Error('Network error'));

      await expect(provider.anchorData('abc123')).rejects.toThrow('Failed to anchor data on Optimism');
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
      const hashes = ['hash1', 'hash2', 'hash3'];
      const mockReceipt = {
        hash: '0xbatch123',
        blockNumber: 12346,
        gasUsed: BigInt(50000),
        gasPrice: BigInt(1000000000),
      };

      const mockTx = {
        wait: jest.fn().mockResolvedValue(mockReceipt),
      };

      mockWallet.sendTransaction.mockResolvedValue(mockTx);

      const result = await provider.batchAnchorData(hashes, { batch: true });

      expect(mockWallet.sendTransaction).toHaveBeenCalledWith({
        to: mockWallet.address,
        value: 0,
        data: '0xhash1hash2hash3',
      });

      expect(result).toMatchObject({
        txHash: '0xbatch123',
        blockNumber: 12346,
        network: 'optimism-sepolia',
        anchored: 3,
        failed: 0,
      });

      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toMatchObject({
        index: 0,
        success: true,
        hash: 'hash1',
      });
    });

    it('debe lanzar error si batch anchor falla', async () => {
      mockWallet.sendTransaction.mockRejectedValue(new Error('Batch failed'));

      await expect(provider.batchAnchorData(['hash1', 'hash2'])).rejects.toThrow(
        'Failed to batch anchor on Optimism'
      );
    });
  });

  describe('getTransactionStatus', () => {
    it('debe retornar status de transacción confirmada', async () => {
      const mockTx = {
        blockNumber: 12345,
      };

      const mockReceipt = {
        blockNumber: 12345,
        gasUsed: BigInt(21000),
        gasPrice: BigInt(1000000000),
      };

      const mockBlock = {
        timestamp: 1704067200, // 2024-01-01
      };

      mockJsonRpcProvider.getTransaction.mockResolvedValue(mockTx);
      mockJsonRpcProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
      mockJsonRpcProvider.getBlock.mockResolvedValue(mockBlock);
      mockJsonRpcProvider.getBlockNumber.mockResolvedValue(12355);

      const result = await provider.getTransactionStatus('0xabc123');

      expect(result).toMatchObject({
        hash: '0xabc123',
        network: 'optimism-sepolia',
        confirmed: true,
        confirmations: 10,
        blockNumber: 12345,
      });
    });

    it('debe retornar not confirmed si no hay transacción', async () => {
      mockJsonRpcProvider.getTransaction.mockResolvedValue(null);

      const result = await provider.getTransactionStatus('0xnotfound');

      expect(result).toMatchObject({
        hash: '0xnotfound',
        network: 'optimism-sepolia',
        confirmed: false,
      });
    });

    it('debe manejar errores y retornar not confirmed', async () => {
      mockJsonRpcProvider.getTransaction.mockRejectedValue(new Error('RPC error'));

      const result = await provider.getTransactionStatus('0xerror');

      expect(result).toMatchObject({
        hash: '0xerror',
        network: 'optimism-sepolia',
        confirmed: false,
      });
    });
  });

  describe('verifyAnchor', () => {
    it('debe verificar anchor correctamente', async () => {
      const mockTx = {
        data: '0xabc123def456',
        blockNumber: 12345,
      };

      const mockReceipt = {
        blockNumber: 12345,
      };

      const mockBlock = {
        timestamp: 1704067200,
      };

      mockJsonRpcProvider.getTransaction.mockResolvedValue(mockTx);
      mockJsonRpcProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
      mockJsonRpcProvider.getBlock.mockResolvedValue(mockBlock);

      const result = await provider.verifyAnchor('0xabc123', 'abc123def456');

      expect(result).toMatchObject({
        valid: true,
        txHash: '0xabc123',
        network: 'optimism-sepolia',
        dataHash: 'abc123def456',
        blockNumber: 12345,
      });
    });

    it('debe retornar invalid si el hash no coincide', async () => {
      const mockTx = {
        data: '0xwronghash',
        blockNumber: 12345,
      };

      const mockReceipt = {
        blockNumber: 12345,
      };

      mockJsonRpcProvider.getTransaction.mockResolvedValue(mockTx);
      mockJsonRpcProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await provider.verifyAnchor('0xabc123', 'correcthash');

      expect(result.valid).toBe(false);
    });

    it('debe retornar invalid si no hay transacción', async () => {
      mockJsonRpcProvider.getTransaction.mockResolvedValue(null);

      const result = await provider.verifyAnchor('0xnotfound', 'hash');

      expect(result).toMatchObject({
        valid: false,
        txHash: '0xnotfound',
        network: 'optimism-sepolia',
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
      mockJsonRpcProvider.getBalance.mockResolvedValue(BigInt('1000000000000000000')); // 1 ETH

      const balance = await provider.getBalance();

      expect(mockJsonRpcProvider.getBalance).toHaveBeenCalledWith(mockWallet.address);
      expect(balance).toBe('1');
    });
  });

  describe('estimateFee', () => {
    it('debe estimar fee para una transacción', async () => {
      mockJsonRpcProvider.getFeeData.mockResolvedValue({
        gasPrice: BigInt(1000000000), // 1 gwei
      });

      const fee = await provider.estimateFee(1);

      expect(fee).toBe('22000000000000'); // (21000 + 1000) * 1 gwei
    });

    it('debe estimar fee para múltiples transacciones', async () => {
      mockJsonRpcProvider.getFeeData.mockResolvedValue({
        gasPrice: BigInt(1000000000),
      });

      const fee = await provider.estimateFee(10);

      expect(fee).toBe('31000000000000'); // (21000 + 10000) * 1 gwei
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
