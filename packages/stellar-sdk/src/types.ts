export interface StellarConfig {
  network: 'testnet' | 'mainnet';
  secretKey: string;
  publicKey: string;
}

export interface AnchorDataResult {
  txHash: string;
  sequence: string;
  fee: string;
  timestamp: Date;
}

export interface TransactionInfo {
  hash: string;
  memo?: string;
  sequence: string;
  sourceAccount: string;
  feeCharged: string;
  operationCount: number;
  createdAt: Date;
  successful: boolean;
}
