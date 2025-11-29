import { BlockchainNetwork } from './attestation';

export interface BlockchainTransaction {
  id: string;
  tx_hash: string;
  network: BlockchainNetwork;
  type: 'attestation' | 'passport';
  reference_id: string; // attestation_id or passport_id
  status: 'pending' | 'confirmed' | 'failed';
  block_number?: number;
  timestamp?: Date;
  fee?: string;
  created_at: Date;
  updated_at: Date;
}

export interface StellarTransactionData {
  hash: string;
  memo?: string;
  sequence: string;
  source_account: string;
  fee_charged: string;
  operation_count: number;
  created_at: string;
}

export interface OptimismTransactionData {
  hash: string;
  from: string;
  to?: string;
  value: string;
  gas: string;
  gasPrice: string;
  nonce: number;
  blockNumber?: number;
  timestamp?: number;
}
