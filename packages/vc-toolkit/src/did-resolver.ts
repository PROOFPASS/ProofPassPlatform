/**
 * DID Resolver
 *
 * Resolves DIDs to DID Documents containing public keys for verification
 * Supports: did:key, did:web (future: did:ethr, did:ion)
 */

export interface DIDDocument {
  '@context': string | string[];
  id: string;
  verificationMethod: VerificationMethod[];
  authentication?: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyBase58?: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: Record<string, any>;
}

export interface DIDResolutionResult {
  didDocument: DIDDocument | null;
  didResolutionMetadata: {
    error?: string;
    contentType?: string;
  };
  didDocumentMetadata: Record<string, any>;
}

/**
 * Resolve a DID to its DID Document
 */
export async function resolveDID(did: string): Promise<DIDResolutionResult> {
  try {
    // Parse DID
    const [method, ...rest] = did.replace('did:', '').split(':');

    switch (method) {
      case 'key':
        return resolveDidKey(did);
      case 'web':
        return resolveDidWeb(did, rest.join(':'));
      default:
        return {
          didDocument: null,
          didResolutionMetadata: {
            error: `Unsupported DID method: ${method}`,
          },
          didDocumentMetadata: {},
        };
    }
  } catch (error) {
    return {
      didDocument: null,
      didResolutionMetadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      didDocumentMetadata: {},
    };
  }
}

/**
 * Resolve did:key method
 *
 * did:key is self-contained - the public key is in the identifier itself
 * Format: did:key:z{multibase-encoded-multicodec-key}
 */
function resolveDidKey(did: string): DIDResolutionResult {
  try {
    // Extract the key part (after did:key:)
    const keyPart = did.replace('did:key:', '');

    if (!keyPart.startsWith('z')) {
      throw new Error('did:key must use multibase encoding (starting with z)');
    }

    // Decode multibase (base58btc, starts with 'z')
    const publicKeyMultibase = keyPart;

    // Create DID Document
    const didDocument: DIDDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ],
      id: did,
      verificationMethod: [
        {
          id: `${did}#${keyPart}`,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyMultibase,
        },
      ],
      authentication: [`${did}#${keyPart}`],
      assertionMethod: [`${did}#${keyPart}`],
      keyAgreement: [`${did}#${keyPart}`],
    };

    return {
      didDocument,
      didResolutionMetadata: {
        contentType: 'application/did+ld+json',
      },
      didDocumentMetadata: {},
    };
  } catch (error) {
    return {
      didDocument: null,
      didResolutionMetadata: {
        error: error instanceof Error ? error.message : 'Failed to resolve did:key',
      },
      didDocumentMetadata: {},
    };
  }
}

/**
 * Resolve did:web method
 *
 * did:web resolves to a well-known URL on a web server
 * Format: did:web:example.com -> https://example.com/.well-known/did.json
 * Format: did:web:example.com:user:alice -> https://example.com/user/alice/did.json
 */
async function resolveDidWeb(did: string, identifier: string): Promise<DIDResolutionResult> {
  try {
    // Parse domain and path from identifier
    const parts = identifier.split(':');
    const domain = parts[0];
    const path = parts.slice(1);

    // Construct URL
    let url: string;
    if (path.length === 0) {
      // Root level: https://example.com/.well-known/did.json
      url = `https://${domain}/.well-known/did.json`;
    } else {
      // Path level: https://example.com/path/to/did.json
      url = `https://${domain}/${path.join('/')}/did.json`;
    }

    // Fetch DID Document
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const didDocument = await response.json() as DIDDocument;

    // Validate DID Document
    if (!didDocument.id || didDocument.id !== did) {
      throw new Error('DID Document id does not match requested DID');
    }

    return {
      didDocument: didDocument as DIDDocument,
      didResolutionMetadata: {
        contentType: 'application/did+ld+json',
      },
      didDocumentMetadata: {},
    };
  } catch (error) {
    return {
      didDocument: null,
      didResolutionMetadata: {
        error: error instanceof Error ? error.message : 'Failed to resolve did:web',
      },
      didDocumentMetadata: {},
    };
  }
}

/**
 * Get public key from DID Document for verification
 */
export function findVerificationMethod(
  didDocument: DIDDocument,
  verificationMethodId: string
): VerificationMethod | null {
  return (
    didDocument.verificationMethod.find((vm) => vm.id === verificationMethodId) || null
  );
}

/**
 * Decode multibase public key to bytes
 */
export function decodeMultibaseKey(publicKeyMultibase: string): Uint8Array {
  if (!publicKeyMultibase.startsWith('z')) {
    throw new Error('Only base58btc multibase encoding (z) is supported');
  }

  // Remove 'z' prefix and decode base58
  const base58Key = publicKeyMultibase.slice(1);
  return decodeBase58(base58Key);
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

/**
 * Extract Ed25519 public key from multicodec key
 */
export function extractEd25519PublicKey(multicodecKey: Uint8Array): Uint8Array {
  // Ed25519 public key multicodec prefix is [0xed, 0x01]
  if (multicodecKey.length < 2) {
    throw new Error('Invalid multicodec key: too short');
  }

  if (multicodecKey[0] !== 0xed || multicodecKey[1] !== 0x01) {
    throw new Error('Not an Ed25519 key (expected prefix 0xed01)');
  }

  // Extract the 32-byte public key
  return multicodecKey.slice(2, 34);
}
