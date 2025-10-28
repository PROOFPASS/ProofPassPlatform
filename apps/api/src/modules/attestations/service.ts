import { query } from '../../config/database';
import { StellarClient } from '@proofpass/stellar-sdk';
import {
  createVerifiableCredential,
  signCredential,
  hashCredential,
  verifyCredential,
} from '@proofpass/vc-toolkit';
import { config } from '../../config/env';
import QRCode from 'qrcode';
import type {
  Attestation,
  CreateAttestationDTO,
  BlockchainNetwork,
} from '@proofpass/types';

let stellarClient: StellarClient | null = null;

function getStellarClient(): StellarClient {
  if (!stellarClient && config.stellar.secretKey) {
    stellarClient = new StellarClient({
      network: config.stellar.network as 'testnet' | 'mainnet',
      secretKey: config.stellar.secretKey,
      publicKey: config.stellar.publicKey,
    });
  }
  if (!stellarClient) {
    throw new Error('Stellar client not configured');
  }
  return stellarClient;
}

export async function createAttestation(
  data: CreateAttestationDTO,
  userId: string
): Promise<Attestation> {
  // Generate DID for issuer (in production, this should be persistent per user)
  const issuerDID = `did:proofpass:${userId}`;

  // Create verifiable credential
  const credential = createVerifiableCredential({
    issuerDID,
    subject: {
      id: data.subject,
      ...data.claims,
    },
    type: [data.type],
  });

  // Sign credential (using a simplified approach for now)
  const signedCredential = signCredential(credential, config.auth.jwtSecret);

  // Generate QR code
  const qrData = {
    id: credential.id,
    type: data.type,
    verifyUrl: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/api/v1/attestations/${credential.id}/verify`,
  };
  const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

  // Insert into database (initially without blockchain hash)
  const result = await query(
    `INSERT INTO attestations
      (issuer_did, subject, type, claims, issued_at, credential, blockchain_network, qr_code, status, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      issuerDID,
      data.subject,
      data.type,
      JSON.stringify(data.claims),
      new Date().toISOString(),
      JSON.stringify(signedCredential),
      data.blockchain_network || 'stellar',
      qrCode,
      'pending',
      userId,
    ]
  );

  const attestation = result.rows[0];

  // Anchor to blockchain asynchronously
  if (data.blockchain_network === 'stellar' || !data.blockchain_network) {
    anchorToStellar(attestation.id, signedCredential).catch((err) => {
      console.error('Failed to anchor to Stellar:', err);
    });
  }

  return mapDBRowToAttestation(attestation);
}

async function anchorToStellar(
  attestationId: string,
  credential: any
): Promise<void> {
  try {
    const client = getStellarClient();
    const credentialHash = hashCredential(credential);

    // Anchor to Stellar
    const result = await client.anchorData(JSON.stringify(credential));

    // Update database with transaction hash
    await query(
      `UPDATE attestations
       SET blockchain_tx_hash = $1, status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [result.txHash, 'anchored', attestationId]
    );

    // Store blockchain transaction
    await query(
      `INSERT INTO blockchain_transactions
        (tx_hash, network, type, reference_id, status, timestamp, fee)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [result.txHash, 'stellar', 'attestation', attestationId, 'confirmed', new Date(), result.fee]
    );
  } catch (error) {
    console.error('Error anchoring to Stellar:', error);
    // Update status to indicate failure
    await query(
      `UPDATE attestations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['pending', attestationId]
    );
  }
}

export async function getAttestation(
  attestationId: string,
  userId: string
): Promise<Attestation | null> {
  const result = await query('SELECT * FROM attestations WHERE id = $1 AND user_id = $2', [
    attestationId,
    userId,
  ]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapDBRowToAttestation(result.rows[0]);
}

export async function getAttestations(userId: string): Promise<Attestation[]> {
  const result = await query(
    'SELECT * FROM attestations WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );

  return result.rows.map(mapDBRowToAttestation);
}

export async function verifyAttestation(attestationId: string): Promise<{
  valid: boolean;
  attestation?: Attestation;
  verification: {
    credentialValid: boolean;
    blockchainVerified: boolean;
  };
  errors: string[];
}> {
  const result = await query('SELECT * FROM attestations WHERE id = $1', [attestationId]);

  if (result.rows.length === 0) {
    return {
      valid: false,
      errors: ['Attestation not found'],
      verification: {
        credentialValid: false,
        blockchainVerified: false,
      },
    };
  }

  const attestation = mapDBRowToAttestation(result.rows[0]);

  // Verify credential structure and signature
  const credentialVerification = verifyCredential(
    attestation.credential,
    config.auth.jwtSecret
  );

  let blockchainVerified = false;

  // Verify blockchain anchor if available
  if (attestation.blockchain_tx_hash && attestation.blockchain_network === 'stellar') {
    try {
      const client = getStellarClient();
      const credentialString = JSON.stringify(attestation.credential);
      blockchainVerified = await client.verifyAnchor(
        attestation.blockchain_tx_hash,
        credentialString
      );
    } catch (error) {
      console.error('Blockchain verification error:', error);
    }
  }

  const errors = [...credentialVerification.errors];
  if (attestation.blockchain_tx_hash && !blockchainVerified) {
    errors.push('Blockchain verification failed');
  }

  return {
    valid: credentialVerification.verified && (blockchainVerified || !attestation.blockchain_tx_hash),
    attestation,
    verification: {
      credentialValid: credentialVerification.verified,
      blockchainVerified,
    },
    errors,
  };
}

function mapDBRowToAttestation(row: any): Attestation {
  return {
    id: row.id,
    issuer_did: row.issuer_did,
    subject: row.subject,
    type: row.type,
    claims: row.claims,
    issued_at: new Date(row.issued_at),
    credential: row.credential,
    blockchain_tx_hash: row.blockchain_tx_hash,
    blockchain_network: row.blockchain_network,
    qr_code: row.qr_code,
    status: row.status,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    user_id: row.user_id,
  };
}
