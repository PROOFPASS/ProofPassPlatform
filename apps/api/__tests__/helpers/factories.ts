/**
 * Test Data Factories
 * Create consistent test data with sensible defaults
 */

import type { User, Attestation, CreateAttestationDTO, VerifiableCredential } from '@proofpass/types';

let userCounter = 0;
let attestationCounter = 0;

/**
 * Factory for creating test users
 */
export const UserFactory = {
  build(overrides: Partial<User> = {}): User {
    userCounter++;
    return {
      id: `user-${userCounter}`,
      email: `test-${userCounter}@example.com`,
      password_hash: '$2b$10$test.hash.here',
      name: `Test User ${userCounter}`,
      organization: 'Test Organization',
      api_key: `api-key-${userCounter}`,
      api_key_hash: 'hashed-api-key',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };
  },

  buildMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.build(overrides));
  },
};

/**
 * Factory for creating test attestations
 */
export const AttestationFactory = {
  build(overrides: Partial<Attestation> = {}): Attestation {
    attestationCounter++;
    return {
      id: `attestation-${attestationCounter}`,
      issuer_did: `did:proofpass:user-${attestationCounter}`,
      subject: `PRODUCT-${attestationCounter}`,
      type: 'QualityTest',
      claims: {
        test_name: 'Pressure Test',
        result: 'pass',
        score: 95,
      },
      issued_at: new Date(),
      credential: VerifiableCredentialFactory.build(),
      blockchain_network: 'stellar',
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
      user_id: `user-${attestationCounter}`,
      ...overrides,
    };
  },

  buildMany(count: number, overrides: Partial<Attestation> = {}): Attestation[] {
    return Array.from({ length: count }, () => this.build(overrides));
  },
};

/**
 * Factory for creating test DTOs
 */
export const CreateAttestationDTOFactory = {
  build(overrides: Partial<CreateAttestationDTO> = {}): CreateAttestationDTO {
    return {
      subject: 'TEST-PRODUCT-001',
      type: 'QualityTest',
      claims: {
        test_name: 'Pressure Test',
        result: 'pass',
        score: 95,
        inspector: 'Jane Doe',
      },
      blockchain_network: 'stellar',
      ...overrides,
    };
  },
};

/**
 * Factory for creating Verifiable Credentials
 */
export const VerifiableCredentialFactory = {
  build(overrides: Partial<VerifiableCredential> = {}): VerifiableCredential {
    return {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: `urn:uuid:${crypto.randomUUID()}`,
      type: ['VerifiableCredential', 'QualityTestCredential'],
      issuer: 'did:proofpass:issuer-123',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: 'PRODUCT-001',
        test_result: 'pass',
      },
      proof: {
        type: 'JsonWebSignature2020',
        created: new Date().toISOString(),
        verificationMethod: 'did:proofpass:issuer-123#key-1',
        proofPurpose: 'assertionMethod',
        jws: 'test-signature',
      },
      ...overrides,
    };
  },
};

/**
 * Reset counters (useful for test isolation)
 */
export function resetFactoryCounters(): void {
  userCounter = 0;
  attestationCounter = 0;
}
