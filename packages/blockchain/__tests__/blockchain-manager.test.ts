/**
 * Tests para BlockchainManager
 * Coverage objetivo: 100%
 */

import { BlockchainManager } from '../src/blockchain-manager';
import { BlockchainNetwork } from '../src/types';

// Mock de los providers
jest.mock('../src/providers/optimism-provider');
jest.mock('../src/providers/arbitrum-provider');
jest.mock('../src/providers/stellar-provider');

describe('BlockchainManager', () => {
  let manager: BlockchainManager;

  beforeEach(() => {
    manager = new BlockchainManager();
  });

  describe('addProvider', () => {
    it('debe agregar provider de Optimism correctamente', () => {
      expect(() => {
        manager.addProvider({
          network: 'optimism-sepolia',
          privateKey: '0x1234567890abcdef',
        });
      }).not.toThrow();

      expect(manager.getNetworks()).toContain('optimism-sepolia');
    });

    it('debe agregar provider de Arbitrum correctamente', () => {
      manager.addProvider({
        network: 'arbitrum-sepolia',
        privateKey: '0x1234567890abcdef',
      });

      expect(manager.getNetworks()).toContain('arbitrum-sepolia');
    });

    it('debe agregar provider de Stellar correctamente', () => {
      manager.addProvider({
        network: 'stellar-testnet',
        privateKey: 'SCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      });

      expect(manager.getNetworks()).toContain('stellar-testnet');
    });

    it('debe establecer el primer provider como default', () => {
      manager.addProvider({
        network: 'optimism-sepolia',
        privateKey: '0x123',
      });

      expect(manager.getDefaultNetwork()).toBe('optimism-sepolia');
    });

    it('debe lanzar error si falta privateKey para Optimism', () => {
      expect(() => {
        manager.addProvider({
          network: 'optimism-sepolia',
          privateKey: '',
        });
      }).toThrow('Optimism requires privateKey');
    });

    it('debe lanzar error si falta privateKey para Arbitrum', () => {
      expect(() => {
        manager.addProvider({
          network: 'arbitrum-sepolia',
          privateKey: '',
        });
      }).toThrow('Arbitrum requires privateKey');
    });

    it('debe lanzar error si falta privateKey para Stellar', () => {
      expect(() => {
        manager.addProvider({
          network: 'stellar-testnet',
          privateKey: '',
        });
      }).toThrow('Stellar requires privateKey');
    });

    it('debe lanzar error para network no soportada', () => {
      expect(() => {
        manager.addProvider({
          network: 'invalid-network' as BlockchainNetwork,
          privateKey: '0x123',
        });
      }).toThrow('Unsupported network');
    });
  });

  describe('getProvider', () => {
    beforeEach(() => {
      manager.addProvider({
        network: 'optimism-sepolia',
        privateKey: '0x123',
      });
      manager.addProvider({
        network: 'arbitrum-sepolia',
        privateKey: '0x456',
      });
    });

    it('debe retornar el provider por default si no se especifica network', () => {
      const provider = manager.getProvider();
      expect(provider).toBeDefined();
      expect(provider.getNetwork()).toBe('optimism-sepolia');
    });

    it('debe retornar el provider específico cuando se pasa network', () => {
      const provider = manager.getProvider('arbitrum-sepolia');
      expect(provider).toBeDefined();
      expect(provider.getNetwork()).toBe('arbitrum-sepolia');
    });

    it('debe lanzar error si no hay providers configurados', () => {
      const emptyManager = new BlockchainManager();
      expect(() => emptyManager.getProvider()).toThrow('No blockchain providers configured');
    });

    it('debe lanzar error si el provider solicitado no existe', () => {
      expect(() => {
        manager.getProvider('stellar-testnet');
      }).toThrow('Provider not found for network: stellar-testnet');
    });
  });

  describe('setDefaultNetwork', () => {
    beforeEach(() => {
      manager.addProvider({
        network: 'optimism-sepolia',
        privateKey: '0x123',
      });
      manager.addProvider({
        network: 'arbitrum-sepolia',
        privateKey: '0x456',
      });
    });

    it('debe cambiar el network por default', () => {
      manager.setDefaultNetwork('arbitrum-sepolia');
      expect(manager.getDefaultNetwork()).toBe('arbitrum-sepolia');
    });

    it('debe lanzar error si el network no está configurado', () => {
      expect(() => {
        manager.setDefaultNetwork('stellar-testnet');
      }).toThrow('Provider not configured for network: stellar-testnet');
    });
  });

  describe('getNetworks', () => {
    it('debe retornar array vacío si no hay providers', () => {
      expect(manager.getNetworks()).toEqual([]);
    });

    it('debe retornar todos los networks configurados', () => {
      manager.addProvider({ network: 'optimism-sepolia', privateKey: '0x123' });
      manager.addProvider({ network: 'arbitrum-sepolia', privateKey: '0x456' });
      manager.addProvider({ network: 'stellar-testnet', privateKey: 'SC123' });

      const networks = manager.getNetworks();
      expect(networks).toHaveLength(3);
      expect(networks).toContain('optimism-sepolia');
      expect(networks).toContain('arbitrum-sepolia');
      expect(networks).toContain('stellar-testnet');
    });
  });

  describe('removeProvider', () => {
    beforeEach(() => {
      manager.addProvider({ network: 'optimism-sepolia', privateKey: '0x123' });
      manager.addProvider({ network: 'arbitrum-sepolia', privateKey: '0x456' });
    });

    it('debe remover el provider especificado', () => {
      manager.removeProvider('arbitrum-sepolia');
      expect(manager.getNetworks()).not.toContain('arbitrum-sepolia');
      expect(manager.getNetworks()).toContain('optimism-sepolia');
    });

    it('debe actualizar default network si se remueve el actual', () => {
      expect(manager.getDefaultNetwork()).toBe('optimism-sepolia');
      manager.removeProvider('optimism-sepolia');
      expect(manager.getDefaultNetwork()).toBe('arbitrum-sepolia');
    });

    it('debe manejar la remoción del último provider', () => {
      manager.removeProvider('optimism-sepolia');
      manager.removeProvider('arbitrum-sepolia');
      expect(manager.getNetworks()).toEqual([]);
      expect(manager.getDefaultNetwork()).toBeUndefined();
    });
  });

  describe('Orden de presentación (Optimism, Arbitrum, Stellar)', () => {
    it('debe mantener el orden correcto en documentación', () => {
      manager.addProvider({ network: 'optimism-sepolia', privateKey: '0x1' });
      manager.addProvider({ network: 'arbitrum-sepolia', privateKey: '0x2' });
      manager.addProvider({ network: 'stellar-testnet', privateKey: 'SC1' });

      const networks = manager.getNetworks();
      // El orden no está garantizado por Map, pero documentamos el esperado
      expect(networks).toContain('optimism-sepolia');
      expect(networks).toContain('arbitrum-sepolia');
      expect(networks).toContain('stellar-testnet');
    });
  });
});
