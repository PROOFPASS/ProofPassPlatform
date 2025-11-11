/**
 * Tests para ProofPass SDK Client
 * Coverage objetivo: 100%
 */

import axios from 'axios';
import ProofPass, {
  AttestationsAPI,
  PassportsAPI,
  ZKProofsAPI,
  CredentialsAPI,
  ProofPassConfig,
  CreateAttestationParams,
  Attestation,
  CreatePassportParams,
  ProductPassport,
  CreateProofParams,
  ZKProof,
  VerifyCredentialParams,
  VerifyCredentialResult,
} from '../src/index';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ProofPass SDK', () => {
  const mockApiKey = 'test-api-key-12345';
  const mockBaseURL = 'https://api.test.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ProofPass Constructor', () => {
    it('debe inicializar con API key como string', () => {
      const mockCreate = jest.fn().mockReturnValue({
        interceptors: {
          response: { use: jest.fn() },
        },
      });
      mockedAxios.create = mockCreate;

      const client = new ProofPass(mockApiKey);

      expect(mockCreate).toHaveBeenCalledWith({
        baseURL: 'https://api.proofpass.com',
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': '@proofpass/client/0.1.0',
        },
      });

      expect(client.attestations).toBeInstanceOf(AttestationsAPI);
      expect(client.passports).toBeInstanceOf(PassportsAPI);
      expect(client.zkproofs).toBeInstanceOf(ZKProofsAPI);
      expect(client.credentials).toBeInstanceOf(CredentialsAPI);
    });

    it('debe inicializar con objeto de configuración completo', () => {
      const mockCreate = jest.fn().mockReturnValue({
        interceptors: {
          response: { use: jest.fn() },
        },
      });
      mockedAxios.create = mockCreate;

      const config: ProofPassConfig = {
        apiKey: mockApiKey,
        baseURL: mockBaseURL,
        timeout: 60000,
      };

      new ProofPass(config);

      expect(mockCreate).toHaveBeenCalledWith({
        baseURL: mockBaseURL,
        timeout: 60000,
        headers: {
          'Authorization': `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': '@proofpass/client/0.1.0',
        },
      });
    });

    it('debe lanzar error si falta API key', () => {
      expect(() => {
        new ProofPass({ apiKey: '' });
      }).toThrow('API key is required');

      expect(() => {
        new ProofPass('' as any);
      }).toThrow('API key is required');
    });

    it('debe configurar interceptor de errores', () => {
      const mockUse = jest.fn();
      const mockCreate = jest.fn().mockReturnValue({
        interceptors: {
          response: { use: mockUse },
        },
      });
      mockedAxios.create = mockCreate;

      new ProofPass(mockApiKey);

      expect(mockUse).toHaveBeenCalled();
      const [successHandler, errorHandler] = mockUse.mock.calls[0];

      // Test success handler - should return response
      const mockResponse = { data: 'test' };
      expect(successHandler(mockResponse)).toBe(mockResponse);

      // Test error handler
      expect(() => {
        errorHandler({ message: 'test error' });
      }).toThrow();
    });
  });

  describe('Error Handling', () => {
    let client: ProofPass;
    let errorHandler: any;

    beforeEach(() => {
      const mockUse = jest.fn();
      const mockCreate = jest.fn().mockReturnValue({
        interceptors: {
          response: { use: mockUse },
        },
      });
      mockedAxios.create = mockCreate;

      client = new ProofPass(mockApiKey);
      errorHandler = mockUse.mock.calls[0][1];
    });

    it('debe manejar errores con response del servidor', () => {
      const axiosError = {
        response: {
          status: 400,
          data: {
            message: 'Bad request',
            code: 'VALIDATION_ERROR',
          },
        },
        message: 'Request failed',
      };

      expect(() => {
        errorHandler(axiosError);
      }).toThrow();

      try {
        errorHandler(axiosError);
      } catch (error: any) {
        expect(error.message).toBe('Bad request');
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.status).toBe(400);
      }
    });

    it('debe manejar errores de red sin response', () => {
      const axiosError = {
        request: {},
        message: 'Network error',
      };

      expect(() => {
        errorHandler(axiosError);
      }).toThrow();

      try {
        errorHandler(axiosError);
      } catch (error: any) {
        expect(error.message).toBe('No response from server');
        expect(error.code).toBe('NETWORK_ERROR');
      }
    });

    it('debe manejar errores desconocidos', () => {
      const axiosError = {
        message: 'Unknown error',
      };

      expect(() => {
        errorHandler(axiosError);
      }).toThrow();

      try {
        errorHandler(axiosError);
      } catch (error: any) {
        expect(error.message).toBe('Unknown error');
        expect(error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('AttestationsAPI', () => {
    let client: ProofPass;
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        post: jest.fn(),
        get: jest.fn(),
        interceptors: {
          response: { use: jest.fn() },
        },
      };
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      client = new ProofPass(mockApiKey);
    });

    it('debe crear una attestation', async () => {
      const params: CreateAttestationParams = {
        type: 'identity',
        subject: 'did:key:z123',
        claims: { name: 'Alice' },
      };

      const mockAttestation: Attestation = {
        id: 'att-123',
        type: 'identity',
        subject: 'did:key:z123',
        claims: { name: 'Alice' },
        issuer: 'did:key:issuer',
        issuedAt: '2024-01-01T00:00:00Z',
        credential: {},
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockAttestation });

      const result = await client.attestations.create(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/attestations', params);
      expect(result).toEqual(mockAttestation);
    });

    it('debe obtener una attestation por ID', async () => {
      const mockAttestation: Attestation = {
        id: 'att-123',
        type: 'identity',
        subject: 'did:key:z123',
        claims: { name: 'Alice' },
        issuer: 'did:key:issuer',
        issuedAt: '2024-01-01T00:00:00Z',
        credential: {},
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockAttestation });

      const result = await client.attestations.get('att-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/attestations/att-123');
      expect(result).toEqual(mockAttestation);
    });

    it('debe listar attestations con paginación', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await client.attestations.list({ page: 1, limit: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/attestations', {
        params: { page: 1, limit: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('debe listar attestations sin parámetros', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      await client.attestations.list();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/attestations', {
        params: undefined,
      });
    });

    it('debe revocar una attestation', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: null });

      await client.attestations.revoke('att-123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/attestations/att-123/revoke');
    });
  });

  describe('PassportsAPI', () => {
    let client: ProofPass;
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        post: jest.fn(),
        get: jest.fn(),
        interceptors: {
          response: { use: jest.fn() },
        },
      };
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      client = new ProofPass(mockApiKey);
    });

    it('debe crear un passport', async () => {
      const params: CreatePassportParams = {
        productId: 'prod-123',
        metadata: { brand: 'Nike' },
      };

      const mockPassport: ProductPassport = {
        id: 'pass-123',
        productId: 'prod-123',
        metadata: { brand: 'Nike' },
        credential: {},
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockPassport });

      const result = await client.passports.create(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/passports', params);
      expect(result).toEqual(mockPassport);
    });

    it('debe obtener un passport por ID', async () => {
      const mockPassport: ProductPassport = {
        id: 'pass-123',
        productId: 'prod-123',
        metadata: { brand: 'Nike' },
        credential: {},
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockPassport });

      const result = await client.passports.get('pass-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/passports/pass-123');
      expect(result).toEqual(mockPassport);
    });

    it('debe listar passports con paginación', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await client.passports.list({ page: 1, limit: 20 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/passports', {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('debe listar passports sin parámetros', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      await client.passports.list();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/passports', {
        params: undefined,
      });
    });

    it('debe verificar un passport', async () => {
      const mockResult = {
        valid: true,
        passport: {
          id: 'pass-123',
          productId: 'prod-123',
          metadata: {},
          credential: {},
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResult });

      const result = await client.passports.verify('pass-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/passports/pass-123/verify');
      expect(result).toEqual(mockResult);
      expect(result.valid).toBe(true);
    });
  });

  describe('ZKProofsAPI', () => {
    let client: ProofPass;
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        post: jest.fn(),
        get: jest.fn(),
        interceptors: {
          response: { use: jest.fn() },
        },
      };
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      client = new ProofPass(mockApiKey);
    });

    it('debe crear un ZK proof', async () => {
      const params: CreateProofParams = {
        credentialId: 'cred-123',
        disclosureMap: { name: true, age: false },
      };

      const mockProof: ZKProof = {
        id: 'proof-123',
        credentialId: 'cred-123',
        proof: {},
        disclosedFields: ['name'],
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockProof });

      const result = await client.zkproofs.create(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/zkproofs', params);
      expect(result).toEqual(mockProof);
    });

    it('debe verificar un ZK proof', async () => {
      const mockResult = { valid: true };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResult });

      const result = await client.zkproofs.verify('proof-123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/zkproofs/proof-123/verify');
      expect(result).toEqual(mockResult);
      expect(result.valid).toBe(true);
    });
  });

  describe('CredentialsAPI', () => {
    let client: ProofPass;
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        post: jest.fn(),
        get: jest.fn(),
        interceptors: {
          response: { use: jest.fn() },
        },
      };
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      client = new ProofPass(mockApiKey);
    });

    it('debe verificar un credential', async () => {
      const params: VerifyCredentialParams = {
        credential: {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiableCredential'],
          issuer: 'did:key:z123',
        },
        checkRevocation: true,
      };

      const mockResult: VerifyCredentialResult = {
        valid: true,
        issuer: 'did:key:z123',
        subject: 'did:key:z456',
        issuedAt: '2024-01-01T00:00:00Z',
        revoked: false,
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResult });

      const result = await client.credentials.verify(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/credentials/verify', params);
      expect(result).toEqual(mockResult);
      expect(result.valid).toBe(true);
    });

    it('debe verificar credential sin checkRevocation', async () => {
      const params: VerifyCredentialParams = {
        credential: {},
      };

      const mockResult: VerifyCredentialResult = {
        valid: true,
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResult });

      await client.credentials.verify(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/credentials/verify', params);
    });

    it('debe retornar errores en verificación inválida', async () => {
      const params: VerifyCredentialParams = {
        credential: {},
      };

      const mockResult: VerifyCredentialResult = {
        valid: false,
        errors: ['Invalid signature', 'Expired credential'],
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResult });

      const result = await client.credentials.verify(params);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Flujo end-to-end completo', () => {
    let client: ProofPass;
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        post: jest.fn(),
        get: jest.fn(),
        interceptors: {
          response: { use: jest.fn() },
        },
      };
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      client = new ProofPass(mockApiKey);
    });

    it('debe completar flujo: create attestation -> get -> revoke', async () => {
      // 1. Create attestation
      const createParams: CreateAttestationParams = {
        type: 'identity',
        subject: 'did:key:alice',
        claims: { name: 'Alice', age: 30 },
      };

      const mockAttestation: Attestation = {
        id: 'att-flow-1',
        type: 'identity',
        subject: 'did:key:alice',
        claims: { name: 'Alice', age: 30 },
        issuer: 'did:key:issuer',
        issuedAt: '2024-01-01T00:00:00Z',
        credential: {},
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockAttestation });

      const created = await client.attestations.create(createParams);
      expect(created.id).toBe('att-flow-1');

      // 2. Get attestation
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockAttestation });

      const retrieved = await client.attestations.get(created.id);
      expect(retrieved).toEqual(mockAttestation);

      // 3. Revoke attestation
      mockAxiosInstance.post.mockResolvedValueOnce({ data: null });

      await client.attestations.revoke(created.id);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/attestations/att-flow-1/revoke');
    });

    it('debe completar flujo: create passport -> verify', async () => {
      // 1. Create passport
      const createParams: CreatePassportParams = {
        productId: 'shoe-nike-123',
        metadata: {
          brand: 'Nike',
          model: 'Air Max',
          size: 42,
        },
      };

      const mockPassport: ProductPassport = {
        id: 'pass-flow-1',
        productId: 'shoe-nike-123',
        metadata: createParams.metadata,
        credential: {},
        blockchain: {
          network: 'optimism',
          txHash: '0xabc123',
          address: '0xdef456',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockPassport });

      const created = await client.passports.create(createParams);
      expect(created.blockchain).toBeDefined();

      // 2. Verify passport
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { valid: true, passport: mockPassport },
      });

      const verified = await client.passports.verify(created.id);
      expect(verified.valid).toBe(true);
    });

    it('debe completar flujo: create credential -> verify -> create zkproof -> verify', async () => {
      // 1. Verify credential
      const credential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:key:issuer',
        credentialSubject: {
          id: 'did:key:alice',
          name: 'Alice',
          age: 30,
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          valid: true,
          issuer: 'did:key:issuer',
          subject: 'did:key:alice',
        },
      });

      const verifyResult = await client.credentials.verify({ credential });
      expect(verifyResult.valid).toBe(true);

      // 2. Create ZK proof (selective disclosure)
      const zkProofParams: CreateProofParams = {
        credentialId: 'cred-123',
        disclosureMap: {
          name: true, // Disclose name
          age: false, // Hide age
        },
      };

      const mockZKProof: ZKProof = {
        id: 'proof-flow-1',
        credentialId: 'cred-123',
        proof: {},
        disclosedFields: ['name'],
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockZKProof });

      const zkProof = await client.zkproofs.create(zkProofParams);
      expect(zkProof.disclosedFields).toContain('name');
      expect(zkProof.disclosedFields).not.toContain('age');

      // 3. Verify ZK proof
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { valid: true } });

      const zkVerifyResult = await client.zkproofs.verify(zkProof.id);
      expect(zkVerifyResult.valid).toBe(true);
    });
  });
});
