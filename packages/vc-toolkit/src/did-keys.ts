/**
 * DID Key Management
 *
 * Generates and manages Ed25519 keys for DID methods
 */

import * as crypto from 'crypto';
import { ed25519 } from '@noble/curves/ed25519';

export interface DIDKeyPair {
  did: string;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  publicKeyBase58: string;
  privateKeyBase58: string;
}

/**
 * Generate a new Ed25519 key pair for DID:key method
 */
export function generateDIDKeyPair(): DIDKeyPair {
  // Generate Ed25519 key pair
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);

  // Encode to base58
  const publicKeyBase58 = encodeBase58(publicKey);
  const privateKeyBase58 = encodeBase58(privateKey);

  // Create DID using did:key method
  // Format: did:key:z + multicodec prefix (0xed01 for Ed25519) + base58(publicKey)
  const multicodecPrefix = new Uint8Array([0xed, 0x01]);
  const multicodecKey = new Uint8Array(multicodecPrefix.length + publicKey.length);
  multicodecKey.set(multicodecPrefix);
  multicodecKey.set(publicKey, multicodecPrefix.length);

  const did = `did:key:z${encodeBase58(multicodecKey)}`;

  return {
    did,
    publicKey,
    privateKey,
    publicKeyBase58,
    privateKeyBase58,
  };
}

/**
 * Import a key pair from hex private key
 */
export function importDIDKeyPair(privateKeyHex: string): DIDKeyPair {
  const privateKey = hexToBytes(privateKeyHex);
  const publicKey = ed25519.getPublicKey(privateKey);

  const publicKeyBase58 = encodeBase58(publicKey);
  const privateKeyBase58 = encodeBase58(privateKey);

  const multicodecPrefix = new Uint8Array([0xed, 0x01]);
  const multicodecKey = new Uint8Array(multicodecPrefix.length + publicKey.length);
  multicodecKey.set(multicodecPrefix);
  multicodecKey.set(publicKey, multicodecPrefix.length);

  const did = `did:key:z${encodeBase58(multicodecKey)}`;

  return {
    did,
    publicKey,
    privateKey,
    publicKeyBase58,
    privateKeyBase58,
  };
}

/**
 * Sign data with Ed25519 private key
 */
export function signWithEd25519(data: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return ed25519.sign(data, privateKey);
}

/**
 * Verify Ed25519 signature
 */
export function verifyEd25519(
  signature: Uint8Array,
  data: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return ed25519.verify(signature, data, publicKey);
}

/**
 * Helpers
 */

function encodeBase58(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  if (bytes.length === 0) return '';

  let num = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  let result = '';

  while (num > 0n) {
    const remainder = Number(num % 58n);
    result = ALPHABET[remainder] + result;
    num = num / 58n;
  }

  // Add leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = '1' + result;
  }

  return result;
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of characters');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }

  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
