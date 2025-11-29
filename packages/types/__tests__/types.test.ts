/**
 * Unit tests for shared types
 * Tests type exports and interfaces
 */

import {
  Attestation,
  AttestationType,
  CreateAttestationDTO,
  VerifiableCredential,
  ProductPassport,
  ZKProof,
  User,
} from '../src';

describe('Types Package', () => {
  describe('Attestation Types', () => {
    it('should have correct AttestationType enum values', () => {
      expect(AttestationType.QUALITY_TEST).toBe('QualityTest');
      expect(AttestationType.CERTIFICATION).toBe('Certification');
      expect(AttestationType.BATTERY_PASSPORT).toBe('BatteryPassport');
      expect(AttestationType.FOOD_SAFETY).toBe('FoodSafety');
    });

    it('should accept valid Attestation object', () => {
      const attestation: Attestation = {
        id: 'test-id',
        issuer_did: 'did:proofpass:123',
        subject: 'PRODUCT-001',
        type: 'QualityTest',
        claims: { result: 'pass' },
        issued_at: new Date(),
        credential: {} as VerifiableCredential,
        blockchain_network: 'stellar-testnet',
        status: 'anchored',
        created_at: new Date(),
        updated_at: new Date(),
        user_id: 'user-123',
      };

      expect(attestation).toBeDefined();
      expect(attestation.type).toBe('QualityTest');
    });

    it('should accept valid CreateAttestationDTO', () => {
      const dto: CreateAttestationDTO = {
        subject: 'PRODUCT-001',
        type: 'QualityTest',
        claims: {
          test_name: 'Pressure Test',
          result: 'pass',
          score: 95,
        },
        blockchain_network: 'stellar-testnet',
      };

      expect(dto).toBeDefined();
      expect(dto.claims).toHaveProperty('test_name');
    });
  });

  describe('Verifiable Credential Types', () => {
    it('should accept valid VerifiableCredential', () => {
      const vc: VerifiableCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'urn:uuid:123',
        type: ['VerifiableCredential'],
        issuer: 'did:proofpass:123',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: 'PRODUCT-001',
        },
        proof: {
          type: 'JsonWebSignature2020',
          created: new Date().toISOString(),
          verificationMethod: 'did:proofpass:123#key-1',
          proofPurpose: 'assertionMethod',
        },
      };

      expect(vc).toBeDefined();
      expect(vc['@context']).toContain('https://www.w3.org/2018/credentials/v1');
    });
  });

  describe('Product Passport Types', () => {
    it('should accept valid ProductPassport', () => {
      const passport: ProductPassport = {
        id: 'passport-123',
        product_id: 'PROD-001',
        name: 'Test Product',
        attestation_ids: ['att-1', 'att-2'],
        aggregated_credential: {} as VerifiableCredential,
        blockchain_network: 'stellar-testnet',
        created_at: new Date(),
        updated_at: new Date(),
        user_id: 'user-123',
      };

      expect(passport).toBeDefined();
      expect(passport.attestation_ids).toHaveLength(2);
    });
  });

  describe('ZK Proof Types', () => {
    it('should accept valid ZKProof', () => {
      const proof: ZKProof = {
        id: 'proof-123',
        attestation_id: 'att-123',
        circuit_type: 'threshold',
        public_inputs: { threshold: 100 },
        proof: '{}',
        verified: true,
        created_at: new Date(),
        user_id: 'user-123',
      };

      expect(proof).toBeDefined();
      expect(proof.circuit_type).toBe('threshold');
    });
  });

  describe('User Types', () => {
    it('should accept valid User', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed',
        name: 'Test User',
        api_key: 'key-123',
        api_key_hash: 'hashed',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });
  });
});
