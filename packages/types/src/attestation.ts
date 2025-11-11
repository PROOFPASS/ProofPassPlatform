import { VerifiableCredential } from './verifiable-credential';

export type AttestationStatus = 'pending' | 'anchored' | 'revoked';
export type BlockchainNetwork = 'stellar' | 'optimism';

export interface Attestation {
  id: string;
  issuer_did: string;
  subject: string; // Product ID, entity, batch number, etc
  type: string; // "QualityTest", "Certification", "OriginVerification", etc
  claims: Record<string, any>; // Flexible claims based on attestation type
  issued_at: Date;
  credential: VerifiableCredential;
  blockchain_tx_hash?: string;
  blockchain_network: BlockchainNetwork;
  qr_code?: string; // base64 encoded or URL
  status: AttestationStatus;
  created_at: Date;
  updated_at: Date;
  user_id: string; // Owner of this attestation
}

export interface CreateAttestationDTO {
  subject: string;
  type: string;
  claims: Record<string, any>;
  blockchain_network?: BlockchainNetwork;
}

export interface AttestationTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  schema: Record<string, any>; // JSON Schema for claims validation
  example_claims: Record<string, any>;
  created_at: Date;
}

// Common attestation types
export enum AttestationType {
  QUALITY_TEST = 'QualityTest',
  CERTIFICATION = 'Certification',
  ORIGIN_VERIFICATION = 'OriginVerification',
  CARBON_FOOTPRINT = 'CarbonFootprint',
  BATTERY_PASSPORT = 'BatteryPassport',
  FOOD_SAFETY = 'FoodSafety',
  PHARMA_COMPLIANCE = 'PharmaCompliance',
  MANUFACTURING = 'Manufacturing',
  SHIPPING = 'Shipping',
  CUSTOMS_CLEARANCE = 'CustomsClearance',
}
