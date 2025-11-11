/**
 * Unit tests for VC Generator
 * Tests Verifiable Credential generation and signing
 */

import {
  createVerifiableCredential,
  signCredential,
  hashCredential,
} from '../src/vc-generator';

describe('VC Generator', () => {
  describe('createVerifiableCredential', () => {
    it('should create a valid verifiable credential', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: {
          id: 'PRODUCT-001',
          name: 'Test Product',
        },
        type: ['QualityTest'],
      });

      expect(vc).toBeDefined();
      expect(vc['@context']).toContain('https://www.w3.org/2018/credentials/v1');
      expect(vc.type).toContain('VerifiableCredential');
      expect(vc.type).toContain('QualityTest');
      expect(vc.issuer).toBe('did:proofpass:123');
      expect(vc.credentialSubject.id).toBe('PRODUCT-001');
      expect(vc.issuanceDate).toBeDefined();
      expect(vc.id).toMatch(/^urn:uuid:/);
    });

    it('should include expiration date when provided', () => {
      const expirationDate = new Date('2025-12-31').toISOString();

      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
        expirationDate,
      });

      expect(vc.expirationDate).toBe(expirationDate);
    });

    it('should create proof structure', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      expect(vc.proof).toBeDefined();
      expect(vc.proof.type).toBe('JsonWebSignature2020');
      expect(vc.proof.verificationMethod).toBe('did:proofpass:123#key-1');
      expect(vc.proof.proofPurpose).toBe('assertionMethod');
    });
  });

  describe('signCredential', () => {
    it('should sign a credential and add JWS to proof', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      const signed = signCredential(vc, 'test-private-key');

      expect(signed.proof.jws).toBeDefined();
      expect(typeof signed.proof.jws).toBe('string');
      expect(signed.proof.jws!.length).toBeGreaterThan(0);
    });

    it('should produce consistent signatures for same input', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      const signed1 = signCredential(vc, 'test-key');
      const signed2 = signCredential(vc, 'test-key');

      expect(signed1.proof.jws).toBeDefined();
      expect(signed1.proof.jws).toBe(signed2.proof.jws);
    });

    it('should produce different signatures for different keys', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      const signed1 = signCredential(vc, 'key1');
      const signed2 = signCredential(vc, 'key2');

      expect(signed1.proof.jws).toBeDefined();
      expect(signed2.proof.jws).toBeDefined();
      expect(signed1.proof.jws).not.toBe(signed2.proof.jws);
    });
  });

  describe('hashCredential', () => {
    it('should generate a hash for a credential', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      const hash = hashCredential(vc);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex chars
    });

    it('should produce consistent hashes for same credential', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      const hash1 = hashCredential(vc);
      const hash2 = hashCredential(vc);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different credentials', () => {
      const vc1 = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      const vc2 = createVerifiableCredential({
        issuerDID: 'did:proofpass:456',
        subject: { id: 'PRODUCT-002' },
        type: ['QualityTest'],
      });

      const hash1 = hashCredential(vc1);
      const hash2 = hashCredential(vc2);

      expect(hash1).not.toBe(hash2);
    });
  });
});
