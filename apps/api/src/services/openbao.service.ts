/**
 * OpenBao Service
 *
 * Manages secure key storage and retrieval using OpenBao (Vault fork)
 * Handles DID keys, organization keys, and encryption operations
 */

import axios, { AxiosInstance } from 'axios';

export interface OpenBaoConfig {
  address: string;
  token: string;
  namespace?: string;
}

export interface DIDKeyData {
  did: string;
  publicKey: string;
  privateKey: string;
  keyType: 'Ed25519' | 'secp256k1';
  createdAt: string;
  organizationId?: string;
}

export interface SecretMetadata {
  created_time: string;
  deletion_time: string;
  destroyed: boolean;
  version: number;
}

export class OpenBaoService {
  private client: AxiosInstance;
  private config: OpenBaoConfig;

  constructor(config: OpenBaoConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.address,
      headers: {
        'X-Vault-Token': config.token,
        ...(config.namespace && { 'X-Vault-Namespace': config.namespace }),
      },
      timeout: 10000,
    });
  }

  /**
   * Store a DID key pair securely
   */
  async storeDIDKey(keyId: string, keyData: DIDKeyData): Promise<void> {
    const path = `secret/data/did-keys/${keyId}`;

    try {
      await this.client.post(path, {
        data: keyData,
      });
    } catch (error) {
      throw new Error(`Failed to store DID key: ${error}`);
    }
  }

  /**
   * Retrieve a DID key pair
   */
  async getDIDKey(keyId: string): Promise<DIDKeyData | null> {
    const path = `secret/data/did-keys/${keyId}`;

    try {
      const response = await this.client.get(path);
      return response.data.data.data as DIDKeyData;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to retrieve DID key: ${error}`);
    }
  }

  /**
   * Delete a DID key (soft delete)
   */
  async deleteDIDKey(keyId: string): Promise<void> {
    const path = `secret/data/did-keys/${keyId}`;

    try {
      await this.client.delete(path);
    } catch (error) {
      throw new Error(`Failed to delete DID key: ${error}`);
    }
  }

  /**
   * List all DID keys
   */
  async listDIDKeys(): Promise<string[]> {
    const path = `secret/metadata/did-keys`;

    try {
      const response = await this.client.request({
        method: 'LIST',
        url: path,
      });
      return response.data.data.keys || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error(`Failed to list DID keys: ${error}`);
    }
  }

  /**
   * Store an organization key
   */
  async storeOrganizationKey(
    organizationId: string,
    keyId: string,
    keyData: DIDKeyData
  ): Promise<void> {
    const path = `secret/data/organizations/${organizationId}/keys/${keyId}`;

    try {
      await this.client.post(path, {
        data: keyData,
      });
    } catch (error) {
      throw new Error(`Failed to store organization key: ${error}`);
    }
  }

  /**
   * Retrieve an organization key
   */
  async getOrganizationKey(
    organizationId: string,
    keyId: string
  ): Promise<DIDKeyData | null> {
    const path = `secret/data/organizations/${organizationId}/keys/${keyId}`;

    try {
      const response = await this.client.get(path);
      return response.data.data.data as DIDKeyData;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to retrieve organization key: ${error}`);
    }
  }

  /**
   * List organization keys
   */
  async listOrganizationKeys(organizationId: string): Promise<string[]> {
    const path = `secret/metadata/organizations/${organizationId}/keys`;

    try {
      const response = await this.client.request({
        method: 'LIST',
        url: path,
      });
      return response.data.data.keys || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error(`Failed to list organization keys: ${error}`);
    }
  }

  /**
   * Encrypt data using Transit engine
   */
  async encrypt(plaintext: string, context?: string): Promise<string> {
    const path = 'transit/encrypt/proofpass';

    try {
      const response = await this.client.post(path, {
        plaintext: Buffer.from(plaintext).toString('base64'),
        ...(context && { context: Buffer.from(context).toString('base64') }),
      });
      return response.data.data.ciphertext;
    } catch (error) {
      throw new Error(`Failed to encrypt data: ${error}`);
    }
  }

  /**
   * Decrypt data using Transit engine
   */
  async decrypt(ciphertext: string, context?: string): Promise<string> {
    const path = 'transit/decrypt/proofpass';

    try {
      const response = await this.client.post(path, {
        ciphertext,
        ...(context && { context: Buffer.from(context).toString('base64') }),
      });
      return Buffer.from(response.data.data.plaintext, 'base64').toString();
    } catch (error) {
      throw new Error(`Failed to decrypt data: ${error}`);
    }
  }

  /**
   * Generate a data encryption key
   */
  async generateDataKey(): Promise<{ plaintext: string; ciphertext: string }> {
    const path = 'transit/datakey/plaintext/proofpass';

    try {
      const response = await this.client.post(path, {});
      return {
        plaintext: response.data.data.plaintext,
        ciphertext: response.data.data.ciphertext,
      };
    } catch (error) {
      throw new Error(`Failed to generate data key: ${error}`);
    }
  }

  /**
   * Store generic secret
   */
  async storeSecret(path: string, data: Record<string, any>): Promise<void> {
    const secretPath = `secret/data/${path}`;

    try {
      await this.client.post(secretPath, {
        data,
      });
    } catch (error) {
      throw new Error(`Failed to store secret: ${error}`);
    }
  }

  /**
   * Retrieve generic secret
   */
  async getSecret<T = Record<string, any>>(path: string): Promise<T | null> {
    const secretPath = `secret/data/${path}`;

    try {
      const response = await this.client.get(secretPath);
      return response.data.data.data as T;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to retrieve secret: ${error}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/v1/sys/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Renew token
   */
  async renewToken(): Promise<void> {
    try {
      await this.client.post('/v1/auth/token/renew-self');
    } catch (error) {
      throw new Error(`Failed to renew token: ${error}`);
    }
  }
}

// Singleton instance
let openBaoService: OpenBaoService | null = null;

export function initializeOpenBao(config: OpenBaoConfig): OpenBaoService {
  openBaoService = new OpenBaoService(config);
  return openBaoService;
}

export function getOpenBaoService(): OpenBaoService {
  if (!openBaoService) {
    throw new Error('OpenBao service not initialized. Call initializeOpenBao() first.');
  }
  return openBaoService;
}
