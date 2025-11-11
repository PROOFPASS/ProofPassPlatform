/**
 * W3C Verifiable Credential Signing with Ed25519
 * Implements Ed25519Signature2020 proof type
 */

import type { VerifiableCredential } from '@proofpass/types';
import * as ed25519Crypto from './ed25519-crypto';
import { createHash } from 'crypto';

export interface SignCredentialOptions {
  credential: VerifiableCredential;
  secretKey: Uint8Array | string; // Uint8Array or hex string
  verificationMethod?: string;
}

export interface VerifyCredentialOptions {
  credential: VerifiableCredential;
  publicKey?: Uint8Array | string; // Optional: extract from DID if not provided
}

/**
 * Sign a Verifiable Credential with Ed25519
 * Creates an Ed25519Signature2020 proof
 */
export async function signCredentialEd25519(
  options: SignCredentialOptions
): Promise<VerifiableCredential> {
  const { credential, secretKey: secretKeyInput, verificationMethod } = options;

  // Convert secret key to Uint8Array if it's a hex string
  const secretKey = typeof secretKeyInput === 'string'
    ? ed25519Crypto.hexToSecretKey(secretKeyInput)
    : secretKeyInput;

  // Derive public key from secret key
  const publicKey = await import('@noble/ed25519').then(ed => ed.getPublicKeyAsync(secretKey));
  const issuerDID = ed25519Crypto.publicKeyToDID(publicKey);

  // Prepare credential without proof
  const credentialWithoutProof = {
    ...credential,
    issuer: issuerDID,
    proof: undefined
  };

  // Create canonical JSON (sorted keys) for signing
  const canonicalJson = canonicalize(credentialWithoutProof);
  const dataToSign = new TextEncoder().encode(canonicalJson);

  // Sign the data
  const signatureResult = await ed25519Crypto.sign(dataToSign, secretKey);

  // Derive verification method
  const verMethod = verificationMethod || ed25519Crypto.getVerificationMethod(issuerDID);

  // Create proof object
  const proof = {
    type: 'Ed25519Signature2020',
    created: new Date().toISOString(),
    verificationMethod: verMethod,
    proofPurpose: 'assertionMethod',
    proofValue: signatureResult.signatureBase58
  };

  return {
    ...credentialWithoutProof,
    issuer: issuerDID,
    proof
  };
}

/**
 * Verify an Ed25519-signed Verifiable Credential
 */
export async function verifyCredentialEd25519(
  options: VerifyCredentialOptions
): Promise<{ verified: boolean; error?: string }> {
  const { credential, publicKey: publicKeyInput } = options;

  // Check if credential has proof
  if (!credential.proof || !credential.proof.proofValue) {
    return { verified: false, error: 'Missing proof or proofValue' };
  }

  // Check proof type
  if (credential.proof.type !== 'Ed25519Signature2020') {
    return { verified: false, error: `Unsupported proof type: ${credential.proof.type}` };
  }

  try {
    // Extract public key
    let publicKey: Uint8Array;

    if (publicKeyInput) {
      // Use provided public key
      publicKey = typeof publicKeyInput === 'string'
        ? ed25519Crypto.hexToPublicKey(publicKeyInput)
        : publicKeyInput;
    } else {
      // Extract from issuer DID
      if (typeof credential.issuer !== 'string') {
        return { verified: false, error: 'Invalid issuer format' };
      }

      const extractedKey = ed25519Crypto.didToPublicKey(credential.issuer);
      if (!extractedKey) {
        return { verified: false, error: 'Could not extract public key from issuer DID' };
      }
      publicKey = extractedKey;
    }

    // Prepare credential without proof
    const credentialWithoutProof = {
      ...credential,
      proof: undefined
    };

    // Create canonical JSON
    const canonicalJson = canonicalize(credentialWithoutProof);
    const dataToVerify = new TextEncoder().encode(canonicalJson);

    // Decode signature from base58
    const { base58btc } = await import('multiformats/bases/base58');
    const signature = base58btc.decode(credential.proof.proofValue);

    // Verify signature
    const isValid = await ed25519Crypto.verify(signature, dataToVerify, publicKey);

    return { verified: isValid };
  } catch (error: any) {
    return { verified: false, error: error.message || 'Verification failed' };
  }
}

/**
 * Create a SHA-256 hash of a credential (for blockchain anchoring)
 */
export function hashCredentialForAnchor(credential: VerifiableCredential): string {
  const canonicalJson = canonicalize(credential);
  return createHash('sha256').update(canonicalJson).digest('hex');
}

/**
 * Canonicalize JSON (RFC 8785) - sorted keys for deterministic signatures
 * Simplified implementation for credential signing
 */
function canonicalize(obj: any): string {
  if (obj === null) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);

  if (Array.isArray(obj)) {
    const items = obj.map(item => canonicalize(item));
    return '[' + items.join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  const pairs = keys.map(key => {
    const value = obj[key];
    if (value === undefined) return null;
    return JSON.stringify(key) + ':' + canonicalize(value);
  }).filter(p => p !== null);

  return '{' + pairs.join(',') + '}';
}
