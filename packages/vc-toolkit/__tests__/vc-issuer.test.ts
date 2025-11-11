/**
 * Tests for VC Issuer implementation
 */

import { issueVC, createCredential, parseVCJWT } from '../src/vc/vc-issuer';
import { generateDIDKey } from '../src/did/did-key';

describe('VC Issuer Implementation', () => {
  let issuerKeyPair: Awaited<ReturnType<typeof generateDIDKey>>;
  let subjectKeyPair: Awaited<ReturnType<typeof generateDIDKey>>;

  beforeAll(async () => {
    issuerKeyPair = await generateDIDKey();
    subjectKeyPair = await generateDIDKey();
  });

  describe('createCredential', () => {
    it('should create a basic credential', () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {
          name: 'Alice',
          degree: 'Bachelor of Science',
        },
      });

      expect(credential['@context']).toContain('https://www.w3.org/2018/credentials/v1');
      expect(credential.type).toContain('VerifiableCredential');
      expect(credential.issuer).toBe(issuerKeyPair.did);
      expect(credential.credentialSubject.id).toBe(subjectKeyPair.did);
      expect(credential.credentialSubject.name).toBe('Alice');
      expect(credential.issuanceDate).toBeDefined();
    });

    it('should support custom credential types', () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        type: ['EducationCredential', 'UniversityDegree'],
        credentialSubject: {
          degree: 'PhD',
        },
      });

      expect(credential.type).toContain('VerifiableCredential');
      expect(credential.type).toContain('EducationCredential');
      expect(credential.type).toContain('UniversityDegree');
    });

    it('should include expiration date if provided', () => {
      const expirationDate = '2025-12-31T23:59:59Z';

      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {},
        expirationDate,
      });

      expect(credential.expirationDate).toBe(expirationDate);
    });

    it('should have valid issuance date', () => {
      const beforeCreation = new Date();

      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {},
      });

      const issuanceDate = new Date(credential.issuanceDate);
      const afterCreation = new Date();

      expect(issuanceDate.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(issuanceDate.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('issueVC', () => {
    it('should issue a valid VC JWT', async () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {
          name: 'Test User',
        },
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      expect(typeof vcJwt).toBe('string');
      expect(vcJwt.split('.').length).toBe(3); // JWT format: header.payload.signature
    });

    it('should create JWT with correct structure', async () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {
          test: 'data',
        },
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      const payload = parseVCJWT(vcJwt);

      expect(payload.iss).toBe(issuerKeyPair.did);
      expect(payload.sub).toBe(subjectKeyPair.did);
      expect(payload.vc).toBeDefined();
      expect(payload.vc.credentialSubject).toBeDefined();
    });

    it('should include expiration in JWT if specified', async () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {},
      });

      const expiresInSeconds = 3600; // 1 hour

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
        expiresInSeconds,
      });

      const payload = parseVCJWT(vcJwt);

      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should use credential expirationDate over expiresInSeconds', async () => {
      const expirationDate = '2030-01-01T00:00:00Z';
      const expectedExp = Math.floor(new Date(expirationDate).getTime() / 1000);

      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {},
        expirationDate,
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
        expiresInSeconds: 3600, // This should be ignored
      });

      const payload = parseVCJWT(vcJwt);

      expect(payload.exp).toBe(expectedExp);
    });
  });

  describe('parseVCJWT', () => {
    it('should parse JWT payload correctly', async () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        credentialSubject: {
          name: 'Parse Test',
          value: 12345,
        },
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      const parsed = parseVCJWT(vcJwt);

      expect(parsed.iss).toBe(issuerKeyPair.did);
      expect(parsed.vc.credentialSubject.name).toBe('Parse Test');
      expect(parsed.vc.credentialSubject.value).toBe(12345);
    });

    it('should throw error for invalid JWT format', () => {
      expect(() => parseVCJWT('invalid')).toThrow('Invalid JWT format');
      expect(() => parseVCJWT('not.a.jwt')).toThrow();
    });

    it('should parse complex credential data', async () => {
      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        type: ['ProductPassport'],
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

      const parsed = parseVCJWT(vcJwt);

      expect(parsed.vc.type).toContain('ProductPassport');
      expect(parsed.vc.credentialSubject.product.materials).toEqual(['cotton', 'polyester']);
      expect(parsed.vc.credentialSubject.certifications).toHaveLength(2);
    });
  });

  describe('Integration Tests', () => {
    it('should create and parse round-trip', async () => {
      const originalData = {
        name: 'Integration Test',
        timestamp: Date.now(),
        nested: {
          field: 'value',
          number: 42,
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

      const parsed = parseVCJWT(vcJwt);

      expect(parsed.vc.credentialSubject.name).toBe(originalData.name);
      expect(parsed.vc.credentialSubject.timestamp).toBe(originalData.timestamp);
      expect(parsed.vc.credentialSubject.nested).toEqual(originalData.nested);
    });

    it('should handle multiple credential types', async () => {
      const types = ['EducationCredential', 'UniversityDegree', 'BachelorDegree'];

      const credential = createCredential({
        issuerDID: issuerKeyPair.did,
        subjectDID: subjectKeyPair.did,
        type: types,
        credentialSubject: {
          degree: 'Computer Science',
        },
      });

      const vcJwt = await issueVC({
        credential,
        issuerKeyPair,
      });

      const parsed = parseVCJWT(vcJwt);

      types.forEach((type) => {
        expect(parsed.vc.type).toContain(type);
      });
    });
  });
});
