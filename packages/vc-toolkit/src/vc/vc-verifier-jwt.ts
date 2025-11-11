/**
 * Verifiable Credential Verifier
 *
 * Verifies Verifiable Credentials using did-jwt-vc.
 * Supports automatic DID resolution for signature verification.
 */

import { resolveDID } from '../did-resolver';

export interface VerificationResult {
  verified: boolean;
  issuer: string;
  subject: string;
  credentialSubject: any;
  issuanceDate?: string;
  expirationDate?: string;
  error?: string;
}

/**
 * Verify a Verifiable Credential JWT
 *
 * This verifies:
 * 1. The JWT signature is valid
 * 2. The issuer DID is resolvable
 * 3. The signature matches the issuer's public key
 * 4. The credential is not expired
 */
export async function verifyVC(vcJwt: string): Promise<VerificationResult> {
  try {
    // Import did-jwt-vc dynamically
    const { verifyCredential } = await import('did-jwt-vc');
    const { Resolver } = await import('did-resolver');
    const { getResolver: getKeyResolver } = await import('key-did-resolver');
    const { getResolver: getWebResolver } = await import('web-did-resolver');

    // Create universal DID resolver
    const resolver = new Resolver({
      ...getKeyResolver(),
      ...getWebResolver(),
    });

    // Verify the credential
    const verificationResult = await verifyCredential(vcJwt, resolver);

    return {
      verified: true,
      issuer: verificationResult.issuer,
      subject: verificationResult.verifiableCredential.credentialSubject.id || '',
      credentialSubject: verificationResult.verifiableCredential.credentialSubject,
      issuanceDate: verificationResult.verifiableCredential.issuanceDate,
      expirationDate: verificationResult.verifiableCredential.expirationDate,
    };
  } catch (error) {
    // Fallback verification
    console.warn('did-jwt-vc not available, using fallback verification');
    return verifyVCFallback(vcJwt);
  }
}

/**
 * Fallback verification (temporary, until libraries are installed)
 */
async function verifyVCFallback(vcJwt: string): Promise<VerificationResult> {
  try {
    // Parse JWT
    const parts = vcJwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));

    // Basic checks
    if (!payload.iss) {
      throw new Error('Missing issuer');
    }

    if (!payload.vc) {
      throw new Error('Missing VC payload');
    }

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Credential has expired');
    }

    // Try to resolve issuer DID
    const issuerDIDResult = await resolveDID(payload.iss);
    if (!issuerDIDResult.didDocument) {
      throw new Error(`Cannot resolve issuer DID: ${payload.iss}`);
    }

    return {
      verified: false, // Mark as unverified since we're using fallback
      issuer: payload.iss,
      subject: payload.sub || payload.vc.credentialSubject.id,
      credentialSubject: payload.vc.credentialSubject,
      error: 'Using fallback verification (did-jwt-vc not installed)',
    };
  } catch (error) {
    return {
      verified: false,
      issuer: '',
      subject: '',
      credentialSubject: null,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Verify multiple VCs in parallel
 */
export async function verifyVCs(vcJwts: string[]): Promise<VerificationResult[]> {
  return Promise.all(vcJwts.map((vcJwt) => verifyVC(vcJwt)));
}

/**
 * Check if VC is expired
 */
export function isExpired(vc: { expirationDate?: string }): boolean {
  if (!vc.expirationDate) {
    return false;
  }

  return new Date(vc.expirationDate) < new Date();
}

/**
 * Extract claims from verified VC
 */
export function extractClaims(verificationResult: VerificationResult): Record<string, any> {
  if (!verificationResult.verified) {
    throw new Error('Cannot extract claims from unverified credential');
  }

  return verificationResult.credentialSubject;
}
