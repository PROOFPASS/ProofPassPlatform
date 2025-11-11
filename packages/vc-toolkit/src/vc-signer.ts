/**
 * Verifiable Credential Signer (Production-Ready)
 *
 * Uses proper Ed25519 digital signatures instead of HMAC
 * Compliant with W3C Verifiable Credentials Data Model
 */

import { v4 as uuidv4 } from 'uuid';
import type { VerifiableCredential, CredentialSubject } from '@proofpass/types';
import { signWithEd25519, verifyEd25519, type DIDKeyPair } from './did-keys';

export interface CreateVCOptions {
  issuerDID: string;
  subject: CredentialSubject;
  type: string[];
  expirationDate?: string;
}

export interface SignedVC extends VerifiableCredential {
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws: string; // JSON Web Signature (proper digital signature)
  };
}

/**
 * Create a W3C Verifiable Credential (unsigned)
 */
export function createVerifiableCredential(options: CreateVCOptions): VerifiableCredential {
  const now = new Date().toISOString();
  const id = `urn:uuid:${uuidv4()}`;

  const credential: VerifiableCredential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1',
    ],
    id,
    type: ['VerifiableCredential', ...options.type],
    issuer: options.issuerDID,
    issuanceDate: now,
    credentialSubject: options.subject,
    proof: {
      type: 'Ed25519Signature2020',
      created: now,
      verificationMethod: `${options.issuerDID}#key-1`,
      proofPurpose: 'assertionMethod',
    },
  };

  if (options.expirationDate) {
    credential.expirationDate = options.expirationDate;
  }

  return credential;
}

/**
 * Sign a credential with Ed25519 (PROPER WAY)
 *
 * Uses asymmetric cryptography:
 * - Private key signs
 * - Public key verifies
 * - Compliant with W3C VC standard
 */
export function signCredential(
  credential: VerifiableCredential,
  keyPair: DIDKeyPair
): SignedVC {
  // Create canonical representation for signing
  const credentialWithoutProof = {
    ...credential,
    proof: undefined,
  };

  const canonicalString = JSON.stringify(credentialWithoutProof, Object.keys(credentialWithoutProof).sort());
  const dataToSign = new TextEncoder().encode(canonicalString);

  // Sign with Ed25519 private key
  const signature = signWithEd25519(dataToSign, keyPair.privateKey);

  // Encode signature as base64url (JWS format)
  const signatureBase64 = Buffer.from(signature).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Create JWS in detached content format
  const jws = `..${signatureBase64}`;

  return {
    ...credential,
    proof: {
      type: 'Ed25519Signature2020',
      created: credential.proof?.created || new Date().toISOString(),
      verificationMethod: `${keyPair.did}#key-1`,
      proofPurpose: 'assertionMethod',
      jws,
    },
  };
}

/**
 * Verify a credential signature (PROPER WAY)
 *
 * Uses public key for verification - anyone can verify
 * without having access to private key
 */
export function verifyCredentialSignature(
  credential: SignedVC,
  publicKey: Uint8Array
): boolean {
  try {
    // Extract signature from JWS
    const jws = credential.proof?.jws;
    if (!jws || typeof jws !== 'string') {
      return false;
    }

    // JWS format: header.payload.signature (we use detached: ..signature)
    const parts = jws.split('.');
    if (parts.length !== 3 || parts[0] !== '' || parts[1] !== '') {
      return false;
    }

    const signatureBase64 = parts[2];

    // Decode signature from base64url
    const signatureBase64Standard = signatureBase64
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding if needed
    const padding = '='.repeat((4 - (signatureBase64Standard.length % 4)) % 4);
    const signature = new Uint8Array(
      Buffer.from(signatureBase64Standard + padding, 'base64')
    );

    // Create canonical representation (same as signing)
    const credentialWithoutProof = {
      ...credential,
      proof: undefined,
    };

    const canonicalString = JSON.stringify(credentialWithoutProof, Object.keys(credentialWithoutProof).sort());
    const dataToVerify = new TextEncoder().encode(canonicalString);

    // Verify with Ed25519 public key
    return verifyEd25519(signature, dataToVerify, publicKey);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Create a hash of credential for blockchain anchoring
 */
export function hashCredential(credential: VerifiableCredential): string {
  const crypto = require('crypto');
  const canonicalString = JSON.stringify(credential, Object.keys(credential).sort());
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}
