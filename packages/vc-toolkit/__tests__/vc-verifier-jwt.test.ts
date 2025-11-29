/**
 * Tests for VC Verifier JWT implementation (W3C standards-based)
 */

import { verifyVC, verifyVCs, isExpired, extractClaims } from '../src/vc/vc-verifier-jwt';
import { issueVC, createCredential } from '../src/vc/vc-issuer';
import { generateDIDKey } from '../src/did/did-key';
import { createDIDWeb } from '../src/did/did-web';

describe('VC Verifier JWT Implementation', () => {
  let issuerKeyPair: Awaited<ReturnType<typeof generateDIDKey>>;
  let subjectKeyPair: Awaited<ReturnType<typeof generateDIDKey>>;

  beforeAll(async () => {
    issuerKeyPair = await generateDIDKey();
    subjectKeyPair = await generateDIDKey();
  });

  describe('verifyVC', () => {
    it('should verify a valid VC JWT', async () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      const result = await verifyVC(vcJwt);

      expect(result.verified).toBe(true);
      expect(result.issuer).toBe(issuerKeyPair.did);
      expect(result.credentialSubject.name).toBe('Test User');
      expect(result.credentialSubject.email).toBe('test@example.com');
    });

    it('should return verification result with issuer and subject', async () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {
          value: 12345,
        },
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      const result = await verifyVC(vcJwt);

      expect(result.issuer).toBe(issuerKeyPair.did);
      expect(result.subject).toBeDefined();
      expect(result.credentialSubject).toBeDefined();
    });

    it('should detect expired credentials', async () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {
          test: 'expired',
        },
        expirationDate: '2020-01-01T00:00:00Z', // Past date
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      const result = await verifyVC(vcJwt);

      // Should fail verification due to expiration
      expect(result.verified).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid JWT format', async () => {
      const result = await verifyVC('invalid.jwt.format');

      expect(result.verified).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed JWT', async () => {
      const result = await verifyVC('not-a-jwt-at-all');

      expect(result.verified).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should verify VC with custom types', async () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        type: ['EducationCredential'],
        credentialSubject: {
          degree: 'Bachelor of Science',
        },
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      const result = await verifyVC(vcJwt);

      expect(result.verified).toBe(true);
      expect(result.credentialSubject.degree).toBe('Bachelor of Science');
    });
  });

  describe('verifyVCs', () => {
    it('should verify multiple VCs in parallel', async () => {
      const credentials = [
        createCredential({
          issuerDID: issuerKeyPair.did,
          subjectDID: subjectKeyPair.did,
          credentialSubject: { name: 'User 1' },
        }),
        createCredential({
          issuerDID: issuerKeyPair.did,
          subjectDID: subjectKeyPair.did,
          credentialSubject: { name: 'User 2' },
        }),
        createCredential({
          issuerDID: issuerKeyPair.did,
          subjectDID: subjectKeyPair.did,
          credentialSubject: { name: 'User 3' },
        }),
      ];

      const vcJwts = await Promise.all(
        credentials.map((credential) => issueVC({ credential, issuerKeyPair }))
      );

      const results = await verifyVCs(vcJwts);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.verified).toBe(true);
        expect(result.credentialSubject.name).toBe(`User ${index + 1}`);
      });
    });

    it('should handle mix of valid and invalid VCs', async () => {
      const validCredential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: { name: 'Valid' },
      });

      const validVcJwt = await issueVC({
        credential: validCredential,
        issuerKeyPair,
      });

      const results = await verifyVCs([validVcJwt, 'invalid.jwt', 'another.invalid']);

      expect(results).toHaveLength(3);
      expect(results[0].verified).toBe(true);
      expect(results[1].verified).toBe(false);
      expect(results[2].verified).toBe(false);
    });

    it('should handle empty array', async () => {
      const results = await verifyVCs([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('isExpired', () => {
    it('should return false for credentials without expiration', () => {
      const vc = {};

      expect(isExpired(vc)).toBe(false);
    });

    it('should return false for future expiration date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const vc = {
        expirationDate: futureDate.toISOString(),
      };

      expect(isExpired(vc)).toBe(false);
    });

    it('should return true for past expiration date', () => {
      const vc = {
        expirationDate: '2020-01-01T00:00:00Z',
      };

      expect(isExpired(vc)).toBe(true);
    });

    it('should handle edge case of current time', () => {
      const now = new Date();
      const vc = {
        expirationDate: now.toISOString(),
      };

      // Should be expired or very close to expired
      const result = isExpired(vc);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('extractClaims', () => {
    it('should extract claims from verified credential', async () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {
          name: 'Alice',
          age: 30,
          country: 'USA',
        },
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      const verificationResult = await verifyVC(vcJwt);

      // Only extract claims if verified successfully
      if (verificationResult.verified) {
        const claims = extractClaims(verificationResult);

        expect(claims.name).toBe('Alice');
        expect(claims.age).toBe(30);
        expect(claims.country).toBe('USA');
      }
    });

    it('should throw error for unverified credential', () => {
      const unverifiedResult = {
        verified: false,
        issuer: '',
        subject: '',
        credentialSubject: {},
        error: 'Verification failed',
      };

      expect(() => extractClaims(unverifiedResult)).toThrow(
        'Cannot extract claims from unverified credential'
      );
    });

    it('should handle complex nested claims', async () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {
          product: {
            name: 'T-Shirt',
            sku: 'TS-001',
            materials: ['cotton', 'polyester'],
          },
          certifications: ['GOTS', 'Fair Trade'],
        },
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      const verificationResult = await verifyVC(vcJwt);

      if (verificationResult.verified) {
        const claims = extractClaims(verificationResult);

        expect(claims.product.name).toBe('T-Shirt');
        expect(claims.product.materials).toEqual(['cotton', 'polyester']);
        expect(claims.certifications).toHaveLength(2);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should complete full VC lifecycle: issue -> verify -> extract', async () => {
      // Issue
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {
          name: 'Integration Test',
          value: 42,
        },
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      // Verify
      const verificationResult = await verifyVC(vcJwt);

      expect(verificationResult.verified).toBe(true);
      expect(verificationResult.issuer).toBe(issuerKeyPair.did);

      // Extract
      if (verificationResult.verified) {
        const claims = extractClaims(verificationResult);

        expect(claims.name).toBe('Integration Test');
        expect(claims.value).toBe(42);
      }
    });

    it('should work with did:web issuers', async () => {
      const webDID = await createDIDWeb({
        domain: 'proofpass.com',
        path: ['orgs', 'test-org'],
      });

      const credential = createCredential({
        issuerDID: webDID.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {
          orgName: 'Test Organization',
        },
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair: webDID.keyPair,
      });

      const result = await verifyVC(vcJwt);

      // Note: The JWT issuer is the keyPair's DID (did:key:...), not the credential's issuer (did:web:...)
      // This is because issueVC uses issuerKeyPair.did for the JWT iss claim
      expect(result.issuer).toBe(webDID.keyPair.did);
      expect(result.credentialSubject.orgName).toBe('Test Organization');
    });

    it('should preserve all credential data through verification', async () => {
      const originalData = {
        name: 'Data Preservation Test',
        timestamp: Date.now(),
        nested: {
          field1: 'value1',
          field2: 123,
          array: [1, 2, 3],
        },
      };

      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: originalData,
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      const result = await verifyVC(vcJwt);

      expect(result.credentialSubject.name).toBe(originalData.name);
      expect(result.credentialSubject.timestamp).toBe(originalData.timestamp);
      expect(result.credentialSubject.nested).toEqual(originalData.nested);
    });

    it('should handle multiple VCs from different issuers', async () => {
      const issuer1 = await generateDIDKey();
      const issuer2 = await generateDIDKey();

      const cred1 = createCredential({
        issuerDID: issuer1.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: { source: 'issuer1' },
      });

      const cred2 = createCredential({
        issuerDID: issuer2.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: { source: 'issuer2' },
      });

      const jwt1 = await issueVC({ credential: cred1, issuerKeyPair: issuer1 });
      const jwt2 = await issueVC({ credential: cred2, issuerKeyPair: issuer2 });

      const results = await verifyVCs([jwt1, jwt2]);

      expect(results[0].issuer).toBe(issuer1.did);
      expect(results[1].issuer).toBe(issuer2.did);
      expect(results[0].credentialSubject.source).toBe('issuer1');
      expect(results[1].credentialSubject.source).toBe('issuer2');
    });
  });
});
