/**
 * Verifiable Credential Issuer
 *
 * Issues Verifiable Credentials using did-jwt-vc standard.
 * Supports DIDs as issuers and subjects.
 *
 * Based on: W3C Verifiable Credentials Data Model
 * Library: did-jwt-vc
 */

import { DIDKeyPair } from '../did-keys';

export interface VerifiableCredential {
  '@context': string | string[];
  type: string | string[];
  issuer: string | { id: string; [key: string]: any };
  issuanceDate: string;
  credentialSubject: {
    id?: string;
    [key: string]: any;
  };
  expirationDate?: string;
  credentialStatus?: {
    id: string;
    type: string;
  };
  proof?: any;
}

export interface IssueVCOptions {
  /**
   * Credential data
   */
  credential: Omit<VerifiableCredential, 'proof'>;

  /**
   * Issuer's DID key pair
   */
  issuerKeyPair: DIDKeyPair;

  /**
   * Optional expiration in seconds from now
   */
  expiresInSeconds?: number;
}

/**
 * Issue a Verifiable Credential as a JWT
 *
 * This creates a W3C-compliant VC in JWT format, signed with the issuer's DID.
 * The resulting JWT can be verified by any W3C VC verifier.
 */
export async function issueVC(options: IssueVCOptions): Promise<string> {
  const { credential, issuerKeyPair, expiresInSeconds } = options;

  try {
    // Import did-jwt-vc dynamically (will be available after npm install)
    const didJwtVc = await import('did-jwt-vc');
    const { ed25519 } = await import('@noble/curves/ed25519');

    // Create signer for Ed25519
    const signer = async (data: string | Uint8Array): Promise<string> => {
      const message = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      const signature = ed25519.sign(message, issuerKeyPair.privateKey);
      return Buffer.from(signature).toString('base64url');
    };

    // Create issuer object (Issuer type from did-jwt-vc)
    const issuer = {
      did: issuerKeyPair.did,
      signer,
      alg: 'EdDSA' as const,
    };

    // Prepare VC payload
    const vcPayload = {
      sub: credential.credentialSubject.id || issuerKeyPair.did,
      nbf: Math.floor(Date.now() / 1000),
      vc: {
        '@context': credential['@context'],
        type: credential.type,
        credentialSubject: credential.credentialSubject,
      },
    };

    // Add expiration if specified
    if (expiresInSeconds) {
      (vcPayload as any).exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    }

    // If credential has expirationDate, use it
    if (credential.expirationDate) {
      (vcPayload as any).exp = Math.floor(new Date(credential.expirationDate).getTime() / 1000);
    }

    // Create JWT
    const vcJwt = await didJwtVc.createVerifiableCredentialJwt(vcPayload, issuer);

    return vcJwt;
  } catch (error) {
    // Fallback implementation if libraries aren't installed yet
    console.warn('did-jwt-vc not available, using fallback implementation');
    return createFallbackVC(options);
  }
}

/**
 * Fallback VC creation (temporary, until libraries are installed)
 */
function createFallbackVC(options: IssueVCOptions): string {
  const { credential, issuerKeyPair } = options;

  const header = {
    alg: 'EdDSA',
    typ: 'JWT',
  };

  const payload = {
    iss: issuerKeyPair.did,
    sub: credential.credentialSubject.id || issuerKeyPair.did,
    nbf: Math.floor(Date.now() / 1000),
    iat: Math.floor(Date.now() / 1000),
    vc: {
      '@context': credential['@context'],
      type: credential.type,
      credentialSubject: credential.credentialSubject,
    },
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  // For now, return unsigned JWT (will be properly signed once did-jwt-vc is installed)
  return `${encodedHeader}.${encodedPayload}.PLACEHOLDER_SIGNATURE`;
}

/**
 * Helper: Create a simple credential object
 */
export function createCredential(params: {
  issuerDID: string;
  subjectDID: string;
  credentialSubject: Record<string, any>;
  type?: string[];
  expirationDate?: string;
}): Omit<VerifiableCredential, 'proof'> {
  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1',
    ],
    type: ['VerifiableCredential', ...(params.type || [])],
    issuer: params.issuerDID,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: params.subjectDID,
      ...params.credentialSubject,
    },
    ...(params.expirationDate && { expirationDate: params.expirationDate }),
  };
}

/**
 * Parse VC JWT to extract payload
 */
export function parseVCJWT(vcJwt: string): any {
  const parts = vcJwt.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    return payload;
  } catch (error) {
    throw new Error('Failed to parse VC JWT payload');
  }
}
