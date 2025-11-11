/**
 * Ed25519 Cryptographic Operations
 * Production-grade cryptographic signing using Ed25519
 */

import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { base58btc } from 'multiformats/bases/base58';

// Set the sha512 sync function for ed25519
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface SignatureResult {
  signature: Uint8Array;
  signatureBase58: string;
}

/**
 * Generate a new Ed25519 key pair
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const secretKey = ed25519.utils.randomPrivateKey();
  const publicKey = await ed25519.getPublicKeyAsync(secretKey);

  return {
    publicKey,
    secretKey
  };
}

/**
 * Sign data with Ed25519 private key
 */
export async function sign(
  data: Uint8Array,
  secretKey: Uint8Array
): Promise<SignatureResult> {
  const signature = await ed25519.signAsync(data, secretKey);

  // Encode signature as base58btc for W3C compatibility
  const signatureBase58 = base58btc.encode(signature);

  return {
    signature,
    signatureBase58
  };
}

/**
 * Verify Ed25519 signature
 */
export async function verify(
  signature: Uint8Array,
  data: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    return await ed25519.verifyAsync(signature, data, publicKey);
  } catch (error) {
    return false;
  }
}

/**
 * Convert public key to did:key format
 * did:key uses multibase encoding with multicodec prefix
 */
export function publicKeyToDID(publicKey: Uint8Array): string {
  // Multicodec prefix for Ed25519 public key: 0xed01
  const multicodecPrefix = new Uint8Array([0xed, 0x01]);
  const multicodecKey = new Uint8Array(multicodecPrefix.length + publicKey.length);
  multicodecKey.set(multicodecPrefix);
  multicodecKey.set(publicKey, multicodecPrefix.length);

  // Encode with base58btc (starts with 'z')
  const encoded = base58btc.encode(multicodecKey);

  return `did:key:${encoded}`;
}

/**
 * Extract public key from did:key DID
 */
export function didToPublicKey(did: string): Uint8Array | null {
  if (!did.startsWith('did:key:z')) {
    return null;
  }

  try {
    // Remove 'did:key:' prefix
    const encoded = did.slice(8);

    // Decode base58btc
    const multicodecKey = base58btc.decode(encoded);

    // Check multicodec prefix (0xed01 for Ed25519)
    if (multicodecKey[0] !== 0xed || multicodecKey[1] !== 0x01) {
      return null;
    }

    // Extract public key (skip 2-byte prefix)
    return multicodecKey.slice(2);
  } catch (error) {
    return null;
  }
}

/**
 * Convert secret key to hex string for storage
 */
export function secretKeyToHex(secretKey: Uint8Array): string {
  return Buffer.from(secretKey).toString('hex');
}

/**
 * Convert hex string back to secret key
 */
export function hexToSecretKey(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

/**
 * Convert public key to hex string
 */
export function publicKeyToHex(publicKey: Uint8Array): string {
  return Buffer.from(publicKey).toString('hex');
}

/**
 * Convert hex string back to public key
 */
export function hexToPublicKey(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

/**
 * Derive verification method ID from DID
 */
export function deriveVerificationMethodId(did: string): string {
  return `${did}#${did.slice(8, 16)}`;
}

// Backward compatibility alias
export const getVerificationMethod = deriveVerificationMethodId;
