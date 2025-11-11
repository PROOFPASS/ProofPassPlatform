/**
 * Unit tests for VC Verifier
 * Tests Verifiable Credential verification logic
 */

import { verifyCredential, verifyCredentialHash } from '../src/vc-verifier';
import { createVerifiableCredential, signCredential, hashCredential } from '../src/vc-generator';

describe('VC Verifier', () => {
  describe('verifyCredential', () => {
    it('should verify a valid credential', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      const signed = signCredential(vc, 'test-key');
      const result = verifyCredential(signed, 'test-key');

      expect(result.verified).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing @context', () => {
      const vc: any = {
        id: 'test',
        type: ['VerifiableCredential'],
        issuer: 'did:proofpass:123',
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: 'test' },
        proof: {},
      };

      const result = verifyCredential(vc);

      expect(result.verified).toBe(false);
      expect(result.errors).toContain('Missing @context');
    });

    it('should detect missing id', () => {
      const vc: any = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:proofpass:123',
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: 'test' },
        proof: {},
      };

      const result = verifyCredential(vc);

      expect(result.verified).toBe(false);
      expect(result.errors).toContain('Missing id');
    });

    it('should detect invalid type', () => {
      const vc: any = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'test',
        type: ['SomethingElse'],
        issuer: 'did:proofpass:123',
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: 'test' },
        proof: {},
      };

      const result = verifyCredential(vc);

      expect(result.verified).toBe(false);
      expect(result.errors).toContain('Invalid or missing type');
    });

    it('should detect expired credentials', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
        expirationDate: new Date('2020-01-01').toISOString(),
      });

      const result = verifyCredential(vc);

      expect(result.verified).toBe(false);
      expect(result.errors).toContain('Credential has expired');
    });

    it('should verify signature when private key provided', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      const signed = signCredential(vc, 'correct-key');
      const result = verifyCredential(signed, 'correct-key');

      expect(result.verified).toBe(true);
    });

    it('should detect invalid signature', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      const signed = signCredential(vc, 'correct-key');
      const result = verifyCredential(signed, 'wrong-key');

      expect(result.verified).toBe(false);
      expect(result.errors).toContain('Invalid signature');
    });
  });

  describe('verifyCredentialHash', () => {
    it('should verify matching credential hash', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      const hash = hashCredential(vc);
      const result = verifyCredentialHash(vc, hash);

      expect(result).toBe(true);
    });

    it('should reject non-matching credential hash', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      const result = verifyCredentialHash(vc, 'wrong-hash');

      expect(result).toBe(false);
    });
  });
});
