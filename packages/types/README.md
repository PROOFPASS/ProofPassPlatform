# @proofpass/types

Shared TypeScript type definitions for the ProofPass Platform.

## Overview

This package contains all shared TypeScript interfaces, types, and enums used across the ProofPass Platform monorepo. It provides type safety and consistency for:

- W3C Verifiable Credentials
- Digital Product Passports
- Attestations & Templates
- Blockchain Integration
- Zero-Knowledge Proofs
- User Management

## Installation

```bash
npm install @proofpass/types
```

## Usage

```typescript
import {
  VerifiableCredential,
  Attestation,
  ProductPassport,
  BlockchainNetwork,
  AttestationType
} from '@proofpass/types';

// Use types in your code
const credential: VerifiableCredential = {
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  id: 'credential-123',
  type: ['VerifiableCredential'],
  issuer: 'did:web:proofpass.co',
  issuanceDate: new Date().toISOString(),
  credentialSubject: {
    id: 'did:example:subject',
    claim: 'value'
  },
  proof: {
    type: 'Ed25519Signature2020',
    created: new Date().toISOString(),
    verificationMethod: 'did:web:proofpass.co#key-1',
    proofPurpose: 'assertionMethod',
    proofValue: 'base64-signature'
  }
};
```

## Type Categories

### Verifiable Credentials

W3C Verifiable Credential types compliant with [W3C VC Data Model v1.1](https://www.w3.org/TR/vc-data-model/):

- `VerifiableCredential` - Complete W3C credential structure
- `VerifiablePresentation` - W3C presentation format
- `Issuer` - Credential issuer information
- `CredentialSubject` - Subject claims (flexible schema)
- `Proof` - Cryptographic proof types (Ed25519Signature2020, JsonWebSignature2020)

**Example**:
```typescript
import { VerifiableCredential, Proof } from '@proofpass/types';

const proof: Proof = {
  type: 'Ed25519Signature2020',
  created: '2025-11-10T10:00:00Z',
  verificationMethod: 'did:web:proofpass.co#key-1',
  proofPurpose: 'assertionMethod',
  proofValue: 'z3MvGC...'
};
```

### Attestations

Industry attestation types for supply chain, compliance, and verification:

- `Attestation` - Complete attestation structure
- `AttestationStatus` - Status enum: `'pending' | 'anchored' | 'revoked'`
- `AttestationType` - Enum of common attestation types:
  - `QUALITY_TEST`
  - `CERTIFICATION`
  - `ORIGIN_VERIFICATION`
  - `CARBON_FOOTPRINT`
  - `BATTERY_PASSPORT`
  - `FOOD_SAFETY`
  - `PHARMA_COMPLIANCE`
  - `MANUFACTURING`
  - `SHIPPING`
  - `CUSTOMS_CLEARANCE`
- `AttestationTemplate` - Reusable attestation schemas
- `CreateAttestationDTO` - DTO for creating attestations

**Example**:
```typescript
import { Attestation, AttestationType, AttestationStatus } from '@proofpass/types';

const attestation: Attestation = {
  id: 'att-123',
  issuer_did: 'did:web:manufacturer.com',
  subject: 'product-456',
  type: AttestationType.QUALITY_TEST,
  claims: {
    testDate: '2025-11-10',
    passedTests: ['durability', 'safety'],
    certificationNumber: 'CERT-789'
  },
  issued_at: new Date(),
  credential: { /* W3C VC */ },
  blockchain_network: 'stellar',
  status: 'anchored',
  created_at: new Date(),
  updated_at: new Date(),
  user_id: 'user-123'
};
```

### Digital Passports

Product passport (Digital Product Passport - DPP) types:

- `ProductPassport` - Complete digital passport structure
- `CreateProductPassportDTO` - DTO for creating passports
- `PassportVerificationResult` - Verification result with attestation details

**Example**:
```typescript
import { ProductPassport, CreateProductPassportDTO } from '@proofpass/types';

const createPassportDTO: CreateProductPassportDTO = {
  product_id: 'product-456',
  name: 'Electric Vehicle Battery',
  description: 'High-capacity lithium-ion battery',
  attestation_ids: ['att-123', 'att-456'],
  blockchain_network: 'stellar'
};
```

### Blockchain Integration

Blockchain-related types for multi-chain support:

- `BlockchainNetwork` - Type: `'stellar' | 'optimism'`
- Blockchain transaction hash tracking
- Network-specific configuration types

**Example**:
```typescript
import { BlockchainNetwork } from '@proofpass/types';

function anchorToBlockchain(network: BlockchainNetwork, data: any) {
  if (network === 'stellar') {
    // Anchor to Stellar
  } else if (network === 'optimism') {
    // Anchor to Optimism
  }
}
```

### Zero-Knowledge Proofs

ZKP-related types for privacy-preserving verification:

- `ZKProof` - Zero-knowledge proof structure
- `ZKProofRequest` - Request parameters
- `ZKProofVerificationResult` - Verification result

### User Management

User and authentication types:

- `User` - User account information
- `UserRole` - Role-based access control
- `ApiKey` - API key structure

## Building

```bash
npm run build
```

This compiles TypeScript to JavaScript and generates type declaration files in `./dist`.

## Development

### Adding New Types

1. Create a new file in `src/` (e.g., `src/my-types.ts`)
2. Define your types/interfaces
3. Export from `src/index.ts`:
   ```typescript
   export * from './my-types';
   ```
4. Build the package: `npm run build`

### Type Safety Best Practices

- Use strict TypeScript configuration
- Prefer `interface` over `type` for object shapes
- Use enums for fixed sets of values
- Document complex types with JSDoc comments
- Export DTOs (Data Transfer Objects) for API operations

## License

LGPL-3.0

## Related Packages

- `@proofpass/vc-toolkit` - Uses these types for credential operations
- `@proofpass/blockchain` - Uses these types for blockchain anchoring
- `@proofpass/zk-toolkit` - Uses these types for ZKP generation
- `@proofpass/client` - Uses these types for API client

## Documentation

For complete platform documentation, see:
- [Main Documentation](../../docs/README.md)
- [API Reference](../../docs/api-reference.md)
- [Architecture Overview](../../docs/architecture/api-architecture.md)

## Support

- Repository: https://github.com/PROOFPASS/ProofPassPlatform
- Issues: https://github.com/PROOFPASS/ProofPassPlatform/issues
