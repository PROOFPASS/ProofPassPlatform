/**
 * Verifiable Credential Verifier
 *
 * Verifies Verifiable Credentials using did-jwt-vc.
 * Supports automatic DID resolution for signature verification.
 * Falls back to native verification for did:key DIDs when external resolvers fail.
 */

import { resolveDID, decodeMultibaseKey, extractEd25519PublicKey } from '../did-resolver';

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
    // First try to use did-jwt-vc for verification
    const { verifyCredential } = await import('did-jwt-vc');
    const { Resolver } = await import('did-resolver');
    const keyDidResolver = await import('key-did-resolver');
    const webDidResolver = await import('web-did-resolver');

    // Create universal DID resolver
    const resolver = new Resolver({
      ...keyDidResolver.getResolver(),
      ...webDidResolver.getResolver(),
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
    // Fall back to native verification for did:key DIDs
    return verifyVCNative(vcJwt, error);
  }
}

/**
 * Native verification using internal DID resolver and Ed25519 verification
 * This works without external ESM modules and is more Jest-friendly
 */
async function verifyVCNative(vcJwt: string, originalError: unknown): Promise<VerificationResult> {
  try {
    // Parse JWT
    const parts = vcJwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf-8'));
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));

    // Basic checks
    if (!payload.iss) {
      throw new Error('Missing issuer');
    }

    if (!payload.vc) {
      throw new Error('Missing VC payload');
    }

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return {
        verified: false,
        issuer: payload.iss,
        subject: payload.sub || payload.vc?.credentialSubject?.id || '',
        credentialSubject: payload.vc?.credentialSubject || {},
        error: 'Credential has expired',
      };
    }

    // For did:key, we can verify the signature natively
    if (payload.iss.startsWith('did:key:') && header.alg === 'EdDSA') {
      const verified = await verifyEdDSASignature(vcJwt, payload.iss);

      if (verified) {
        return {
          verified: true,
          issuer: payload.iss,
          subject: payload.sub || payload.vc?.credentialSubject?.id || '',
          credentialSubject: payload.vc?.credentialSubject || {},
          issuanceDate: payload.nbf ? new Date(payload.nbf * 1000).toISOString() : undefined,
          expirationDate: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
        };
      }
    }

    // Return with original error if native verification fails
    return {
      verified: false,
      issuer: payload.iss,
      subject: payload.sub || payload.vc?.credentialSubject?.id || '',
      credentialSubject: payload.vc?.credentialSubject || {},
      error: originalError instanceof Error ? originalError.message : 'Verification failed',
    };
  } catch (parseError) {
    return {
      verified: false,
      issuer: '',
      subject: '',
      credentialSubject: {},
      error: parseError instanceof Error ? parseError.message : 'Verification failed',
    };
  }
}

/**
 * Verify EdDSA (Ed25519) signature for did:key DIDs
 */
async function verifyEdDSASignature(vcJwt: string, issuerDid: string): Promise<boolean> {
  try {
    const parts = vcJwt.split('.');
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Resolve the DID to get the public key
    const resolution = await resolveDID(issuerDid);
    if (!resolution.didDocument || resolution.didResolutionMetadata.error) {
      return false;
    }

    // Get the public key from the DID document
    const verificationMethod = resolution.didDocument.verificationMethod[0];
    if (!verificationMethod || !verificationMethod.publicKeyMultibase) {
      return false;
    }

    // Decode the multibase public key and extract Ed25519 key
    const multicodecKey = decodeMultibaseKey(verificationMethod.publicKeyMultibase);
    const publicKey = extractEd25519PublicKey(multicodecKey);

    // Get the message (header.payload) and signature
    const message = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(signatureB64, 'base64url');

    // Verify using @noble/curves/ed25519
    const { ed25519 } = await import('@noble/curves/ed25519');
    const messageBytes = new TextEncoder().encode(message);

    return ed25519.verify(signature, messageBytes, publicKey);
  } catch {
    return false;
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
