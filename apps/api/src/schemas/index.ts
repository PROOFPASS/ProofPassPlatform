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
    blockchain_network: { type: 'string', enum: ['stellar', 'optimism'], description: 'Blockchain network used' },
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
      description: 'List of associated attestation IDs'
    },
    qr_code: { type: 'string', description: 'Base64-encoded QR code image' },
    created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
    updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
  },
};

export const zkProofSchema = {
  type: 'object',
  properties: {
    proof: { type: 'string', description: 'Zero-knowledge proof (hex-encoded)' },
    public_inputs: {
      type: 'array',
      items: { type: 'string' },
      description: 'Public inputs used in proof generation'
    },
    circuit_type: {
      type: 'string',
      enum: ['age', 'range', 'membership'],
      description: 'Type of ZK circuit used'
    },
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

// Request body schemas
export const registerBodySchema = {
  type: 'object',
  required: ['email', 'password', 'name'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address',
      example: 'user@example.com'
    },
    password: {
      type: 'string',
      minLength: 8,
      description: 'User password (min 8 characters)',
      example: 'SecurePass123!'
    },
    name: {
      type: 'string',
      minLength: 2,
      description: 'User full name',
      example: 'John Doe'
    },
    organization: {
      type: 'string',
      description: 'Organization name (optional)',
      example: 'ACME Corp'
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
      example: 'user@example.com'
    },
    password: {
      type: 'string',
      description: 'User password',
      example: 'SecurePass123!'
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
      example: 'did:example:123456789abcdefghi'
    },
    type: {
      type: 'string',
      description: 'Attestation type',
      example: 'ProductCertification'
    },
    claims: {
      type: 'object',
      description: 'Attestation claims',
      example: {
        certification: 'ISO 9001',
        issueDate: '2024-01-15',
        expiryDate: '2025-01-15'
      }
    },
    blockchain_network: {
      type: 'string',
      enum: ['stellar', 'optimism'],
      description: 'Blockchain network for anchoring (default: stellar)',
      example: 'stellar'
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
      example: 'SKU-12345'
    },
    product_name: {
      type: 'string',
      description: 'Product name',
      example: 'Organic Coffee Beans'
    },
    product_type: {
      type: 'string',
      description: 'Product category',
      example: 'Food & Beverage'
    },
    manufacturer: {
      type: 'string',
      description: 'Manufacturer name',
      example: 'Fair Trade Coffee Co.'
    },
    metadata: {
      type: 'object',
      description: 'Additional product information',
      example: {
        origin: 'Colombia',
        harvestDate: '2024-10-01',
        certifications: ['Organic', 'Fair Trade']
      }
    },
    attestation_ids: {
      type: 'array',
      items: { type: 'string', format: 'uuid' },
      description: 'Associated attestation IDs',
      example: ['550e8400-e29b-41d4-a716-446655440000']
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
      example: 'age'
    },
    inputs: {
      type: 'object',
      description: 'Circuit-specific inputs',
      example: {
        birthDate: '1990-01-01',
        minAge: 18
      }
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
      description: 'List of attestations'
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
    circuit_type: {
      type: 'string',
      enum: ['age', 'range', 'membership'],
      description: 'Type of circuit used'
    },
  },
};
