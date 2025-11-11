/**
 * Tests para VC Signer Ed25519
 * Coverage objetivo: 100%
 */

import * as vcSigner from '../src/vc-signer-ed25519';
import * as ed25519Crypto from '../src/ed25519-crypto';
import type { VerifiableCredential } from '@proofpass/types';

describe('VC Signer Ed25519', () => {
  let keyPair: ed25519Crypto.KeyPair;
  let testCredential: VerifiableCredential;

  beforeAll(async () => {
    keyPair = await ed25519Crypto.generateKeyPair();

    testCredential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      issuer: 'did:key:placeholder',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: 'did:example:subject',
        name: 'Test Subject',
      },
    };
  });

  describe('signCredentialEd25519', () => {
    it('debe firmar credential con Uint8Array secret key', async () => {
      const signed = await vcSigner.signCredentialEd25519({
        credential: testCredential,
        secretKey: keyPair.secretKey,
      });

      expect(signed.proof).toBeDefined();
      expect(signed.proof?.type).toBe('Ed25519Signature2020');
      expect(signed.proof?.proofValue).toBeTruthy();
      expect(signed.proof?.proofValue).toMatch(/^z/);
      expect(signed.proof?.created).toBeTruthy();
      expect(signed.proof?.verificationMethod).toBeTruthy();
      expect(signed.proof?.proofPurpose).toBe('assertionMethod');
    });

    it('debe firmar credential con hex string secret key', async () => {
      const secretHex = ed25519Crypto.secretKeyToHex(keyPair.secretKey);

      const signed = await vcSigner.signCredentialEd25519({
        credential: testCredential,
        secretKey: secretHex,
      });

      expect(signed.proof).toBeDefined();
      expect(signed.proof?.proofValue).toBeTruthy();
    });

    it('debe setear el issuer como DID derivado de la clave', async () => {
      const signed = await vcSigner.signCredentialEd25519({
        credential: testCredential,
        secretKey: keyPair.secretKey,
      });

      expect(signed.issuer).toMatch(/^did:key:z/);
    });

    it('debe usar verificationMethod custom si se proporciona', async () => {
      const customVM = 'did:example:123#key-1';

      const signed = await vcSigner.signCredentialEd25519({
        credential: testCredential,
        secretKey: keyPair.secretKey,
        verificationMethod: customVM,
      });

      expect(signed.proof?.verificationMethod).toBe(customVM);
    });

    it('debe derivar verificationMethod del DID si no se proporciona', async () => {
      const signed = await vcSigner.signCredentialEd25519({
        credential: testCredential,
        secretKey: keyPair.secretKey,
      });

      expect(signed.proof?.verificationMethod).toContain('#');
      expect(signed.proof?.verificationMethod).toContain('did:key:');
    });

    it('debe remover proof anterior antes de firmar', async () => {
      const credWithProof = {
        ...testCredential,
        proof: {
          type: 'OldProof',
          proofValue: 'old value',
        },
      };

      const signed = await vcSigner.signCredentialEd25519({
        credential: credWithProof,
        secretKey: keyPair.secretKey,
      });

      expect(signed.proof?.type).toBe('Ed25519Signature2020');
      expect(signed.proof?.proofValue).not.toBe('old value');
    });

    it('debe crear signature determinística para mismo credential', async () => {
      const signed1 = await vcSigner.signCredentialEd25519({
        credential: { ...testCredential, issuanceDate: '2024-01-01T00:00:00Z' },
        secretKey: keyPair.secretKey,
      });

      const signed2 = await vcSigner.signCredentialEd25519({
        credential: { ...testCredential, issuanceDate: '2024-01-01T00:00:00Z' },
        secretKey: keyPair.secretKey,
      });

      // Las signatures deberían ser iguales para mismo credential (misma fecha)
      expect(signed1.proof?.proofValue).toBe(signed2.proof?.proofValue);
    });
  });

  describe('verifyCredentialEd25519', () => {
    let signedCredential: VerifiableCredential;

    beforeAll(async () => {
      signedCredential = await vcSigner.signCredentialEd25519({
        credential: testCredential,
        secretKey: keyPair.secretKey,
      });
    });

    it('debe verificar credential válido', async () => {
      const result = await vcSigner.verifyCredentialEd25519({
        credential: signedCredential,
      });

      expect(result.verified).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('debe verificar con public key proporcionada (Uint8Array)', async () => {
      const result = await vcSigner.verifyCredentialEd25519({
        credential: signedCredential,
        publicKey: keyPair.publicKey,
      });

      expect(result.verified).toBe(true);
    });

    it('debe verificar con public key proporcionada (hex string)', async () => {
      const publicHex = ed25519Crypto.publicKeyToHex(keyPair.publicKey);

      const result = await vcSigner.verifyCredentialEd25519({
        credential: signedCredential,
        publicKey: publicHex,
      });

      expect(result.verified).toBe(true);
    });

    it('debe fallar si falta proof', async () => {
      const credWithoutProof = { ...signedCredential, proof: undefined };

      const result = await vcSigner.verifyCredentialEd25519({
        credential: credWithoutProof,
      });

      expect(result.verified).toBe(false);
      expect(result.error).toContain('Missing proof');
    });

    it('debe fallar si falta proofValue', async () => {
      const credWithoutProofValue = {
        ...signedCredential,
        proof: { ...signedCredential.proof, proofValue: undefined },
      };

      const result = await vcSigner.verifyCredentialEd25519({
        credential: credWithoutProofValue as any,
      });

      expect(result.verified).toBe(false);
      expect(result.error).toContain('Missing proof');
    });

    it('debe fallar con proof type no soportado', async () => {
      const credWithWrongProof = {
        ...signedCredential,
        proof: { ...signedCredential.proof, type: 'UnsupportedProof' },
      };

      const result = await vcSigner.verifyCredentialEd25519({
        credential: credWithWrongProof as any,
      });

      expect(result.verified).toBe(false);
      expect(result.error).toContain('Unsupported proof type');
    });

    it('debe fallar con credential modificado', async () => {
      const modifiedCredential = {
        ...signedCredential,
        credentialSubject: {
          ...signedCredential.credentialSubject,
          name: 'Modified Name',
        },
      };

      const result = await vcSigner.verifyCredentialEd25519({
        credential: modifiedCredential,
      });

      expect(result.verified).toBe(false);
    });

    it('debe fallar con public key incorrecta', async () => {
      const wrongKeyPair = await ed25519Crypto.generateKeyPair();

      const result = await vcSigner.verifyCredentialEd25519({
        credential: signedCredential,
        publicKey: wrongKeyPair.publicKey,
      });

      expect(result.verified).toBe(false);
    });

    it('debe fallar si issuer no es string', async () => {
      const credWithObjectIssuer = {
        ...signedCredential,
        issuer: { id: 'did:example:123' },
      };

      const result = await vcSigner.verifyCredentialEd25519({
        credential: credWithObjectIssuer as any,
      });

      expect(result.verified).toBe(false);
      expect(result.error).toContain('Invalid issuer format');
    });

    it('debe fallar si no puede extraer public key del DID', async () => {
      const credWithInvalidDID = {
        ...signedCredential,
        issuer: 'invalid-did',
      };

      const result = await vcSigner.verifyCredentialEd25519({
        credential: credWithInvalidDID,
      });

      expect(result.verified).toBe(false);
      expect(result.error).toContain('Could not extract public key');
    });

    it('debe manejar excepción durante verificación', async () => {
      const credWithInvalidSignature = {
        ...signedCredential,
        proof: {
          ...signedCredential.proof,
          proofValue: 'zinvalid',
        },
      };

      const result = await vcSigner.verifyCredentialEd25519({
        credential: credWithInvalidSignature as any,
      });

      expect(result.verified).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('hashCredentialForAnchor', () => {
    it('debe crear hash SHA-256 del credential', () => {
      const hash = vcSigner.hashCredentialForAnchor(testCredential);

      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash.length).toBe(64);
    });

    it('debe crear hash determinístico para mismo credential', () => {
      const hash1 = vcSigner.hashCredentialForAnchor(testCredential);
      const hash2 = vcSigner.hashCredentialForAnchor(testCredential);

      expect(hash1).toBe(hash2);
    });

    it('debe crear hashes diferentes para credentials diferentes', () => {
      const cred2 = {
        ...testCredential,
        credentialSubject: {
          id: 'did:example:different',
          name: 'Different Subject',
        },
      };

      const hash1 = vcSigner.hashCredentialForAnchor(testCredential);
      const hash2 = vcSigner.hashCredentialForAnchor(cred2);

      expect(hash1).not.toBe(hash2);
    });

    it('debe incluir proof en el hash', async () => {
      const unsigned = { ...testCredential };
      const signed = await vcSigner.signCredentialEd25519({
        credential: unsigned,
        secretKey: keyPair.secretKey,
      });

      const hashUnsigned = vcSigner.hashCredentialForAnchor(unsigned);
      const hashSigned = vcSigner.hashCredentialForAnchor(signed);

      expect(hashUnsigned).not.toBe(hashSigned);
    });
  });

  describe('Flujo end-to-end completo', () => {
    it('debe completar flujo: generate keys -> sign -> verify', async () => {
      // 1. Generate new keypair
      const kp = await ed25519Crypto.generateKeyPair();

      // 2. Create credential
      const credential: VerifiableCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'TestCredential'],
        issuer: 'placeholder',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: 'did:example:alice',
          achievement: 'Completed testing course',
        },
      };

      // 3. Sign credential
      const signed = await vcSigner.signCredentialEd25519({
        credential,
        secretKey: kp.secretKey,
      });

      // 4. Verify signature
      const result = await vcSigner.verifyCredentialEd25519({
        credential: signed,
      });

      expect(result.verified).toBe(true);

      // 5. Hash for anchoring
      const hash = vcSigner.hashCredentialForAnchor(signed);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('debe completar flujo con serialización hex', async () => {
      // 1. Generate and store keys as hex
      const kp = await ed25519Crypto.generateKeyPair();
      const secretHex = ed25519Crypto.secretKeyToHex(kp.secretKey);
      const publicHex = ed25519Crypto.publicKeyToHex(kp.publicKey);

      // 2. Sign with hex secret key
      const signed = await vcSigner.signCredentialEd25519({
        credential: testCredential,
        secretKey: secretHex,
      });

      // 3. Verify with hex public key
      const result = await vcSigner.verifyCredentialEd25519({
        credential: signed,
        publicKey: publicHex,
      });

      expect(result.verified).toBe(true);
    });

    it('debe detectar modificación después de firma', async () => {
      // 1. Sign
      const signed = await vcSigner.signCredentialEd25519({
        credential: testCredential,
        secretKey: keyPair.secretKey,
      });

      // 2. Verify original
      let result = await vcSigner.verifyCredentialEd25519({
        credential: signed,
      });
      expect(result.verified).toBe(true);

      // 3. Modify credential
      const modified = {
        ...signed,
        credentialSubject: {
          ...signed.credentialSubject,
          tampered: true,
        },
      };

      // 4. Verify modified (should fail)
      result = await vcSigner.verifyCredentialEd25519({
        credential: modified,
      });
      expect(result.verified).toBe(false);
    });
  });

  describe('Canonicalization', () => {
    it('debe producir misma firma independiente del orden de propiedades', async () => {
      const cred1 = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'placeholder',
        issuanceDate: '2024-01-01T00:00:00Z',
        credentialSubject: {
          id: 'did:example:subject',
          prop1: 'value1',
          prop2: 'value2',
        },
      };

      const cred2 = {
        credentialSubject: {
          prop2: 'value2',
          prop1: 'value1',
          id: 'did:example:subject',
        },
        issuanceDate: '2024-01-01T00:00:00Z',
        issuer: 'placeholder',
        type: ['VerifiableCredential'],
        '@context': ['https://www.w3.org/2018/credentials/v1'],
      };

      const signed1 = await vcSigner.signCredentialEd25519({
        credential: cred1,
        secretKey: keyPair.secretKey,
      });

      const signed2 = await vcSigner.signCredentialEd25519({
        credential: cred2 as any,
        secretKey: keyPair.secretKey,
      });

      // Deben tener la misma signature
      expect(signed1.proof?.proofValue).toBe(signed2.proof?.proofValue);
    });
  });
});
