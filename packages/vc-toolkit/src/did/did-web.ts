/**
 * DID:web Method Implementation
 *
 * Implements the did:web method for domain-based DIDs.
 * Resolves DIDs by fetching DID Documents from HTTPS endpoints.
 *
 * Spec: https://w3c-ccg.github.io/did-method-web/
 */

import { DIDDocument } from '../did-resolver';
import { generateDIDKeyPair, DIDKeyPair } from '../did-keys';

export interface DIDWebOptions {
  /**
   * Domain name (e.g., 'proofpass.com')
   */
  domain: string;

  /**
   * Optional path segments (e.g., ['organizations', 'org-123'])
   */
  path?: string[];

  /**
   * Optional: provide existing key pair
   */
  keyPair?: DIDKeyPair;
}

/**
 * Create a did:web identifier and DID Document
 */
export async function createDIDWeb(options: DIDWebOptions): Promise<{
  did: string;
  didDocument: DIDDocument;
  keyPair: DIDKeyPair;
}> {
  // Generate or use provided key pair
  const keyPair = options.keyPair || generateDIDKeyPair();

  // Construct did:web identifier
  const did = buildDIDWeb(options.domain, options.path);

  // Create DID Document
  const didDocument = createDIDDocument(did, keyPair);

  return {
    did,
    didDocument,
    keyPair,
  };
}

/**
 * Build did:web identifier from domain and path
 */
export function buildDIDWeb(domain: string, path?: string[]): string {
  if (path && path.length > 0) {
    return `did:web:${domain}:${path.join(':')}`;
  }
  return `did:web:${domain}`;
}

/**
 * Convert did:web to HTTPS URL for DID Document resolution
 */
export function didWebToUrl(did: string): string {
  if (!did.startsWith('did:web:')) {
    throw new Error('Not a did:web identifier');
  }

  // Remove 'did:web:' prefix
  const identifier = did.substring(8);
  const parts = identifier.split(':');

  const domain = parts[0];
  const path = parts.slice(1);

  if (path.length === 0) {
    // Root level: https://example.com/.well-known/did.json
    return `https://${domain}/.well-known/did.json`;
  } else {
    // Path level: https://example.com/path/to/did.json
    return `https://${domain}/${path.join('/')}/did.json`;
  }
}

/**
 * Create a W3C-compliant DID Document for did:web
 */
export function createDIDDocument(did: string, keyPair: DIDKeyPair): DIDDocument {
  const keyId = `${did}#key-1`;

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyBase58: keyPair.publicKeyBase58,
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
    keyAgreement: [keyId],
  };
}

/**
 * Resolve did:web by fetching the DID Document from HTTPS
 */
export async function resolveDIDWeb(did: string): Promise<DIDDocument> {
  const url = didWebToUrl(did);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/did+ld+json,application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const didDocument = (await response.json()) as DIDDocument;

    // Validate DID Document
    if (!didDocument.id || didDocument.id !== did) {
      throw new Error('DID Document id does not match requested DID');
    }

    if (!didDocument.verificationMethod || didDocument.verificationMethod.length === 0) {
      throw new Error('DID Document has no verification methods');
    }

    return didDocument;
  } catch (error) {
    throw new Error(
      `Failed to resolve did:web ${did}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate DID Document JSON for hosting
 */
export function serializeDIDDocument(didDocument: DIDDocument): string {
  return JSON.stringify(didDocument, null, 2);
}

/**
 * Validate DID Document structure
 */
export function validateDIDDocument(didDocument: any): didDocument is DIDDocument {
  return (
    didDocument &&
    typeof didDocument === 'object' &&
    typeof didDocument.id === 'string' &&
    Array.isArray(didDocument.verificationMethod) &&
    didDocument.verificationMethod.length > 0
  );
}
