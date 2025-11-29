/**
 * DID:key Method Implementation
 *
 * Implements the did:key method using Ed25519 keys.
 * This is a self-contained DID method that doesn't require external resolution.
 *
 * Spec: https://w3c-ccg.github.io/did-method-key/
 */

import { ed25519 } from '@noble/curves/ed25519';
import { DIDKeyPair } from '../did-keys';
import { generateDIDKeyPair, importDIDKeyPair } from '../did-keys';

export interface DIDKeyOptions {
  /**
   * Optional: provide existing private key in hex format
   */
  privateKeyHex?: string;
}

/**
 * Generate a new did:key identifier with Ed25519 key pair
 */
export async function generateDIDKey(options?: DIDKeyOptions): Promise<DIDKeyPair> {
  if (options?.privateKeyHex) {
    return importDIDKeyPair(options.privateKeyHex);
  }

  return generateDIDKeyPair();
}

/**
 * Create ES256K-JWT Signer for did-jwt-vc compatibility
 * Ed25519 signer for JWT creation
 */
export function createEd25519Signer(privateKey: Uint8Array) {
  return async (data: string | Uint8Array): Promise<string> => {
    const message = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const signature = ed25519.sign(message, privateKey);
    return Buffer.from(signature).toString('base64url');
  };
}

/**
 * Convert DIDKeyPair to format compatible with did-jwt
 */
export function didKeyPairToJWT(keyPair: DIDKeyPair) {
  return {
    did: keyPair.did,
    signer: createEd25519Signer(keyPair.privateKey),
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Parse did:key to extract public key
 */
export function parseDIDKey(did: string): Uint8Array {
  if (!did.startsWith('did:key:z')) {
    throw new Error('Invalid did:key format');
  }

  // Extract the multibase-encoded key (after 'did:key:z')
  // The 'z' prefix indicates base58btc encoding, so we skip it
  const keyPart = did.substring(9); // Skip 'did:key:z'

  // Decode base58
  const decoded = decodeBase58(keyPart);

  // Remove multicodec prefix (0xed01 for Ed25519)
  if (decoded.length < 2 || decoded[0] !== 0xed || decoded[1] !== 0x01) {
    throw new Error('Not an Ed25519 did:key');
  }

  // Return the 32-byte public key
  return decoded.slice(2, 34);
}

/**
 * Base58 decoder
 */
function decodeBase58(str: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const ALPHABET_MAP = new Map<string, number>();
  for (let i = 0; i < ALPHABET.length; i++) {
    ALPHABET_MAP.set(ALPHABET[i], i);
  }

  let num = 0n;
  for (const char of str) {
    const value = ALPHABET_MAP.get(char);
    if (value === undefined) {
      throw new Error(`Invalid base58 character: ${char}`);
    }
    num = num * 58n + BigInt(value);
  }

  // Convert to bytes
  const hex = num.toString(16);
  const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex;

  const bytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(paddedHex.substr(i * 2, 2), 16);
  }

  // Handle leading zeros
  let leadingZeros = 0;
  for (const char of str) {
    if (char !== '1') break;
    leadingZeros++;
  }

  if (leadingZeros > 0) {
    const result = new Uint8Array(leadingZeros + bytes.length);
    result.set(bytes, leadingZeros);
    return result;
  }

  return bytes;
}
