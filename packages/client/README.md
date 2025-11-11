# @proofpass/client

Official JavaScript/TypeScript SDK for the ProofPass API.

## Overview

The ProofPass Client provides a simple, type-safe interface to interact with ProofPass Platform APIs. It handles authentication, error handling, and provides convenient methods for working with verifiable credentials, attestations, passports, and zero-knowledge proofs.

## Features

- 🔐 **API Key Authentication** - Automatic Bearer token handling
- 📦 **TypeScript Support** - Full type definitions included
- 🚀 **Promise-based** - Modern async/await API
- 🔄 **Automatic Retries** - Built-in error handling
- 📄 **Pagination** - Easy list operations with pagination
- ⚡ **Lightweight** - Minimal dependencies (only axios)

## Installation

```bash
npm install @proofpass/client
```

## Quick Start

### Initialize the Client

```typescript
import ProofPass from '@proofpass/client';

// Using API key only (uses default production endpoint)
const proofpass = new ProofPass('your-api-key-here');

// With custom configuration
const proofpass = new ProofPass({
  apiKey: 'your-api-key-here',
  baseURL: 'https://api.proofpass.com', // optional, defaults to production
  timeout: 30000, // optional, defaults to 30 seconds
});
```

### Get your API Key

1. Sign up at [https://platform.proofpass.com](https://platform.proofpass.com)
2. Go to Settings → API Keys
3. Click "Create API Key"
4. Copy your key and store it securely

**Security Note:** Never commit API keys to version control. Use environment variables:

```typescript
const proofpass = new ProofPass(process.env.PROOFPASS_API_KEY!);
```

## Usage

### Attestations

Create and manage verifiable attestations:

```typescript
// Create an attestation
const attestation = await proofpass.attestations.create({
  type: 'identity',
  subject: 'did:key:z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2rAXdN...',
  claims: {
    name: 'Alice Smith',
    email: 'alice@example.com',
    age: 25
  },
  expiresIn: 365 * 24 * 60 * 60, // 1 year in seconds
  metadata: {
    purpose: 'KYC verification'
  }
});

console.log(attestation.id); // att_1234567890
console.log(attestation.credential); // W3C Verifiable Credential

// Get an attestation
const att = await proofpass.attestations.get('att_1234567890');

// List attestations
const { data, pagination } = await proofpass.attestations.list({
  page: 1,
  limit: 10
});

// Revoke an attestation
await proofpass.attestations.revoke('att_1234567890');
```

### Product Passports

Create digital product passports on the blockchain:

```typescript
// Create a product passport
const passport = await proofpass.passports.create({
  productId: 'SKU-12345',
  metadata: {
    name: 'Organic Cotton T-Shirt',
    manufacturer: 'EcoWear Inc.',
    materials: ['100% Organic Cotton'],
    certifications: ['GOTS', 'Fair Trade'],
    origin: 'Portugal',
    carbonFootprint: '2.1 kg CO2e'
  },
  owner: 'did:key:z6Mkf...'
});

console.log(passport.blockchain?.txHash); // Blockchain transaction hash

// Get a passport
const pp = await proofpass.passports.get('ppt_1234567890');

// Verify a passport
const { valid, passport: verifiedPassport } = await proofpass.passports.verify('ppt_1234567890');

if (valid) {
  console.log('Passport is valid!', verifiedPassport.metadata);
}

// List passports
const { data } = await proofpass.passports.list({ page: 1, limit: 10 });
```

### Zero-Knowledge Proofs

Create selective disclosure proofs:

```typescript
// Create a ZK proof with selective disclosure
const proof = await proofpass.zkproofs.create({
  credentialId: 'att_1234567890',
  disclosureMap: {
    name: false,      // Don't reveal name
    email: false,     // Don't reveal email
    age: true,        // Reveal age
    over18: true      // Reveal over18 derived claim
  }
});

// Verify a proof
const { valid } = await proofpass.zkproofs.verify(proof.id);

console.log('Disclosed fields:', proof.disclosedFields); // ['age', 'over18']
```

### Credential Verification

Verify any W3C Verifiable Credential:

```typescript
const result = await proofpass.credentials.verify({
  credential: {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential"],
    "issuer": "did:key:z6Mkf...",
    "issuanceDate": "2024-01-01T00:00:00Z",
    "credentialSubject": {
      "id": "did:key:z6Mkf...",
      "name": "Alice"
    },
    "proof": { ... }
  },
  checkRevocation: true // Check revocation status
});

if (result.valid) {
  console.log('✓ Credential is valid');
  console.log('Issuer:', result.issuer);
  console.log('Subject:', result.subject);
  console.log('Issued at:', result.issuedAt);
} else {
  console.error('✗ Invalid credential:', result.errors);
}
```

## Error Handling

The SDK throws errors with detailed information:

```typescript
try {
  const attestation = await proofpass.attestations.get('invalid_id');
} catch (error) {
  console.error('Error:', error.message);
  console.error('Code:', error.code);
  console.error('Status:', error.status);
  console.error('Details:', error.details);
}
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import ProofPass, {
  Attestation,
  ProductPassport,
  ZKProof,
  ProofPassError
} from '@proofpass/client';

const proofpass = new ProofPass('your-api-key');

// Full type safety
const attestation: Attestation = await proofpass.attestations.create({
  type: 'identity',
  subject: 'did:key:z6Mkf...',
  claims: { name: 'Alice' }
});
```

## API Reference

### ProofPassConfig

Configuration interface for the ProofPass client.

```typescript
interface ProofPassConfig {
  apiKey: string;      // Required: Your ProofPass API key
  baseURL?: string;    // Optional: API base URL (default: 'https://api.proofpass.com')
  timeout?: number;    // Optional: Request timeout in ms (default: 30000)
}
```

### Error Handling

All errors implement the `ProofPassError` interface:

```typescript
interface ProofPassError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}
```

#### Common Error Codes

- `UNAUTHORIZED` (401) - Invalid or missing API key
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request parameters
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `NETWORK_ERROR` - Network connectivity issue
- `UNKNOWN_ERROR` - Unexpected error

## Best Practices

### 1. Environment Variables

Store API keys securely:

```typescript
// ✅ Good
const proofpass = new ProofPass(process.env.PROOFPASS_API_KEY!);

// ❌ Bad - hardcoded key
const proofpass = new ProofPass('pk_live_abc123...');
```

### 2. Error Handling

Always wrap API calls in try-catch:

```typescript
async function createAttestation() {
  try {
    const attestation = await proofpass.attestations.create({...});
    return attestation;
  } catch (error) {
    console.error('Failed to create attestation:', error);
    throw error;
  }
}
```

### 3. Pagination

Use pagination for large datasets:

```typescript
async function getAllAttestations() {
  let page = 1;
  const allAttestations = [];

  while (true) {
    const result = await proofpass.attestations.list({ page, limit: 100 });
    allAttestations.push(...result.data);

    if (page >= result.pagination.totalPages) break;
    page++;
  }

  return allAttestations;
}
```

## Framework Integration

### Express.js

```typescript
import express from 'express';
import ProofPass from '@proofpass/client';

const app = express();
const proofpass = new ProofPass(process.env.PROOFPASS_API_KEY!);

app.post('/api/verify-credential', async (req, res) => {
  try {
    const result = await proofpass.credentials.verify({
      credential: req.body.credential,
      checkRevocation: true,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
```

### Next.js API Route

```typescript
// pages/api/attestations/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import ProofPass from '@proofpass/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const proofpass = new ProofPass(process.env.PROOFPASS_API_KEY!);

  try {
    const attestation = await proofpass.attestations.create(req.body);
    res.status(201).json(attestation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
```

### React with React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import ProofPass from '@proofpass/client';

const proofpass = new ProofPass(process.env.REACT_APP_PROOFPASS_API_KEY!);

function AttestationsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['attestations'],
    queryFn: () => proofpass.attestations.list()
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {data?.data.map(att => (
        <li key={att.id}>{att.type} - {att.subject}</li>
      ))}
    </ul>
  );
}

function CreateAttestation() {
  const mutation = useMutation({
    mutationFn: (params) => proofpass.attestations.create(params)
  });

  return (
    <button onClick={() => mutation.mutate({
      type: 'identity',
      subject: 'did:key:...',
      claims: { name: 'Alice' }
    })}>
      Create Attestation
    </button>
  );
}
```

## TypeScript Types

The package includes full TypeScript definitions:

```typescript
import type {
  ProofPassConfig,
  ProofPassError,
  Attestation,
  CreateAttestationParams,
  ProductPassport,
  CreatePassportParams,
  ZKProof,
  CreateProofParams,
  VerifyCredentialParams,
  VerifyCredentialResult,
  PaginationParams,
  ListResponse,
} from '@proofpass/client';
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Related Packages

- `@proofpass/types` - TypeScript type definitions
- `@proofpass/vc-toolkit` - Verifiable Credentials utilities
- `@proofpass/zk-toolkit` - Zero-Knowledge Proofs
- `@proofpass/blockchain` - Blockchain integration

## License

LGPL-3.0

## Support

- **Documentation:** [https://docs.proofpass.com](https://docs.proofpass.com)
- **GitHub Issues:** [https://github.com/PROOFPASS/ProofPassPlatform/issues](https://github.com/PROOFPASS/ProofPassPlatform/issues)
- **Email:** fboiero@frvm.utn.edu.ar

## Links

- [ProofPass Platform](https://platform.proofpass.com)
- [API Documentation](https://docs.proofpass.com/api-reference)
- [GitHub Repository](https://github.com/PROOFPASS/ProofPassPlatform)
