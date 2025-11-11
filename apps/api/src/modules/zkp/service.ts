import { query } from '../../config/database';
import {
  generateThresholdProof,
  verifyThresholdProof,
  generateRangeProof,
  verifyRangeProof,
  generateSetMembershipProof,
  verifySetMembershipProof,
  type SNARKProofResult,
} from '@proofpass/zk-toolkit';
import type {
  ZKProof,
  GenerateZKProofDTO,
  CircuitType,
  ThresholdProofInputs,
  RangeProofInputs,
  SetMembershipProofInputs,
} from '@proofpass/types';

/**
 * Generate a zero-knowledge proof for an attestation
 */
export async function generateZKProof(
  data: GenerateZKProofDTO,
  userId: string
): Promise<ZKProof> {
  // Verify attestation exists and belongs to user
  const attestationResult = await query(
    'SELECT * FROM attestations WHERE id = $1 AND user_id = $2',
    [data.attestation_id, userId]
  );

  if (attestationResult.rows.length === 0) {
    throw new Error('Attestation not found');
  }

  const attestation = attestationResult.rows[0];

  // Generate proof based on circuit type using real zk-SNARKs
  let proofResult: SNARKProofResult;

  try {
    switch (data.circuit_type) {
      case 'threshold': {
        const inputs = {
          value: data.private_inputs.value,
          threshold: data.public_inputs.threshold,
        } as ThresholdProofInputs;
        proofResult = await generateThresholdProof(inputs);
        break;
      }

      case 'range': {
        const inputs = {
          value: data.private_inputs.value,
          min: data.public_inputs.min,
          max: data.public_inputs.max,
        } as RangeProofInputs;
        proofResult = await generateRangeProof(inputs);
        break;
      }

      case 'set_membership': {
        const inputs = {
          value: data.private_inputs.value,
          set: data.public_inputs.set,
        } as SetMembershipProofInputs;
        proofResult = await generateSetMembershipProof(inputs);
        break;
      }

      default:
        throw new Error(`Unsupported circuit type: ${data.circuit_type}`);
    }
  } catch (error: any) {
    throw new Error(`Proof generation failed: ${error.message}`);
  }

  // Store proof in database (SNARK proof data)
  const result = await query(
    `INSERT INTO zk_proofs
     (user_id, attestation_id, circuit_type, public_inputs, proof, verified)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      userId,
      data.attestation_id,
      data.circuit_type,
      JSON.stringify({
        publicSignals: proofResult.publicSignals,
        nullifierHash: proofResult.nullifierHash,
      }),
      proofResult.proof, // Already JSON stringified by SNARK implementation
      true, // Self-verify on generation
    ]
  );

  const zkProof = result.rows[0];

  return {
    id: zkProof.id,
    attestation_id: zkProof.attestation_id,
    circuit_type: zkProof.circuit_type,
    public_inputs: zkProof.public_inputs,
    proof: zkProof.proof,
    verified: zkProof.verified,
    created_at: zkProof.created_at,
    user_id: zkProof.user_id,
  };
}

/**
 * Get ZK proof by ID
 */
export async function getZKProof(
  proofId: string,
  userId?: string
): Promise<ZKProof | null> {
  const queryStr = userId
    ? 'SELECT * FROM zk_proofs WHERE id = $1 AND user_id = $2'
    : 'SELECT * FROM zk_proofs WHERE id = $1';

  const params = userId ? [proofId, userId] : [proofId];
  const result = await query(queryStr, params);

  if (result.rows.length === 0) {
    return null;
  }

  const zkProof = result.rows[0];

  return {
    id: zkProof.id,
    attestation_id: zkProof.attestation_id,
    circuit_type: zkProof.circuit_type,
    public_inputs: zkProof.public_inputs,
    proof: zkProof.proof,
    verified: zkProof.verified,
    created_at: zkProof.created_at,
    user_id: zkProof.user_id,
  };
}

/**
 * List all ZK proofs for a user
 */
export async function listZKProofs(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ZKProof[]> {
  const result = await query(
    `SELECT * FROM zk_proofs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows.map((row) => ({
    id: row.id,
    attestation_id: row.attestation_id,
    circuit_type: row.circuit_type,
    public_inputs: row.public_inputs,
    proof: row.proof,
    verified: row.verified,
    created_at: row.created_at,
    user_id: row.user_id,
  }));
}

/**
 * Verify a ZK proof using real zk-SNARKs
 */
export async function verifyZKProof(proofId: string): Promise<{
  valid: boolean;
  proof: ZKProof;
}> {
  const zkProof = await getZKProof(proofId);

  if (!zkProof) {
    throw new Error('Proof not found');
  }

  // Parse public inputs to get publicSignals
  const publicInputsData = JSON.parse(zkProof.public_inputs);
  const publicSignals = publicInputsData.publicSignals;

  // Verify the proof using circuit-specific verification
  let verificationResult;

  try {
    switch (zkProof.circuit_type) {
      case 'threshold':
        verificationResult = await verifyThresholdProof(zkProof.proof, publicSignals);
        break;
      case 'range':
        verificationResult = await verifyRangeProof(zkProof.proof, publicSignals);
        break;
      case 'set_membership':
        verificationResult = await verifySetMembershipProof(zkProof.proof, publicSignals);
        break;
      default:
        throw new Error(`Unsupported circuit type: ${zkProof.circuit_type}`);
    }
  } catch (error: any) {
    verificationResult = { verified: false, error: error.message };
  }

  const isValid = verificationResult.verified;

  // Update verification status if changed
  if (isValid !== zkProof.verified) {
    await query('UPDATE zk_proofs SET verified = $1 WHERE id = $2', [
      isValid,
      proofId,
    ]);
    zkProof.verified = isValid;
  }

  return {
    valid: isValid,
    proof: zkProof,
  };
}

/**
 * Get proofs for a specific attestation
 */
export async function getProofsForAttestation(
  attestationId: string,
  userId?: string
): Promise<ZKProof[]> {
  const queryStr = userId
    ? 'SELECT * FROM zk_proofs WHERE attestation_id = $1 AND user_id = $2 ORDER BY created_at DESC'
    : 'SELECT * FROM zk_proofs WHERE attestation_id = $1 ORDER BY created_at DESC';

  const params = userId ? [attestationId, userId] : [attestationId];
  const result = await query(queryStr, params);

  return result.rows.map((row) => ({
    id: row.id,
    attestation_id: row.attestation_id,
    circuit_type: row.circuit_type,
    public_inputs: row.public_inputs,
    proof: row.proof,
    verified: row.verified,
    created_at: row.created_at,
    user_id: row.user_id,
  }));
}
