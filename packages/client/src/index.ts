/**
 * ProofPass JavaScript SDK
 *
 * Official SDK for interacting with ProofPass API
 *
 * @example
 * ```typescript
 * import ProofPass from '@proofpass/client';
 *
 * const proofpass = new ProofPass('your-api-key');
 *
 * // Create an attestation
 * const attestation = await proofpass.attestations.create({
 *   type: 'identity',
 *   subject: 'did:key:z...',
 *   claims: { name: 'Alice' }
 * });
 * ```
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ProofPassConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface ProofPassError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface CreateAttestationParams {
  type: string;
  subject: string;
  claims: Record<string, any>;
  expiresIn?: number;
  metadata?: Record<string, any>;
}

export interface Attestation {
  id: string;
  type: string;
  subject: string;
  claims: Record<string, any>;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  credential: any;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface VerifyCredentialParams {
  credential: any;
  checkRevocation?: boolean;
}

export interface VerifyCredentialResult {
  valid: boolean;
  issuer?: string;
  subject?: string;
  issuedAt?: string;
  expiresAt?: string;
  revoked?: boolean;
  errors?: string[];
}

export interface CreatePassportParams {
  productId: string;
  metadata: Record<string, any>;
  owner?: string;
}

export interface ProductPassport {
  id: string;
  productId: string;
  metadata: Record<string, any>;
  owner?: string;
  credential: any;
  blockchain?: {
    network: string;
    txHash: string;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProofParams {
  credentialId: string;
  disclosureMap: Record<string, boolean>;
}

export interface ZKProof {
  id: string;
  credentialId: string;
  proof: any;
  disclosedFields: string[];
  createdAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * ProofPass SDK Client
 */
export class ProofPass {
  private client: AxiosInstance;
  public attestations: AttestationsAPI;
  public passports: PassportsAPI;
  public zkproofs: ZKProofsAPI;
  public credentials: CredentialsAPI;

  constructor(config: string | ProofPassConfig) {
    const cfg: ProofPassConfig = typeof config === 'string'
      ? { apiKey: config }
      : config;

    if (!cfg.apiKey) {
      throw new Error('API key is required');
    }

    this.client = axios.create({
      baseURL: cfg.baseURL || 'https://api.proofpass.com',
      timeout: cfg.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': '@proofpass/client/0.1.0'
      }
    });

    // Add error interceptor
    this.client.interceptors.response.use(
      response => response,
      error => {
        throw this.handleError(error);
      }
    );

    // Initialize API namespaces
    this.attestations = new AttestationsAPI(this.client);
    this.passports = new PassportsAPI(this.client);
    this.zkproofs = new ZKProofsAPI(this.client);
    this.credentials = new CredentialsAPI(this.client);
  }

  private handleError(error: AxiosError): ProofPassError {
    if (error.response) {
      const data = error.response.data as any;
      return {
        message: data?.message || error.message,
        code: data?.code,
        status: error.response.status,
        details: data
      };
    } else if (error.request) {
      return {
        message: 'No response from server',
        code: 'NETWORK_ERROR'
      };
    } else {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR'
      };
    }
  }
}

/**
 * Attestations API
 */
export class AttestationsAPI {
  constructor(private client: AxiosInstance) {}

  async create(params: CreateAttestationParams): Promise<Attestation> {
    const response = await this.client.post('/api/attestations', params);
    return response.data;
  }

  async get(id: string): Promise<Attestation> {
    const response = await this.client.get(`/api/attestations/${id}`);
    return response.data;
  }

  async list(params?: PaginationParams): Promise<ListResponse<Attestation>> {
    const response = await this.client.get('/api/attestations', { params });
    return response.data;
  }

  async revoke(id: string): Promise<void> {
    await this.client.post(`/api/attestations/${id}/revoke`);
  }
}

/**
 * Product Passports API
 */
export class PassportsAPI {
  constructor(private client: AxiosInstance) {}

  async create(params: CreatePassportParams): Promise<ProductPassport> {
    const response = await this.client.post('/api/passports', params);
    return response.data;
  }

  async get(id: string): Promise<ProductPassport> {
    const response = await this.client.get(`/api/passports/${id}`);
    return response.data;
  }

  async list(params?: PaginationParams): Promise<ListResponse<ProductPassport>> {
    const response = await this.client.get('/api/passports', { params });
    return response.data;
  }

  async verify(id: string): Promise<{ valid: boolean; passport: ProductPassport }> {
    const response = await this.client.get(`/api/passports/${id}/verify`);
    return response.data;
  }
}

/**
 * ZK Proofs API
 */
export class ZKProofsAPI {
  constructor(private client: AxiosInstance) {}

  async create(params: CreateProofParams): Promise<ZKProof> {
    const response = await this.client.post('/api/zkproofs', params);
    return response.data;
  }

  async verify(proofId: string): Promise<{ valid: boolean }> {
    const response = await this.client.post(`/api/zkproofs/${proofId}/verify`);
    return response.data;
  }
}

/**
 * Credentials API
 */
export class CredentialsAPI {
  constructor(private client: AxiosInstance) {}

  async verify(params: VerifyCredentialParams): Promise<VerifyCredentialResult> {
    const response = await this.client.post('/api/credentials/verify', params);
    return response.data;
  }
}

export default ProofPass;
