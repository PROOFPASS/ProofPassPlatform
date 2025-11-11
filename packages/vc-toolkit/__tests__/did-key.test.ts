/**
 * Tests for did:key implementation
 */

import { generateDIDKey, parseDIDKey } from '../src/did/did-key';

describe('did:key Implementation', () => {
  describe('generateDIDKey', () => {
    it('should generate a valid did:key DID', async () => {
      const keyPair = await generateDIDKey();

      expect(keyPair.did).toBeDefined();
      expect(keyPair.did).toMatch(/^did:key:z[1-9A-HJ-NP-Za-km-z]+$/);
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKeyBase58).toBeDefined();
      expect(keyPair.privateKeyBase58).toBeDefined();
    });

    it('should generate different DIDs on each call', async () => {
      const keyPair1 = await generateDIDKey();
      const keyPair2 = await generateDIDKey();

      expect(keyPair1.did).not.toBe(keyPair2.did);
      expect(keyPair1.publicKeyBase58).not.toBe(keyPair2.publicKeyBase58);
    });

    it('should use Ed25519 key pair (32 bytes private, 32 bytes public)', async () => {
      const keyPair = await generateDIDKey();

      expect(keyPair.privateKey.length).toBe(32);
      expect(keyPair.publicKey.length).toBe(32);
    });

    it('should include multicodec prefix in DID (0xed01 for Ed25519)', async () => {
      const keyPair = await generateDIDKey();
      const publicKeyBytes = parseDIDKey(keyPair.did);

      // First two bytes should be multicodec prefix for Ed25519
      expect(publicKeyBytes[0]).toBe(0xed);
      expect(publicKeyBytes[1]).toBe(0x01);

      // Remaining bytes should match public key
      const extractedPublicKey = publicKeyBytes.slice(2);
      expect(extractedPublicKey).toEqual(keyPair.publicKey);
    });
  });

  describe('parseDIDKey', () => {
    it('should parse a valid did:key and extract public key', async () => {
      const keyPair = await generateDIDKey();
      const parsedKey = parseDIDKey(keyPair.did);

      expect(parsedKey).toBeInstanceOf(Uint8Array);
      // Should include multicodec prefix + public key
      expect(parsedKey.length).toBe(34); // 2 bytes prefix + 32 bytes key
    });

    it('should throw error for invalid DID format', () => {
      expect(() => parseDIDKey('did:invalid:123')).toThrow();
      expect(() => parseDIDKey('not-a-did')).toThrow();
      expect(() => parseDIDKey('did:key:invalid-base58')).toThrow();
    });

    it('should parse and re-encode correctly', async () => {
      const keyPair = await generateDIDKey();
      const parsed = parseDIDKey(keyPair.did);

      // Verify multicodec prefix
      expect(parsed[0]).toBe(0xed);
      expect(parsed[1]).toBe(0x01);

      // Verify public key extraction
      const extractedPubKey = parsed.slice(2);
      expect(extractedPubKey).toEqual(keyPair.publicKey);
    });
  });

  describe('Integration: Generate -> Parse -> Verify', () => {
    it('should complete full cycle successfully', async () => {
      // Generate
      const keyPair = await generateDIDKey();

      // Parse
      const multicodecKey = parseDIDKey(keyPair.did);

      // Verify structure
      expect(multicodecKey.length).toBe(34);
      expect(multicodecKey[0]).toBe(0xed);
      expect(multicodecKey[1]).toBe(0x01);

      // Verify public key matches
      const extractedPubKey = multicodecKey.slice(2);
      expect(extractedPubKey).toEqual(keyPair.publicKey);
    });

    it('should maintain consistency across multiple operations', async () => {
      const iterations = 5;
      const keyPairs = await Promise.all(
        Array(iterations)
          .fill(null)
          .map(() => generateDIDKey())
      );

      // All should be unique
      const dids = keyPairs.map((kp) => kp.did);
      const uniqueDids = new Set(dids);
      expect(uniqueDids.size).toBe(iterations);

      // All should be parseable
      keyPairs.forEach((kp) => {
        const parsed = parseDIDKey(kp.did);
        expect(parsed.slice(2)).toEqual(kp.publicKey);
      });
    });
  });
});
