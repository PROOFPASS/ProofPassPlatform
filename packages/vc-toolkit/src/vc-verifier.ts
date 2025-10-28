import type { VerifiableCredential } from '@proofpass/types';
import { hashCredential } from './vc-generator';

export interface VerificationResult {
  verified: boolean;
  errors: string[];
}

/**
 * Verify a verifiable credential
 */
export function verifyCredential(
  credential: VerifiableCredential,
  privateKey?: string
): VerificationResult {
  const errors: string[] = [];

  // Check required fields
  if (!credential['@context']) {
    errors.push('Missing @context');
  }

  if (!credential.id) {
    errors.push('Missing id');
  }

  if (!credential.type || !credential.type.includes('VerifiableCredential')) {
    errors.push('Invalid or missing type');
  }

  if (!credential.issuer) {
    errors.push('Missing issuer');
  }

  if (!credential.issuanceDate) {
    errors.push('Missing issuanceDate');
  }

  if (!credential.credentialSubject) {
    errors.push('Missing credentialSubject');
  }

  if (!credential.proof) {
    errors.push('Missing proof');
  }

  // Check expiration
  if (credential.expirationDate) {
    const expiration = new Date(credential.expirationDate);
    if (expiration < new Date()) {
      errors.push('Credential has expired');
    }
  }

  // Verify signature if private key provided
  if (privateKey && credential.proof?.jws) {
    const credentialString = JSON.stringify({
      ...credential,
      proof: undefined,
    });

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', privateKey)
      .update(credentialString)
      .digest('hex');

    if (expectedSignature !== credential.proof.jws) {
      errors.push('Invalid signature');
    }
  }

  return {
    verified: errors.length === 0,
    errors,
  };
}

/**
 * Verify credential hash matches blockchain anchored hash
 */
export function verifyCredentialHash(
  credential: VerifiableCredential,
  anchoredHash: string
): boolean {
  const credentialHash = hashCredential(credential);
  return credentialHash === anchoredHash;
}
