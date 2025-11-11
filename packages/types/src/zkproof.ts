export type CircuitType = 'threshold' | 'range' | 'set_membership';

export interface ZKProof {
  id: string;
  attestation_id: string;
  circuit_type: CircuitType;
  public_inputs: Record<string, any>;
  proof: string; // JSON stringified proof
  verified: boolean;
  created_at: Date;
  user_id: string;
}

export interface GenerateZKProofDTO {
  attestation_id: string;
  circuit_type: CircuitType;
  private_inputs: Record<string, any>;
  public_inputs: Record<string, any>;
}

export interface VerifyZKProofDTO {
  proof_id: string;
}

// Specific proof types
export interface ThresholdProofInputs {
  value: number; // private
  threshold: number; // public
}

export interface RangeProofInputs {
  value: number; // private
  min: number; // public
  max: number; // public
}

export interface SetMembershipProofInputs {
  value: any; // private
  set: any[]; // public (hashed)
}
