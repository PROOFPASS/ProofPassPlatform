import { query } from '../../config/database';
import { createVerifiableCredential, signCredential, hashCredential } from '@proofpass/vc-toolkit';
import { config } from '../../config/env';
import QRCode from 'qrcode';
import type {
  ProductPassport,
  CreateProductPassportDTO,
  PassportVerificationResult,
  Attestation
} from '@proofpass/types';

/**
 * Create a new product passport by aggregating attestations
 */
export async function createProductPassport(
  data: CreateProductPassportDTO,
  userId: string
): Promise<ProductPassport> {
  // Validate that all attestations exist and belong to the user
  const attestationsResult = await query(
    `SELECT id, claims, credential, type, blockchain_tx_hash
     FROM attestations
     WHERE id = ANY($1::uuid[]) AND user_id = $2 AND status = 'anchored'`,
    [data.attestation_ids, userId]
  );

  if (attestationsResult.rows.length !== data.attestation_ids.length) {
    throw new Error('Some attestations not found or not anchored');
  }

  const attestations = attestationsResult.rows;

  // Aggregate all attestation claims
  const aggregatedClaims: Record<string, any> = {
    product_id: data.product_id,
    product_name: data.name,
    attestations: attestations.map((att) => ({
      id: att.id,
      type: att.type,
      claims: att.claims,
      blockchain_tx_hash: att.blockchain_tx_hash,
    })),
  };

  // Create aggregated verifiable credential
  const aggregatedCredential = createVerifiableCredential({
    issuerDID: `did:proofpass:${userId}`,
    subject: {
      id: data.product_id,
      type: 'Product',
      ...aggregatedClaims,
    },
    type: ['ProductPassport'],
  });

  // Sign the credential
  const signedCredential = signCredential(aggregatedCredential, config.auth.jwtSecret);

  // Generate QR code
  const qrData = {
    type: 'ProductPassport',
    product_id: data.product_id,
    credential_hash: hashCredential(signedCredential),
  };
  const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

  // Insert product passport
  const passportResult = await query(
    `INSERT INTO product_passports
     (user_id, product_id, name, description, aggregated_credential, blockchain_network, qr_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      userId,
      data.product_id,
      data.name,
      data.description || null,
      signedCredential,
      data.blockchain_network || 'stellar',
      qrCode,
    ]
  );

  const passport = passportResult.rows[0];

  // Link attestations to passport
  for (const attestationId of data.attestation_ids) {
    await query(
      `INSERT INTO passport_attestations (passport_id, attestation_id)
       VALUES ($1, $2)`,
      [passport.id, attestationId]
    );
  }

  return {
    id: passport.id,
    product_id: passport.product_id,
    name: passport.name,
    description: passport.description,
    attestation_ids: data.attestation_ids,
    aggregated_credential: passport.aggregated_credential,
    blockchain_tx_hash: passport.blockchain_tx_hash,
    blockchain_network: passport.blockchain_network,
    qr_code: passport.qr_code,
    created_at: passport.created_at,
    updated_at: passport.updated_at,
    user_id: passport.user_id,
  };
}

/**
 * Get product passport by ID
 */
export async function getProductPassport(
  passportId: string,
  userId?: string
): Promise<ProductPassport | null> {
  const queryStr = userId
    ? 'SELECT * FROM product_passports WHERE id = $1 AND user_id = $2'
    : 'SELECT * FROM product_passports WHERE id = $1';

  const params = userId ? [passportId, userId] : [passportId];
  const result = await query(queryStr, params);

  if (result.rows.length === 0) {
    return null;
  }

  const passport = result.rows[0];

  // Get linked attestation IDs
  const attestationsResult = await query(
    'SELECT attestation_id FROM passport_attestations WHERE passport_id = $1',
    [passportId]
  );

  const attestationIds = attestationsResult.rows.map((row) => row.attestation_id);

  return {
    id: passport.id,
    product_id: passport.product_id,
    name: passport.name,
    description: passport.description,
    attestation_ids: attestationIds,
    aggregated_credential: passport.aggregated_credential,
    blockchain_tx_hash: passport.blockchain_tx_hash,
    blockchain_network: passport.blockchain_network,
    qr_code: passport.qr_code,
    created_at: passport.created_at,
    updated_at: passport.updated_at,
    user_id: passport.user_id,
  };
}

/**
 * Get product passport by product ID
 */
export async function getProductPassportByProductId(
  productId: string,
  userId?: string
): Promise<ProductPassport | null> {
  const queryStr = userId
    ? 'SELECT * FROM product_passports WHERE product_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1'
    : 'SELECT * FROM product_passports WHERE product_id = $1 ORDER BY created_at DESC LIMIT 1';

  const params = userId ? [productId, userId] : [productId];
  const result = await query(queryStr, params);

  if (result.rows.length === 0) {
    return null;
  }

  const passport = result.rows[0];

  // Get linked attestation IDs
  const attestationsResult = await query(
    'SELECT attestation_id FROM passport_attestations WHERE passport_id = $1',
    [passport.id]
  );

  const attestationIds = attestationsResult.rows.map((row) => row.attestation_id);

  return {
    id: passport.id,
    product_id: passport.product_id,
    name: passport.name,
    description: passport.description,
    attestation_ids: attestationIds,
    aggregated_credential: passport.aggregated_credential,
    blockchain_tx_hash: passport.blockchain_tx_hash,
    blockchain_network: passport.blockchain_network,
    qr_code: passport.qr_code,
    created_at: passport.created_at,
    updated_at: passport.updated_at,
    user_id: passport.user_id,
  };
}

/**
 * List all product passports for a user
 */
export async function listProductPassports(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ProductPassport[]> {
  const result = await query(
    `SELECT * FROM product_passports
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const passports = await Promise.all(
    result.rows.map(async (passport) => {
      const attestationsResult = await query(
        'SELECT attestation_id FROM passport_attestations WHERE passport_id = $1',
        [passport.id]
      );

      const attestationIds = attestationsResult.rows.map((row) => row.attestation_id);

      return {
        id: passport.id,
        product_id: passport.product_id,
        name: passport.name,
        description: passport.description,
        attestation_ids: attestationIds,
        aggregated_credential: passport.aggregated_credential,
        blockchain_tx_hash: passport.blockchain_tx_hash,
        blockchain_network: passport.blockchain_network,
        qr_code: passport.qr_code,
        created_at: passport.created_at,
        updated_at: passport.updated_at,
        user_id: passport.user_id,
      };
    })
  );

  return passports;
}

/**
 * Verify a product passport and all its attestations
 */
export async function verifyProductPassport(
  passportId: string
): Promise<PassportVerificationResult> {
  const passport = await getProductPassport(passportId);

  if (!passport) {
    throw new Error('Passport not found');
  }

  // Verify each attestation
  const attestationResults = await Promise.all(
    passport.attestation_ids.map(async (attestationId) => {
      try {
        const attestationResult = await query(
          'SELECT * FROM attestations WHERE id = $1',
          [attestationId]
        );

        if (attestationResult.rows.length === 0) {
          return {
            attestation_id: attestationId,
            valid: false,
            blockchain_verified: false,
            signature_verified: false,
          };
        }

        const attestation = attestationResult.rows[0];

        // Check if blockchain anchored
        const blockchainVerified = attestation.blockchain_tx_hash !== null;

        // Check credential signature (basic validation)
        const signatureVerified = attestation.credential.proof !== undefined;

        return {
          attestation_id: attestationId,
          valid: blockchainVerified && signatureVerified,
          blockchain_verified: blockchainVerified,
          signature_verified: signatureVerified,
        };
      } catch (error) {
        return {
          attestation_id: attestationId,
          valid: false,
          blockchain_verified: false,
          signature_verified: false,
        };
      }
    })
  );

  const allValid = attestationResults.every((result) => result.valid);

  return {
    valid: allValid,
    passport,
    attestations_verified: attestationResults,
  };
}

/**
 * Add attestation to existing passport
 */
export async function addAttestationToPassport(
  passportId: string,
  attestationId: string,
  userId: string
): Promise<ProductPassport> {
  // Verify passport belongs to user
  const passport = await getProductPassport(passportId, userId);
  if (!passport) {
    throw new Error('Passport not found');
  }

  // Verify attestation exists and belongs to user
  const attestationResult = await query(
    'SELECT * FROM attestations WHERE id = $1 AND user_id = $2 AND status = $3',
    [attestationId, userId, 'anchored']
  );

  if (attestationResult.rows.length === 0) {
    throw new Error('Attestation not found or not anchored');
  }

  // Add link
  await query(
    'INSERT INTO passport_attestations (passport_id, attestation_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [passportId, attestationId]
  );

  // Return updated passport
  return getProductPassport(passportId, userId) as Promise<ProductPassport>;
}
