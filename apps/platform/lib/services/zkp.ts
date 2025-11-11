import apiClient from '../api-client';

export type CircuitType = 'threshold' | 'range' | 'set_membership';

export interface ZKProof {
  id: string;
  attestation_id: string;
  circuit_type: CircuitType;
  public_inputs: any;
  proof: string;
  verified: boolean;
  created_at: Date;
  user_id: string;
}

export interface GenerateZKProofRequest {
  attestation_id: string;
  circuit_type: CircuitType;
  private_inputs: Record<string, any>;
  public_inputs: Record<string, any>;
}

export interface VerificationResult {
  valid: boolean;
  proof: ZKProof;
}

/**
 * Zero-Knowledge Proofs Service
 * Manages zk-SNARK proofs (Groth16) for attestations
 */
export const zkpService = {
  /**
   * Generate a new zero-knowledge proof
   */
  async generate(data: GenerateZKProofRequest): Promise<ZKProof> {
    const response = await apiClient.post('/api/v1/zkp/proofs', data);
    return this.parseProof(response);
  },

  /**
   * Get proof by ID
   */
  async getById(id: string): Promise<ZKProof> {
    const response = await apiClient.get(`/api/v1/zkp/proofs/${id}`);
    return this.parseProof(response);
  },

  /**
   * List all proofs for authenticated user
   */
  async list(limit: number = 50, offset: number = 0): Promise<ZKProof[]> {
    const response = await apiClient.get('/api/v1/zkp/proofs', {
      params: { limit, offset },
    });
    const proofs = response.proofs || [];
    return proofs.map((p: any) => this.parseProof(p));
  },

  /**
   * Verify a zero-knowledge proof
   */
  async verify(id: string): Promise<VerificationResult> {
    const response = await apiClient.get(`/api/v1/zkp/proofs/${id}/verify`);
    return {
      valid: response.valid,
      proof: this.parseProof(response.proof),
    };
  },

  /**
   * Get proofs for a specific attestation
   */
  async getByAttestation(attestationId: string): Promise<ZKProof[]> {
    const response = await apiClient.get(`/api/v1/attestations/${attestationId}/proofs`);
    const proofs = response.proofs || [];
    return proofs.map((p: any) => this.parseProof(p));
  },

  /**
   * Parse proof from API response
   */
  parseProof(data: any): ZKProof {
    return {
      ...data,
      created_at: new Date(data.created_at),
    };
  },

  /**
   * Get circuit type display name
   */
  getCircuitName(type: CircuitType): string {
    switch (type) {
      case 'threshold':
        return 'Threshold Proof';
      case 'range':
        return 'Range Proof';
      case 'set_membership':
        return 'Set Membership Proof';
      default:
        return type;
    }
  },

  /**
   * Get circuit description
   */
  getCircuitDescription(type: CircuitType): string {
    switch (type) {
      case 'threshold':
        return 'Prove that a value is greater than or equal to a threshold without revealing the actual value';
      case 'range':
        return 'Prove that a value is within a specific range without revealing the exact value';
      case 'set_membership':
        return 'Prove that a value belongs to a set without revealing which specific value';
      default:
        return '';
    }
  },
};
