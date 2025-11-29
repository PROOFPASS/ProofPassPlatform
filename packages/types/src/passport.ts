import { VerifiableCredential } from './verifiable-credential';
import { BlockchainNetwork } from './attestation';

export interface ProductPassport {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  attestation_ids: string[]; // References to attestations
  aggregated_credential: VerifiableCredential;
  blockchain_tx_hash?: string;
  blockchain_network: BlockchainNetwork;
  qr_code?: string;
  created_at: Date;
  updated_at: Date;
  user_id: string;
}

export interface CreateProductPassportDTO {
  product_id: string;
  name: string;
  description?: string;
  attestation_ids: string[];
  blockchain_network?: BlockchainNetwork;
}

export interface PassportVerificationResult {
  valid: boolean;
  passport: ProductPassport;
  attestations_verified: {
    attestation_id: string;
    valid: boolean;
    blockchain_verified: boolean;
    signature_verified: boolean;
  }[];
  errors?: string[];
}
