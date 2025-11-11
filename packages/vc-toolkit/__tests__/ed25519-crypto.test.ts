/**
 * Tests para Ed25519 Cryptographic Operations
 * Coverage objetivo: 100%
 */

import * as ed25519Crypto from '../src/ed25519-crypto';

describe('Ed25519 Crypto', () => {
  let keyPair: ed25519Crypto.KeyPair;

  beforeAll(async () => {
    keyPair = await ed25519Crypto.generateKeyPair();
  });

  describe('generateKeyPair', () => {
    it('debe generar un par de claves válido', async () => {
      const kp = await ed25519Crypto.generateKeyPair();

      expect(kp.publicKey).toBeInstanceOf(Uint8Array);
      expect(kp.secretKey).toBeInstanceOf(Uint8Array);
      expect(kp.publicKey.length).toBe(32);
      expect(kp.secretKey.length).toBe(32);
    });

    it('debe generar claves diferentes en cada llamada', async () => {
      const kp1 = await ed25519Crypto.generateKeyPair();
      const kp2 = await ed25519Crypto.generateKeyPair();

      expect(kp1.secretKey).not.toEqual(kp2.secretKey);
      expect(kp1.publicKey).not.toEqual(kp2.publicKey);
    });
  });

  describe('sign y verify', () => {
    it('debe firmar y verificar datos correctamente', async () => {
      const data = new TextEncoder().encode('Hello, World!');
      const signatureResult = await ed25519Crypto.sign(data, keyPair.secretKey);

      expect(signatureResult.signature).toBeInstanceOf(Uint8Array);
      expect(signatureResult.signatureBase58).toMatch(/^z/);

      const isValid = await ed25519Crypto.verify(
        signatureResult.signature,
        data,
        keyPair.publicKey
      );

      expect(isValid).toBe(true);
    });

    it('debe fallar la verificación con datos incorrectos', async () => {
      const data = new TextEncoder().encode('Hello, World!');
      const wrongData = new TextEncoder().encode('Wrong data');

      const signatureResult = await ed25519Crypto.sign(data, keyPair.secretKey);

      const isValid = await ed25519Crypto.verify(
        signatureResult.signature,
        wrongData,
        keyPair.publicKey
      );

      expect(isValid).toBe(false);
    });

    it('debe fallar la verificación con clave pública incorrecta', async () => {
      const data = new TextEncoder().encode('Hello, World!');
      const signatureResult = await ed25519Crypto.sign(data, keyPair.secretKey);

      const wrongKeyPair = await ed25519Crypto.generateKeyPair();

      const isValid = await ed25519Crypto.verify(
        signatureResult.signature,
        data,
        wrongKeyPair.publicKey
      );

      expect(isValid).toBe(false);
    });

    it('debe fallar la verificación con firma inválida', async () => {
      const data = new TextEncoder().encode('Hello, World!');
      const invalidSignature = new Uint8Array(64);

      const isValid = await ed25519Crypto.verify(
        invalidSignature,
        data,
        keyPair.publicKey
      );

      expect(isValid).toBe(false);
    });
  });

  describe('publicKeyToDID y didToPublicKey', () => {
    it('debe convertir public key a DID format', () => {
      const did = ed25519Crypto.publicKeyToDID(keyPair.publicKey);

      expect(did).toMatch(/^did:key:z/);
      expect(did.length).toBeGreaterThan(20);
    });

    it('debe extraer public key de DID', () => {
      const did = ed25519Crypto.publicKeyToDID(keyPair.publicKey);
      const extractedKey = ed25519Crypto.didToPublicKey(did);

      expect(extractedKey).not.toBeNull();
      expect(extractedKey).toEqual(keyPair.publicKey);
    });

    it('debe retornar null para DID inválido', () => {
      const result1 = ed25519Crypto.didToPublicKey('invalid-did');
      const result2 = ed25519Crypto.didToPublicKey('did:key:invalid');
      const result3 = ed25519Crypto.didToPublicKey('did:other:z123');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });

    it('debe retornar null para DID con prefijo multicodec incorrecto', () => {
      // Create a DID with wrong multicodec prefix
      const wrongPrefix = new Uint8Array([0xaa, 0xbb, ...keyPair.publicKey]);
      const { base58btc } = require('multiformats/bases/base58');
      const encoded = base58btc.encode(wrongPrefix);
      const invalidDID = `did:key:${encoded}`;

      const result = ed25519Crypto.didToPublicKey(invalidDID);

      expect(result).toBeNull();
    });
  });

  describe('Conversiones hex', () => {
    it('debe convertir secretKey a hex y viceversa', () => {
      const hex = ed25519Crypto.secretKeyToHex(keyPair.secretKey);

      expect(typeof hex).toBe('string');
      expect(hex).toMatch(/^[0-9a-f]+$/);
      expect(hex.length).toBe(64);

      const restored = ed25519Crypto.hexToSecretKey(hex);

      expect(restored).toEqual(keyPair.secretKey);
    });

    it('debe convertir publicKey a hex y viceversa', () => {
      const hex = ed25519Crypto.publicKeyToHex(keyPair.publicKey);

      expect(typeof hex).toBe('string');
      expect(hex).toMatch(/^[0-9a-f]+$/);
      expect(hex.length).toBe(64);

      const restored = ed25519Crypto.hexToPublicKey(hex);

      expect(restored).toEqual(keyPair.publicKey);
    });
  });

  describe('getVerificationMethod', () => {
    it('debe derivar verification method ID del DID', () => {
      const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
      const verificationMethod = ed25519Crypto.getVerificationMethod(did);

      expect(verificationMethod).toBe('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXg');
      expect(verificationMethod).toContain(did);
      expect(verificationMethod).toContain('#');
    });

    it('debe extraer los primeros 8 caracteres después de did:key:', () => {
      const did = 'did:key:z123456789';
      const verificationMethod = ed25519Crypto.getVerificationMethod(did);

      expect(verificationMethod).toBe('did:key:z123456789#z1234567');
    });
  });

  describe('Flujo end-to-end completo', () => {
    it('debe completar flujo: generate -> sign -> DID -> verify', async () => {
      // 1. Generate keypair
      const kp = await ed25519Crypto.generateKeyPair();

      // 2. Create DID
      const did = ed25519Crypto.publicKeyToDID(kp.publicKey);

      // 3. Sign data
      const message = 'Test message for end-to-end flow';
      const data = new TextEncoder().encode(message);
      const sig = await ed25519Crypto.sign(data, kp.secretKey);

      // 4. Extract public key from DID
      const extractedPubKey = ed25519Crypto.didToPublicKey(did);
      expect(extractedPubKey).not.toBeNull();

      // 5. Verify signature
      const isValid = await ed25519Crypto.verify(
        sig.signature,
        data,
        extractedPubKey!
      );

      expect(isValid).toBe(true);
    });

    it('debe completar flujo con serialización hex', async () => {
      // 1. Generate and store keys as hex
      const kp = await ed25519Crypto.generateKeyPair();
      const secretHex = ed25519Crypto.secretKeyToHex(kp.secretKey);
      const publicHex = ed25519Crypto.publicKeyToHex(kp.publicKey);

      // 2. Restore from hex
      const restoredSecret = ed25519Crypto.hexToSecretKey(secretHex);
      const restoredPublic = ed25519Crypto.hexToPublicKey(publicHex);

      // 3. Sign with restored key
      const data = new TextEncoder().encode('Hex serialization test');
      const sig = await ed25519Crypto.sign(data, restoredSecret);

      // 4. Verify with restored public key
      const isValid = await ed25519Crypto.verify(sig.signature, data, restoredPublic);

      expect(isValid).toBe(true);
    });
  });
});
