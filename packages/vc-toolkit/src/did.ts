import { randomBytes } from 'crypto';
import * as didJWT from 'did-jwt';

/**
 * Generate a simple did:key identifier
 * In production, you might want to use more sophisticated DID methods
 */
export function generateDID(): { did: string; privateKey: string } {
  const privateKey = randomBytes(32).toString('hex');

  // Create a simple did:key
  const did = `did:key:z${randomBytes(16).toString('hex')}`;

  return { did, privateKey };
}

/**
 * Create a DID from a public key
 */
export function createDIDFromPublicKey(publicKey: string): string {
  return `did:key:${publicKey}`;
}

/**
 * Sign data with DID
 */
export async function signWithDID(
  data: any,
  privateKey: string,
  did: string
): Promise<string> {
  const signer = didJWT.ES256KSigner(didJWT.hexToBytes(privateKey));

  const jwt = await didJWT.createJWT(
    { ...data },
    { issuer: did, signer },
    { alg: 'ES256K' }
  );

  return jwt;
}

/**
 * Verify DID signature
 */
export async function verifyDIDSignature(jwt: string): Promise<any> {
  const verified = await didJWT.verifyJWT(jwt);
  return verified;
}
