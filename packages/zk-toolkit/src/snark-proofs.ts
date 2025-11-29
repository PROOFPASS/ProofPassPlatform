/**
 * Real Zero-Knowledge Proofs using zk-SNARKs (Groth16)
 *
 * This module implements production-grade zero-knowledge proofs using:
 * - circom circuits
 * - snarkjs (Groth16 proof system)
 * - Poseidon hashing for efficiency
 *
 * SECURITY: These are actual zero-knowledge proofs, not simplified versions.
 */

import * as snarkjs from 'snarkjs';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import type {
  ThresholdProofInputs,
  RangeProofInputs,
  SetMembershipProofInputs,
} from '@proofpass/types';

export interface SNARKProofResult {
  proof: string; // JSON stringified proof
  publicSignals: string[]; // Public outputs from the circuit
  nullifierHash: string; // Unique identifier for the proof
}

export interface SNARKVerificationResult {
  verified: boolean;
  error?: string;
}

/**
 * Get the path to circuit artifacts
 */
function getCircuitPath(circuitName: string, fileType: string): string {
  const basePath = path.join(__dirname, '..');

  switch (fileType) {
    case 'wasm':
      return path.join(basePath, 'build', `${circuitName}_js`, `${circuitName}.wasm`);
    case 'zkey':
      return path.join(basePath, 'keys', `${circuitName}_final.zkey`);
    case 'vkey':
      return path.join(basePath, 'keys', `${circuitName}_verification_key.json`);
    default:
      throw new Error(`Unknown file type: ${fileType}`);
  }
}

/**
 * Generate a random nullifier (32 bytes)
 */
function generateNullifier(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Convert hex string to field element (for circuit inputs)
 */
function hexToFieldElement(hex: string): string {
  return BigInt('0x' + hex).toString();
}

/**
 * Generate a threshold proof using real zk-SNARKs
 * Proves that: value >= threshold
 */
export async function generateThresholdProof(
  inputs: ThresholdProofInputs
): Promise<SNARKProofResult> {
  const { value, threshold } = inputs;

  // Validate inputs
  if (value < threshold) {
    throw new Error('Invalid proof: value does not meet threshold');
  }

  // Generate random nullifier for uniqueness
  const nullifier = generateNullifier();

  // Prepare circuit inputs
  const circuitInputs = {
    value: value.toString(),
    threshold: threshold.toString(),
    nullifier: hexToFieldElement(nullifier),
  };

  try {
    // Get paths to circuit artifacts
    const wasmPath = getCircuitPath('threshold', 'wasm');
    const zkeyPath = getCircuitPath('threshold', 'zkey');

    // Generate witness and proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      wasmPath,
      zkeyPath
    );

    // Extract nullifierHash from public signals
    const nullifierHash = publicSignals[0]; // First public output

    return {
      proof: JSON.stringify(proof),
      publicSignals,
      nullifierHash,
    };
  } catch (error) {
    throw new Error(`Failed to generate threshold proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify a threshold proof
 */
export async function verifyThresholdProof(
  proof: string,
  publicSignals: string[]
): Promise<SNARKVerificationResult> {
  try {
    const vkeyPath = getCircuitPath('threshold', 'vkey');
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

    const proofObj = JSON.parse(proof);
    const verified = await snarkjs.groth16.verify(vkey, publicSignals, proofObj);

    return { verified };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate a range proof using real zk-SNARKs
 * Proves that: minValue <= value <= maxValue
 */
export async function generateRangeProof(
  inputs: RangeProofInputs
): Promise<SNARKProofResult> {
  const { value, min, max } = inputs;

  // Validate inputs
  if (value < min || value > max) {
    throw new Error('Invalid proof: value not in range');
  }

  // Generate random nullifier
  const nullifier = generateNullifier();

  // Prepare circuit inputs
  const circuitInputs = {
    value: value.toString(),
    minValue: min.toString(),
    maxValue: max.toString(),
    nullifier: hexToFieldElement(nullifier),
  };

  try {
    const wasmPath = getCircuitPath('range', 'wasm');
    const zkeyPath = getCircuitPath('range', 'zkey');

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      wasmPath,
      zkeyPath
    );

    const nullifierHash = publicSignals[0];

    return {
      proof: JSON.stringify(proof),
      publicSignals,
      nullifierHash,
    };
  } catch (error) {
    throw new Error(`Failed to generate range proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify a range proof
 */
export async function verifyRangeProof(
  proof: string,
  publicSignals: string[]
): Promise<SNARKVerificationResult> {
  try {
    const vkeyPath = getCircuitPath('range', 'vkey');
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

    const proofObj = JSON.parse(proof);
    const verified = await snarkjs.groth16.verify(vkey, publicSignals, proofObj);

    return { verified };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert a value to a field element for use in circuits
 * Uses SHA-256 hash truncated to fit within the bn128 field
 * Handles various input types (string, number, object)
 */
function valueToFieldElement(val: unknown): string {
  if (typeof val === 'number' || typeof val === 'bigint') {
    return val.toString();
  }
  // For other types, hash the JSON string to get a field element
  const str = typeof val === 'string' ? val : JSON.stringify(val);
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  // Take first 31 bytes (62 hex chars) to stay within bn128 field size
  return BigInt('0x' + hash.slice(0, 62)).toString();
}

/**
 * Generate a set membership proof using real zk-SNARKs
 * Proves that: value is in the set (using pre-hashed comparison)
 */
export async function generateSetMembershipProof(
  inputs: SetMembershipProofInputs
): Promise<SNARKProofResult> {
  const { value, set } = inputs;

  // Validate inputs
  const valueInSet = set.some((item: unknown) => JSON.stringify(item) === JSON.stringify(value));
  if (!valueInSet) {
    throw new Error('Invalid proof: value not in set');
  }

  // Convert value to field element (hash)
  const valueHash = valueToFieldElement(value);

  // Hash each set element using the same method
  const setHashes = set.map((item: unknown) => valueToFieldElement(item));

  // Pad set to max size (10)
  const maxSetSize = 10;
  while (setHashes.length < maxSetSize) {
    setHashes.push('0');
  }

  // Generate random nullifier
  const nullifier = generateNullifier();

  // Prepare circuit inputs
  // Circuit v2 expects pre-hashed valueHash
  const circuitInputs = {
    valueHash,
    setHashes,
    nullifier: hexToFieldElement(nullifier),
  };

  try {
    const wasmPath = getCircuitPath('set-membership', 'wasm');
    const zkeyPath = getCircuitPath('set-membership', 'zkey');

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      wasmPath,
      zkeyPath
    );

    const nullifierHash = publicSignals[0];

    return {
      proof: JSON.stringify(proof),
      publicSignals,
      nullifierHash,
    };
  } catch (error) {
    throw new Error(`Failed to generate set membership proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify a set membership proof
 */
export async function verifySetMembershipProof(
  proof: string,
  publicSignals: string[]
): Promise<SNARKVerificationResult> {
  try {
    const vkeyPath = getCircuitPath('set-membership', 'vkey');
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

    const proofObj = JSON.parse(proof);
    const verified = await snarkjs.groth16.verify(vkey, publicSignals, proofObj);

    return { verified };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export all proof functions for backward compatibility
 */
export const SNARKProofs = {
  generateThresholdProof,
  verifyThresholdProof,
  generateRangeProof,
  verifyRangeProof,
  generateSetMembershipProof,
  verifySetMembershipProof,
};
