/**
 * W3C Status List 2021 Implementation
 * https://w3c-ccg.github.io/vc-status-list-2021/
 *
 * Provides efficient revocation checking for Verifiable Credentials
 */

import { gzipSync, gunzipSync } from 'zlib';

export interface StatusListCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    type: string;
    statusPurpose: 'revocation' | 'suspension';
    encodedList: string;
  };
}

export interface CredentialStatus {
  id: string;
  type: 'StatusList2021Entry';
  statusPurpose: 'revocation' | 'suspension';
  statusListIndex: string;
  statusListCredential: string;
}

/**
 * Create a new Status List (bit array) with specified size
 * @param size Number of credentials to track (default: 131072 = 16KB compressed)
 */
export function createStatusList(size: number = 131072): Uint8Array {
  // Each bit represents one credential
  const byteLength = Math.ceil(size / 8);
  return new Uint8Array(byteLength);
}

/**
 * Set status of a credential in the status list
 * @param statusList The status list bit array
 * @param index Index of the credential (0-based)
 * @param value Status value (true = revoked/suspended, false = active)
 */
export function setStatus(
  statusList: Uint8Array,
  index: number,
  value: boolean
): Uint8Array {
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;

  if (byteIndex >= statusList.length) {
    throw new Error(`Index ${index} out of bounds for status list of length ${statusList.length * 8}`);
  }

  const updatedList = new Uint8Array(statusList);

  if (value) {
    // Set bit to 1 (revoked/suspended)
    updatedList[byteIndex] |= (1 << bitIndex);
  } else {
    // Set bit to 0 (active)
    updatedList[byteIndex] &= ~(1 << bitIndex);
  }

  return updatedList;
}

/**
 * Get status of a credential from the status list
 * @param statusList The status list bit array
 * @param index Index of the credential (0-based)
 * @returns true if revoked/suspended, false if active
 */
export function getStatus(statusList: Uint8Array, index: number): boolean {
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;

  if (byteIndex >= statusList.length) {
    throw new Error(`Index ${index} out of bounds for status list of length ${statusList.length * 8}`);
  }

  return (statusList[byteIndex] & (1 << bitIndex)) !== 0;
}

/**
 * Compress and encode status list for storage/transmission
 * Uses GZIP compression + Base64 encoding
 */
export function encodeStatusList(statusList: Uint8Array): string {
  const compressed = gzipSync(statusList);
  return Buffer.from(compressed).toString('base64');
}

/**
 * Decode and decompress status list
 */
export function decodeStatusList(encodedList: string): Uint8Array {
  const compressed = Buffer.from(encodedList, 'base64');
  return gunzipSync(compressed);
}

/**
 * Create a Status List 2021 Credential
 */
export function createStatusListCredential(
  id: string,
  issuer: string,
  statusList: Uint8Array,
  statusPurpose: 'revocation' | 'suspension' = 'revocation'
): StatusListCredential {
  const encodedList = encodeStatusList(statusList);

  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/vc/status-list/2021/v1'
    ],
    id,
    type: ['VerifiableCredential', 'StatusList2021Credential'],
    issuer,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `${id}#list`,
      type: 'StatusList2021',
      statusPurpose,
      encodedList
    }
  };
}

/**
 * Check if a credential is revoked/suspended
 * @param statusListCredential The status list credential
 * @param index The index of the credential to check
 * @returns true if revoked/suspended, false if active
 */
export function checkCredentialStatus(
  statusListCredential: StatusListCredential,
  index: number
): boolean {
  const encodedList = statusListCredential.credentialSubject.encodedList;
  const statusList = decodeStatusList(encodedList);
  return getStatus(statusList, index);
}

/**
 * Create a credentialStatus object to embed in a VC
 * @param statusListCredentialUrl URL where the status list credential is hosted
 * @param index Index in the status list for this credential
 * @param purpose revocation or suspension
 */
export function createCredentialStatus(
  statusListCredentialUrl: string,
  index: number,
  purpose: 'revocation' | 'suspension' = 'revocation'
): CredentialStatus {
  return {
    id: `${statusListCredentialUrl}#${index}`,
    type: 'StatusList2021Entry',
    statusPurpose: purpose,
    statusListIndex: index.toString(),
    statusListCredential: statusListCredentialUrl
  };
}

/**
 * Revoke a credential by updating the status list
 */
export function revokeCredential(
  statusList: Uint8Array,
  index: number
): Uint8Array {
  return setStatus(statusList, index, true);
}

/**
 * Un-revoke (restore) a credential
 */
export function unrevokeCredential(
  statusList: Uint8Array,
  index: number
): Uint8Array {
  return setStatus(statusList, index, false);
}

/**
 * Get statistics about a status list
 */
export function getStatusListStats(statusList: Uint8Array): {
  totalSlots: number;
  revokedCount: number;
  activeCount: number;
  utilizationPercent: number;
} {
  const totalSlots = statusList.length * 8;
  let revokedCount = 0;

  for (let i = 0; i < totalSlots; i++) {
    if (getStatus(statusList, i)) {
      revokedCount++;
    }
  }

  return {
    totalSlots,
    revokedCount,
    activeCount: totalSlots - revokedCount,
    utilizationPercent: (revokedCount / totalSlots) * 100
  };
}
