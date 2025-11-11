/**
 * Tests for did:web implementation
 */

import { createDIDWeb, buildDIDWeb, didWebToUrl } from '../src/did/did-web';
import { generateDIDKeyPair } from '../src/did-keys';

describe('did:web Implementation', () => {
  describe('buildDIDWeb', () => {
    it('should build root domain DID', () => {
      const did = buildDIDWeb('example.com');
      expect(did).toBe('did:web:example.com');
    });

    it('should build DID with path', () => {
      const did = buildDIDWeb('example.com', ['users', 'alice']);
      expect(did).toBe('did:web:example.com:users:alice');
    });

    it('should handle multiple path segments', () => {
      const did = buildDIDWeb('proofpass.com', ['orgs', 'org-123', 'keys', 'key-1']);
      expect(did).toBe('did:web:proofpass.com:orgs:org-123:keys:key-1');
    });

    it('should handle port numbers', () => {
      const did = buildDIDWeb('localhost:3000', ['test']);
      expect(did).toBe('did:web:localhost%3A3000:test');
    });

    it('should URL-encode special characters', () => {
      const did = buildDIDWeb('example.com:8080', ['path/with:special']);
      expect(did).toContain('%3A'); // colon
    });
  });

  describe('didWebToUrl', () => {
    it('should convert root DID to well-known URL', () => {
      const url = didWebToUrl('did:web:example.com');
      expect(url).toBe('https://example.com/.well-known/did.json');
    });

    it('should convert path DID to URL', () => {
      const url = didWebToUrl('did:web:example.com:users:alice');
      expect(url).toBe('https://example.com/users/alice/did.json');
    });

    it('should handle port numbers', () => {
      const url = didWebToUrl('did:web:localhost%3A3000:test');
      expect(url).toBe('https://localhost:3000/test/did.json');
    });

    it('should throw error for invalid DID format', () => {
      expect(() => didWebToUrl('did:key:123')).toThrow();
      expect(() => didWebToUrl('invalid')).toThrow();
    });
  });

  describe('createDIDWeb', () => {
    it('should create a valid did:web DID', async () => {
      const result = await createDIDWeb({
        domain: 'example.com',
      });

      expect(result.did).toBe('did:web:example.com');
      expect(result.didDocument).toBeDefined();
      expect(result.keyPair).toBeDefined();
    });

    it('should create DID with path', async () => {
      const result = await createDIDWeb({
        domain: 'example.com',
        path: ['orgs', 'org-123'],
      });

      expect(result.did).toBe('did:web:example.com:orgs:org-123');
    });

    it('should use provided key pair if given', async () => {
      const existingKeyPair = generateDIDKeyPair();

      const result = await createDIDWeb({
        domain: 'example.com',
        keyPair: existingKeyPair,
      });

      expect(result.keyPair.publicKeyBase58).toBe(existingKeyPair.publicKeyBase58);
      expect(result.keyPair.did).toBe(existingKeyPair.did);
    });

    it('should create valid DID Document', async () => {
      const result = await createDIDWeb({
        domain: 'proofpass.com',
        path: ['orgs', 'test-org'],
      });

      const doc = result.didDocument;

      // Check DID Document structure
      expect(doc.id).toBe('did:web:proofpass.com:orgs:test-org');
      expect(doc['@context']).toContain('https://www.w3.org/ns/did/v1');
      expect(doc.verificationMethod).toBeDefined();
      expect(Array.isArray(doc.verificationMethod)).toBe(true);
      expect(doc.verificationMethod.length).toBeGreaterThan(0);

      // Check verification method
      const vm = doc.verificationMethod![0];
      expect(vm.id).toContain('#key-1');
      expect(vm.type).toBe('Ed25519VerificationKey2020');
      expect(vm.controller).toBe(doc.id);
      expect(vm.publicKeyMultibase).toBeDefined();

      // Check authentication
      expect(doc.authentication).toContain(vm.id);

      // Check assertion method
      expect(doc.assertionMethod).toContain(vm.id);
    });
  });

  describe('DID Document Validation', () => {
    it('should have correct W3C context', async () => {
      const result = await createDIDWeb({
        domain: 'example.com',
      });

      const context = result.didDocument['@context'];
      expect(Array.isArray(context)).toBe(true);
      expect(context).toContain('https://www.w3.org/ns/did/v1');
    });

    it('should have matching IDs in DID and DID Document', async () => {
      const result = await createDIDWeb({
        domain: 'test.com',
        path: ['users', 'bob'],
      });

      expect(result.did).toBe(result.didDocument.id);
    });

    it('should have valid verification method structure', async () => {
      const result = await createDIDWeb({
        domain: 'example.com',
      });

      const vm = result.didDocument.verificationMethod![0];

      // Required fields
      expect(vm.id).toBeDefined();
      expect(vm.type).toBeDefined();
      expect(vm.controller).toBeDefined();
      expect(vm.publicKeyMultibase).toBeDefined();

      // Correct types
      expect(typeof vm.id).toBe('string');
      expect(typeof vm.type).toBe('string');
      expect(typeof vm.controller).toBe('string');
      expect(typeof vm.publicKeyMultibase).toBe('string');
    });
  });

  describe('Integration Tests', () => {
    it('should create consistent DIDs', async () => {
      const domain = 'test.com';
      const path = ['orgs', 'test-org'];

      const result1 = await createDIDWeb({ domain, path });
      const result2 = await createDIDWeb({ domain, path });

      // Same configuration should produce same DID format
      expect(result1.did).toBe(result2.did);

      // But different keys
      expect(result1.keyPair.publicKeyBase58).not.toBe(result2.keyPair.publicKeyBase58);
    });

    it('should support URL construction from DID', async () => {
      const domain = 'example.com';
      const path = ['users', 'alice'];

      const result = await createDIDWeb({ domain, path });

      const url = didWebToUrl(result.did);
      expect(url).toBe('https://example.com/users/alice/did.json');
    });

    it('should serialize DID Document to JSON', async () => {
      const result = await createDIDWeb({
        domain: 'example.com',
      });

      const json = JSON.stringify(result.didDocument);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe(result.didDocument.id);
      expect(parsed['@context']).toEqual(result.didDocument['@context']);
    });
  });
});
