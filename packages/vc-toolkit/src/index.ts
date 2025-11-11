// Original modules (deprecated - use Ed25519 versions for production)
export * from './vc-generator';
export * from './vc-verifier';
export * from './did';

// Production-grade Ed25519 signing
export * from './ed25519-crypto';
export * from './vc-signer-ed25519';

// Status List 2021 (Revocation)
export * from './status-list';

// DID Key Management (Ed25519)
export * from './did-keys';

// DID Resolution
export * from './did-resolver';

// DID Methods (W3C standards-based)
export * from './did/did-key';
export * from './did/did-web';

// Verifiable Credentials (W3C standards-based with did-jwt-vc)
export {
  issueVC,
  createCredential,
  parseVCJWT,
  type VerifiableCredential,
  type IssueVCOptions,
} from './vc/vc-issuer';

export {
  verifyVC,
  verifyVCs,
  isExpired,
  extractClaims,
  type VerificationResult as VCVerificationResult,
} from './vc/vc-verifier-jwt';
