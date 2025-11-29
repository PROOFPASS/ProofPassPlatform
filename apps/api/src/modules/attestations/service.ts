import { query } from '../../config/database';
import { BlockchainManager } from '@proofpass/blockchain';
import type { BlockchainNetwork as BCNetwork } from '@proofpass/blockchain';
import {
  createCredential,
  issueVC,
  verifyVC,
  importDIDKeyPair,
} from '@proofpass/vc-toolkit';
import { config } from '../../config/env';
import QRCode from 'qrcode';
import type {
  Attestation,
  CreateAttestationDTO,
  BlockchainNetwork,
} from '@proofpass/types';
import { getDIDForSigning } from '../../services/did-manager';

let blockchainManager: BlockchainManager | null = null;

function getBlockchainManager(): BlockchainManager {
  if (!blockchainManager) {
    blockchainManager = new BlockchainManager();

    // Add Stellar provider if configured
    if (config.blockchain.stellar.secretKey) {
      try {
        blockchainManager.addProvider({
          network: config.blockchain.stellar.network,
          privateKey: config.blockchain.stellar.secretKey,
        });
        console.log(`✅ Stellar ${config.blockchain.stellar.network} provider initialized for attestations`);
      } catch (error: any) {
        console.warn(`⚠️  Failed to initialize Stellar provider: ${error.message}`);
      }
    }

    // Add Optimism provider if configured
    if (config.blockchain.optimism.privateKey) {
      try {
        blockchainManager.addProvider({
          network: config.blockchain.optimism.network,
          privateKey: config.blockchain.optimism.privateKey,
          rpcUrl: config.blockchain.optimism.rpcUrl,
        });
        console.log(`✅ Optimism ${config.blockchain.optimism.network} provider initialized for attestations`);
      } catch (error: any) {
        console.warn(`⚠️  Failed to initialize Optimism provider: ${error.message}`);
      }
    }

    // Add Arbitrum provider if configured
    if (config.blockchain.arbitrum.privateKey) {
      try {
        blockchainManager.addProvider({
          network: config.blockchain.arbitrum.network,
          privateKey: config.blockchain.arbitrum.privateKey,
          rpcUrl: config.blockchain.arbitrum.rpcUrl,
        });
        console.log(`✅ Arbitrum ${config.blockchain.arbitrum.network} provider initialized for attestations`);
      } catch (error: any) {
        console.warn(`⚠️  Failed to initialize Arbitrum provider: ${error.message}`);
      }
    }

    // Set default network
    const defaultNetwork = config.blockchain.defaultNetwork as BCNetwork;
    try {
      blockchainManager.setDefaultNetwork(defaultNetwork);
      console.log(`✅ Default blockchain network set to: ${defaultNetwork}`);
    } catch (error: any) {
      console.error(`❌ Failed to set default network: ${error.message}`);
    }
  }

  return blockchainManager;
}

export async function createAttestation(
  data: CreateAttestationDTO,
  userId: string
): Promise<Attestation> {
  // Get user's DID from DID Manager (reuses existing DID or creates primary one)
  const { did: userDID, keyPair: rawKeyPair } = await getDIDForSigning(userId);
  const issuerDID = userDID.did;

  // Convert the raw key pair to DIDKeyPair format for vc-toolkit
  const privateKeyHex = Buffer.from(rawKeyPair.secretKey).toString('hex');
  const issuerKeyPair = importDIDKeyPair(privateKeyHex);

  // Create W3C-compliant Verifiable Credential
  const credential = createCredential({
    issuerDID,
    subjectDID: data.subject,
    credentialSubject: data.claims,
    type: [data.type],
  });

  // Issue and sign the credential as a JWT (W3C standard)
  const vcJWT = await issueVC({
    credential,
    issuerKeyPair,
  });

  // Parse the JWT to get credential ID for QR code
  const credentialId = `urn:uuid:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Generate QR code
  const qrData = {
    id: credentialId,
    type: data.type,
    verifyUrl: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/api/v1/attestations/${credentialId}/verify`,
  };
  const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

  // Default to stellar-testnet if not specified
  const defaultNetwork: BCNetwork = 'stellar-testnet';
  const networkToUse = data.blockchain_network || defaultNetwork;

  // Insert into database (initially without blockchain hash)
  const result = await query(
    `INSERT INTO attestations
      (id, issuer_did, subject, type, claims, issued_at, credential, blockchain_network, qr_code, status, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      credentialId,
      issuerDID,
      data.subject,
      data.type,
      JSON.stringify(data.claims),
      new Date().toISOString(),
      vcJWT, // Store as JWT string (W3C standard format)
      networkToUse,
      qrCode,
      'pending',
      userId,
    ]
  );

  const attestation = result.rows[0];

  // Anchor to blockchain asynchronously (supports Stellar, Optimism, Arbitrum)
  anchorToBlockchain(attestation.id, vcJWT, networkToUse as BCNetwork).catch((err) => {
    console.error(`Failed to anchor to ${networkToUse}:`, err);
  });

  return mapDBRowToAttestation(attestation);
}

async function anchorToBlockchain(
  attestationId: string,
  credential: any,
  network: BCNetwork
): Promise<void> {
  try {
    const manager = getBlockchainManager();
    const provider = manager.getProvider(network);
    // Hash the credential JWT string for blockchain anchoring
    const crypto = require('crypto');
    const credentialHash = crypto.createHash('sha256').update(credential).digest('hex');

    // Anchor to blockchain (Stellar, Optimism, or Arbitrum)
    const result = await provider.anchorData(credentialHash);

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
      [result.txHash, network, 'attestation', attestationId, 'confirmed', new Date(), result.fee || '0']
    );

    console.log(`✅ Attestation ${attestationId} anchored to ${network}: ${result.txHash}`);
  } catch (error) {
    console.error(`Error anchoring to ${network}:`, error);
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
  const errors: string[] = [];

  // Get the raw credential string (JWT) from the database row
  const credentialJWT: string = result.rows[0].credential;

  // Verify W3C Verifiable Credential JWT
  const vcVerification = await verifyVC(credentialJWT);

  if (!vcVerification.verified) {
    errors.push(vcVerification.error || 'VC verification failed');
  }

  let blockchainVerified = false;

  // Verify blockchain anchor if available (supports Stellar, Optimism, Arbitrum)
  if (attestation.blockchain_tx_hash && attestation.blockchain_network) {
    try {
      const manager = getBlockchainManager();
      const provider = manager.getProvider(attestation.blockchain_network as BCNetwork);
      // Hash the JWT string directly for blockchain verification
      const crypto = require('crypto');
      const credentialHash = crypto.createHash('sha256').update(credentialJWT).digest('hex');

      const verificationResult = await provider.verifyAnchor(
        attestation.blockchain_tx_hash,
        credentialHash
      );
      blockchainVerified = verificationResult.valid;
    } catch (error) {
      console.error(`Blockchain verification error on ${attestation.blockchain_network}:`, error);
    }
  }

  if (attestation.blockchain_tx_hash && !blockchainVerified) {
    errors.push('Blockchain verification failed');
  }

  return {
    valid: vcVerification.verified && (blockchainVerified || !attestation.blockchain_tx_hash),
    attestation,
    verification: {
      credentialValid: vcVerification.verified,
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
