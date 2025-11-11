import { v4 as uuidv4 } from 'uuid';
import type { VerifiableCredential, CredentialSubject } from '@proofpass/types';

export interface CreateVCOptions {
  issuerDID: string;
  subject: CredentialSubject;
  type: string[];
  expirationDate?: string;
}

/**
 * Create a W3C Verifiable Credential
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
      type: 'JsonWebSignature2020',
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
 * Sign a credential (simplified - in production use proper cryptographic signing)
 */
export function signCredential(
  credential: VerifiableCredential,
  privateKey: string
): VerifiableCredential {
  // In production, use proper JWS signing with did-jwt or similar
  // For now, we'll create a simplified proof
  const credentialString = JSON.stringify({
    ...credential,
    proof: undefined,
  });

  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', privateKey)
    .update(credentialString)
    .digest('hex');

  return {
    ...credential,
    proof: {
      ...credential.proof,
      jws: signature,
    },
  };
}

/**
 * Create a hash of credential for blockchain anchoring
 */
export function hashCredential(credential: VerifiableCredential): string {
  const crypto = require('crypto');
  const credentialString = JSON.stringify(credential);
  return crypto.createHash('sha256').update(credentialString).digest('hex');
}
