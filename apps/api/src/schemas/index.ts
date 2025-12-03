/**
 * Shared Swagger/OpenAPI schemas for ProofPass Platform
 * These schemas are used across all API routes for consistent documentation
 */

export const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', description: 'Error message' },
    details: { type: 'object', description: 'Additional error details' },
  },
};

export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', description: 'User unique identifier' },
    email: { type: 'string', format: 'email', description: 'User email address' },
    name: { type: 'string', description: 'User full name' },
    organization: { type: 'string', description: 'User organization (optional)' },
    api_key: { type: 'string', description: 'API key for programmatic access' },
    created_at: { type: 'string', format: 'date-time', description: 'Account creation timestamp' },
  },
};

export const attestationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', description: 'Attestation unique identifier' },
    subject: { type: 'string', description: 'Subject of the attestation (DID or identifier)' },
    type: { type: 'string', description: 'Type of attestation (e.g., certification, ownership)' },
    claims: { type: 'object', description: 'Attestation claims (key-value pairs)' },
    issuer: { type: 'string', description: 'Issuer DID' },
    blockchain_tx_hash: { type: 'string', description: 'Blockchain transaction hash (anchor)' },
    blockchain_network: {
      type: 'string',
      enum: ['stellar', 'optimism'],
      description: 'Blockchain network used',
    },
    created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
    verifiable_credential: { type: 'object', description: 'W3C Verifiable Credential format' },
  },
};

export const passportSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', description: 'Passport unique identifier' },
    product_id: { type: 'string', description: 'Product identifier (SKU, GTIN, etc.)' },
    product_name: { type: 'string', description: 'Product name' },
    product_type: { type: 'string', description: 'Product category/type' },
    manufacturer: { type: 'string', description: 'Manufacturer name' },
    metadata: { type: 'object', description: 'Additional product metadata' },
    attestation_ids: {
      type: 'array',
      items: { type: 'string', format: 'uuid' },
      description: 'List of associated attestation IDs',
    },
    aggregated_credential: {
      type: 'object',
      description: 'Aggregated W3C Verifiable Credential for the passport',
      additionalProperties: true,
    },
    qr_code: { type: 'string', description: 'Base64-encoded QR code image' },
    created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
    updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
  },
};

export const zkProofSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', description: 'ZK proof unique identifier' },
    attestation_id: { type: 'string', format: 'uuid', description: 'Associated attestation ID' },
    proof: { type: 'object', description: 'Zero-knowledge proof data (SNARK proof object)' },
    public_inputs: {
      type: 'object',
      description:
        'Public inputs used in proof generation (includes publicSignals and nullifierHash)',
    },
    circuit_type: {
      type: 'string',
      enum: ['threshold', 'range', 'set-membership'],
      description: 'Type of ZK circuit used',
    },
    verified: { type: 'boolean', description: 'Whether the proof has been verified' },
    created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
    user_id: { type: 'string', format: 'uuid', description: 'User who created the proof' },
  },
};

export const healthSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['ok'], description: 'Service health status' },
    timestamp: { type: 'string', format: 'date-time', description: 'Response timestamp' },
    version: { type: 'string', description: 'API version' },
  },
};

export const readinessSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['ready'], description: 'Service readiness status' },
    database: { type: 'string', enum: ['connected'], description: 'Database connection status' },
    redis: { type: 'string', enum: ['connected'], description: 'Redis connection status' },
    timestamp: { type: 'string', format: 'date-time', description: 'Response timestamp' },
  },
};

// Request body schemas (without 'example' keyword to avoid AJV strict mode issues)
export const registerBodySchema = {
  type: 'object',
  required: ['email', 'password', 'name'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address (e.g., user@example.com)',
    },
    password: {
      type: 'string',
      minLength: 8,
      description: 'User password (min 8 characters)',
    },
    name: {
      type: 'string',
      minLength: 2,
      description: 'User full name',
    },
    organization: {
      type: 'string',
      description: 'Organization name (optional)',
    },
  },
};

export const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address',
    },
    password: {
      type: 'string',
      description: 'User password',
    },
  },
};

export const createAttestationBodySchema = {
  type: 'object',
  required: ['subject', 'type', 'claims'],
  properties: {
    subject: {
      type: 'string',
      description: 'Subject DID or identifier',
    },
    type: {
      type: 'string',
      description: 'Attestation type (e.g., ProductCertification)',
    },
    claims: {
      type: 'object',
      description: 'Attestation claims as key-value pairs',
    },
    blockchain_network: {
      type: 'string',
      enum: [
        'stellar-testnet',
        'stellar-mainnet',
        'optimism',
        'optimism-sepolia',
        'arbitrum',
        'arbitrum-sepolia',
      ],
      description: 'Blockchain network for anchoring (default: stellar-testnet)',
    },
  },
};

export const createPassportBodySchema = {
  type: 'object',
  required: ['product_id', 'product_name', 'product_type', 'manufacturer'],
  properties: {
    product_id: {
      type: 'string',
      description: 'Product identifier (SKU, GTIN, etc.)',
    },
    product_name: {
      type: 'string',
      description: 'Product name',
    },
    product_type: {
      type: 'string',
      description: 'Product category',
    },
    manufacturer: {
      type: 'string',
      description: 'Manufacturer name',
    },
    metadata: {
      type: 'object',
      description: 'Additional product information',
    },
    attestation_ids: {
      type: 'array',
      items: { type: 'string', format: 'uuid' },
      description: 'Associated attestation IDs',
    },
  },
};

export const generateZKProofBodySchema = {
  type: 'object',
  required: ['circuit_type', 'inputs'],
  properties: {
    circuit_type: {
      type: 'string',
      enum: ['age', 'range', 'membership'],
      description: 'Type of zero-knowledge circuit',
    },
    inputs: {
      type: 'object',
      description: 'Circuit-specific inputs',
    },
  },
};

// Response schemas
export const authResponseSchema = {
  type: 'object',
  properties: {
    user: userSchema,
    token: { type: 'string', description: 'JWT authentication token' },
  },
};

export const attestationListResponseSchema = {
  type: 'object',
  properties: {
    attestations: {
      type: 'array',
      items: attestationSchema,
      description: 'List of attestations',
    },
  },
};

export const verificationResponseSchema = {
  type: 'object',
  properties: {
    valid: { type: 'boolean', description: 'Whether the attestation is valid' },
    blockchain_verified: { type: 'boolean', description: 'Whether blockchain anchor was verified' },
    signature_valid: { type: 'boolean', description: 'Whether cryptographic signature is valid' },
    details: { type: 'object', description: 'Additional verification details' },
  },
};

export const zkVerificationResponseSchema = {
  type: 'object',
  properties: {
    valid: { type: 'boolean', description: 'Whether the zero-knowledge proof is valid' },
    proof: {
      type: 'object',
      description: 'The verified ZK proof object',
      additionalProperties: true,
    },
  },
};

// Blockchain schemas
export const anchorDataBodySchema = {
  type: 'object',
  required: ['data'],
  properties: {
    data: { type: 'string', description: 'Data to anchor on blockchain' },
    network: {
      type: 'string',
      enum: [
        'stellar-testnet',
        'stellar-mainnet',
        'optimism',
        'optimism-sepolia',
        'arbitrum',
        'arbitrum-sepolia',
      ],
      description: 'Blockchain network to use',
    },
  },
};

export const anchorDataResponseSchema = {
  type: 'object',
  properties: {
    txHash: { type: 'string', description: 'Transaction hash' },
    network: { type: 'string', description: 'Blockchain network used' },
    dataHash: { type: 'string', description: 'Hash of the anchored data' },
    fee: { type: 'string', description: 'Transaction fee' },
  },
};

export const transactionInfoSchema = {
  type: 'object',
  properties: {
    txHash: { type: 'string', description: 'Transaction hash' },
    status: {
      type: 'string',
      enum: ['pending', 'confirmed', 'failed'],
      description: 'Transaction status',
    },
    network: { type: 'string', description: 'Blockchain network' },
    blockNumber: { type: 'number', description: 'Block number' },
    timestamp: { type: 'string', format: 'date-time', description: 'Transaction timestamp' },
    fee: { type: 'string', description: 'Transaction fee' },
  },
};

export const transactionHistoryResponseSchema = {
  type: 'object',
  properties: {
    transactions: {
      type: 'array',
      items: transactionInfoSchema,
      description: 'List of transactions',
    },
    total: { type: 'number', description: 'Total number of transactions' },
  },
};

export const verifyAnchorBodySchema = {
  type: 'object',
  required: ['txHash', 'data'],
  properties: {
    txHash: { type: 'string', description: 'Transaction hash to verify' },
    data: { type: 'string', description: 'Original data to verify against' },
    network: {
      type: 'string',
      enum: [
        'stellar-testnet',
        'stellar-mainnet',
        'optimism',
        'optimism-sepolia',
        'arbitrum',
        'arbitrum-sepolia',
      ],
      description: 'Blockchain network',
    },
  },
};

export const verifyAnchorResponseSchema = {
  type: 'object',
  properties: {
    valid: { type: 'boolean', description: 'Whether the data matches the anchored hash' },
    txHash: { type: 'string', description: 'Transaction hash' },
    network: { type: 'string', description: 'Blockchain network' },
    dataHash: { type: 'string', description: 'Hash of the data' },
  },
};

export const balanceResponseSchema = {
  type: 'object',
  properties: {
    balance: { type: 'string', description: 'Current balance' },
    network: { type: 'string', description: 'Blockchain network' },
    address: { type: 'string', description: 'Wallet address' },
  },
};

export const blockchainInfoResponseSchema = {
  type: 'object',
  properties: {
    networks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          network: { type: 'string', description: 'Network name' },
          status: { type: 'string', description: 'Network status' },
          balance: { type: 'string', description: 'Wallet balance' },
        },
      },
      description: 'Available blockchain networks',
    },
    defaultNetwork: { type: 'string', description: 'Default network for operations' },
  },
};
