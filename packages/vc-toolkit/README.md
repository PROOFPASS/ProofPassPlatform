# @proofpass/vc-toolkit

W3C Verifiable Credentials toolkit for creating, signing, and verifying digital credentials.

## Overview

This package provides a complete toolkit for working with [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/), implementing industry-standard cryptographic signing with Ed25519, DID (Decentralized Identifier) management, and credential verification.

**Key Features**:
- W3C Verifiable Credentials v1.1 compliant
- Ed25519 cryptographic signing (Ed25519Signature2020)
- DID methods support (did:key, did:web)
- Credential verification and validation
- Status List 2021 for credential revocation
- JWT-based credentials with did-jwt-vc
- Production-grade cryptography with @noble/ed25519

## Installation

```bash
npm install @proofpass/vc-toolkit
```

## Quick Start

### 1. Generate DID Keys

```typescript
import { generateDIDKeyPair } from '@proofpass/vc-toolkit';

// Generate a new Ed25519 key pair with DID
const keyPair = generateDIDKeyPair();

console.log('DID:', keyPair.did);
// Output: did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH

console.log('Public Key (base58):', keyPair.publicKeyBase58);
console.log('Private Key (base58):', keyPair.privateKeyBase58);
```

### 2. Create and Sign a Verifiable Credential

```typescript
import { issueVC, createCredential, generateDIDKeyPair } from '@proofpass/vc-toolkit';

// Generate issuer key pair
const issuerKeyPair = generateDIDKeyPair();

// Create credential
const credential = createCredential({
  issuerDID: issuerKeyPair.did,
  subjectDID: 'did:example:alice',
  credentialSubject: {
    degree: {
      type: 'BachelorDegree',
      name: 'Bachelor of Science in Computer Science'
    },
    university: 'MIT'
  },
  type: ['UniversityDegreeCredential'],
  expirationDate: '2025-12-31T23:59:59Z'
});

// Issue as signed JWT
const vcJwt = await issueVC({
  credential,
  issuerKeyPair,
  expiresInSeconds: 31536000 // 1 year
});

console.log('Signed VC JWT:', vcJwt);
```

### 3. Verify a Credential

```typescript
import { verifyVC } from '@proofpass/vc-toolkit';
import { Resolver } from 'did-resolver';
import { getResolver as getKeyResolver } from 'key-did-resolver';
import { getResolver as getWebResolver } from 'web-did-resolver';

// Setup DID resolver
const didResolver = new Resolver({
  ...getKeyResolver(),
  ...getWebResolver(),
});

// Verify the credential JWT
const result = await verifyVC(vcJwt, didResolver);

if (result.verified) {
  console.log('Credential is valid!');
  console.log('Issuer:', result.issuer);
  console.log('Subject:', result.credentialSubject);
} else {
  console.error('Verification failed:', result.error);
}
```

## Core Modules

### W3C Verifiable Credentials

#### Creating Credentials (Simple)

```typescript
import { createVerifiableCredential, signCredential } from '@proofpass/vc-toolkit';

const credential = createVerifiableCredential({
  issuerDID: 'did:web:proofpass.co',
  subject: {
    id: 'did:example:subject123',
    name: 'Alice Johnson',
    email: 'alice@example.com'
  },
  type: ['IdentityCredential'],
  expirationDate: '2026-01-01T00:00:00Z'
});

// Sign with private key (simplified - use Ed25519 for production)
const signedCredential = signCredential(credential, privateKey);
```

#### Creating Credentials (Production - Ed25519)

```typescript
import { signCredentialEd25519 } from '@proofpass/vc-toolkit';

const signedCredential = await signCredentialEd25519({
  credential,
  secretKey: privateKeyBytes, // Uint8Array or hex string
  verificationMethod: 'did:web:proofpass.co#key-1'
});

console.log('Proof type:', signedCredential.proof.type);
// Output: Ed25519Signature2020
```

#### Verifying Credentials

```typescript
import { verifyCredentialEd25519 } from '@proofpass/vc-toolkit';

const result = await verifyCredentialEd25519({
  credential: signedCredential,
  publicKey: publicKeyBytes // Optional: extracted from DID if not provided
});

if (result.verified) {
  console.log('Credential signature is valid');
} else {
  console.error('Invalid signature:', result.error);
}
```

### DID Key Management

#### Generate New Keys

```typescript
import { generateDIDKeyPair } from '@proofpass/vc-toolkit';

const keyPair = generateDIDKeyPair();

console.log({
  did: keyPair.did,                       // did:key:z6Mk...
  publicKey: keyPair.publicKey,           // Uint8Array
  privateKey: keyPair.privateKey,         // Uint8Array
  publicKeyBase58: keyPair.publicKeyBase58,
  privateKeyBase58: keyPair.privateKeyBase58
});
```

#### Import Existing Keys

```typescript
import { importDIDKeyPair } from '@proofpass/vc-toolkit';

// Import from hex private key
const keyPair = importDIDKeyPair('a1b2c3d4e5f6...');
```

#### Sign and Verify with Ed25519

```typescript
import { signWithEd25519, verifyEd25519 } from '@proofpass/vc-toolkit';

const data = new TextEncoder().encode('Hello, World!');
const signature = signWithEd25519(data, privateKey);
const isValid = verifyEd25519(signature, data, publicKey);
```

### DID Resolution

#### Resolve DID Documents

```typescript
import { resolveDID } from '@proofpass/vc-toolkit';

// Resolve a DID to its document
const didDocument = await resolveDID('did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH');

console.log('DID Document:', didDocument);
// Contains verification methods, authentication, etc.
```

### DID Methods

#### did:key Method

```typescript
import { createDIDKey, resolveDIDKey } from '@proofpass/vc-toolkit';

// Create a did:key from public key
const did = createDIDKey(publicKeyBytes);

// Resolve did:key to DID document
const didDoc = await resolveDIDKey(did);
```

#### did:web Method

```typescript
import { createDIDWeb, resolveDIDWeb } from '@proofpass/vc-toolkit';

// Create a did:web identifier
const did = createDIDWeb('proofpass.co', '/users/alice');
// Result: did:web:proofpass.co:users:alice

// Resolve did:web to DID document (fetches from HTTPS)
const didDoc = await resolveDIDWeb(did);
```

### Status List 2021 (Revocation)

```typescript
import {
  createStatusList,
  setCredentialStatus,
  checkCredentialStatus
} from '@proofpass/vc-toolkit';

// Create a new status list (bitstring for 100,000 credentials)
const statusList = createStatusList(100000);

// Revoke credential at index 42
setCredentialStatus(statusList, 42, true);

// Check if credential is revoked
const isRevoked = checkCredentialStatus(statusList, 42);
console.log('Is revoked:', isRevoked); // true

// Add status to credential
const credentialWithStatus = {
  ...credential,
  credentialStatus: {
    id: 'https://proofpass.co/status/1#42',
    type: 'StatusList2021Entry',
    statusPurpose: 'revocation',
    statusListIndex: '42',
    statusListCredential: 'https://proofpass.co/status/1'
  }
};
```

### JWT-based Credentials

#### Issue VC as JWT

```typescript
import { issueVC, generateDIDKeyPair } from '@proofpass/vc-toolkit';

const issuerKeyPair = generateDIDKeyPair();

const vcJwt = await issueVC({
  credential: {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'AlumniCredential'],
    issuer: issuerKeyPair.did,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: 'did:example:student123',
      alumniOf: 'MIT'
    }
  },
  issuerKeyPair,
  expiresInSeconds: 86400 // 24 hours
});
```

#### Parse VC JWT

```typescript
import { parseVCJWT } from '@proofpass/vc-toolkit';

const payload = parseVCJWT(vcJwt);
console.log('Issuer:', payload.iss);
console.log('Subject:', payload.sub);
console.log('Credential:', payload.vc);
```

#### Verify VC JWT

```typescript
import { verifyVC } from '@proofpass/vc-toolkit';

const result = await verifyVC(vcJwt, didResolver);

if (result.verified) {
  console.log('Valid credential');
  console.log('Claims:', result.claims);
} else {
  console.log('Invalid:', result.error);
}
```

### Extract Claims from Multiple VCs

```typescript
import { verifyVCs, extractClaims } from '@proofpass/vc-toolkit';

// Verify multiple credentials
const results = await verifyVCs([vcJwt1, vcJwt2, vcJwt3], didResolver);

// Extract all claims
const allClaims = extractClaims(results);
console.log('Combined claims:', allClaims);
```

### Check Expiration

```typescript
import { isExpired } from '@proofpass/vc-toolkit';

const expired = isExpired(payload);
if (expired) {
  console.log('Credential has expired');
}
```

## Hashing for Blockchain Anchoring

```typescript
import { hashCredentialForAnchor, hashCredential } from '@proofpass/vc-toolkit';

// Create SHA-256 hash of credential (canonical JSON)
const hash = hashCredentialForAnchor(signedCredential);
console.log('Credential hash:', hash);

// Use this hash for blockchain anchoring
// (e.g., store in Stellar transaction memo)
```

## Ed25519 Cryptography

This toolkit uses [@noble/ed25519](https://github.com/paulmillr/noble-ed25519) for production-grade Ed25519 operations:

```typescript
import * as ed25519Crypto from '@proofpass/vc-toolkit/ed25519-crypto';

// Generate keys
const secretKey = ed25519Crypto.generateSecretKey();
const publicKey = await ed25519Crypto.getPublicKey(secretKey);

// Sign data
const data = new TextEncoder().encode('Important message');
const signature = await ed25519Crypto.sign(data, secretKey);

// Verify signature
const isValid = await ed25519Crypto.verify(signature.signature, data, publicKey);

// Convert between formats
const secretKeyHex = ed25519Crypto.secretKeyToHex(secretKey);
const publicKeyHex = ed25519Crypto.publicKeyToHex(publicKey);
const did = ed25519Crypto.publicKeyToDID(publicKey);
```

## API Reference

### Credential Creation

| Function | Description |
|----------|-------------|
| `createVerifiableCredential(options)` | Create a W3C Verifiable Credential |
| `signCredential(credential, privateKey)` | Sign credential (simplified) |
| `signCredentialEd25519(options)` | Sign with Ed25519 (production) |
| `createCredential(params)` | Helper to create credential object |

### Credential Verification

| Function | Description |
|----------|-------------|
| `verifyCredentialEd25519(options)` | Verify Ed25519-signed credential |
| `verifyVC(vcJwt, resolver)` | Verify JWT credential |
| `verifyVCs(vcJwts, resolver)` | Verify multiple credentials |
| `isExpired(payload)` | Check if credential is expired |

### DID Key Management

| Function | Description |
|----------|-------------|
| `generateDIDKeyPair()` | Generate new Ed25519 DID key pair |
| `importDIDKeyPair(privateKeyHex)` | Import key pair from hex |
| `signWithEd25519(data, privateKey)` | Sign data with Ed25519 |
| `verifyEd25519(signature, data, publicKey)` | Verify Ed25519 signature |

### DID Resolution

| Function | Description |
|----------|-------------|
| `resolveDID(did)` | Resolve DID to DID document |
| `resolveDIDKey(did)` | Resolve did:key method |
| `resolveDIDWeb(did)` | Resolve did:web method |
| `createDIDKey(publicKey)` | Create did:key from public key |
| `createDIDWeb(domain, path)` | Create did:web identifier |

### Status List (Revocation)

| Function | Description |
|----------|-------------|
| `createStatusList(size)` | Create new status list bitstring |
| `setCredentialStatus(list, index, revoked)` | Set revocation status |
| `checkCredentialStatus(list, index)` | Check if credential is revoked |

### Utilities

| Function | Description |
|----------|-------------|
| `hashCredentialForAnchor(credential)` | SHA-256 hash for blockchain |
| `hashCredential(credential)` | Hash credential (simplified) |
| `parseVCJWT(vcJwt)` | Parse JWT to extract payload |
| `extractClaims(results)` | Extract claims from verification results |

## Type Definitions

This package uses types from `@proofpass/types`:

```typescript
import type {
  VerifiableCredential,
  CredentialSubject,
  Proof
} from '@proofpass/types';
```

See [`@proofpass/types`](../types/README.md) for complete type documentation.

## Production Setup

### Hosting DID Documents (did:web)

For production use of did:web, you need to host DID Documents at the correct URLs:

**Root DID**: `did:web:example.com`
→ Host at: `https://example.com/.well-known/did.json`

**Path DID**: `did:web:example.com:orgs:123`
→ Host at: `https://example.com/orgs/123/did.json`

#### Example Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    # Root DID
    location /.well-known/did.json {
        alias /var/www/dids/root.json;
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    # Organization DIDs
    location ~ ^/orgs/([^/]+)/did.json$ {
        alias /var/www/dids/orgs/$1.json;
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
    }
}
```

### Key Management

**⚠️ IMPORTANT**: Never hardcode private keys in your code!

Use environment variables or a Key Management Service (KMS):

```typescript
import { importDIDKeyPair } from '@proofpass/vc-toolkit';

// From environment variable
const privateKeyHex = process.env.ORG_PRIVATE_KEY;
const keyPair = importDIDKeyPair(privateKeyHex);

// Or use KMS (AWS, Google Cloud, HashiCorp Vault, etc.)
const privateKey = await kms.getPrivateKey('org-signing-key');
const keyPair = importDIDKeyPair(privateKey);
```

## Security Considerations

### Production Use

1. **Always use Ed25519 signing** (`signCredentialEd25519`) for production credentials
2. **Never expose private keys** - store securely in environment variables or key management systems
3. **Validate DIDs** before trusting credential issuers
4. **Check expiration dates** on all credentials
5. **Implement revocation checks** using Status List 2021
6. **Use HTTPS for did:web** resolution

### DID Trust

```typescript
// Verify issuer is trusted before accepting credentials
const trustedIssuers = [
  'did:web:proofpass.co',
  'did:web:university.edu',
  'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH'
];

if (!trustedIssuers.includes(credential.issuer)) {
  throw new Error('Untrusted issuer');
}
```

## Integration with Other Packages

### With @proofpass/blockchain

```typescript
import { signCredentialEd25519 } from '@proofpass/vc-toolkit';
import { anchorToStellar } from '@proofpass/blockchain';

// Create and sign credential
const signedCredential = await signCredentialEd25519({ credential, secretKey });

// Anchor to Stellar blockchain
const txHash = await anchorToStellar({
  data: signedCredential,
  network: 'testnet'
});

console.log('Anchored to Stellar:', txHash);
```

### With @proofpass/zk-toolkit

```typescript
import { createCredential, generateDIDKeyPair } from '@proofpass/vc-toolkit';
import { generateZKProof } from '@proofpass/zk-toolkit';

const credential = createCredential({ /* ... */ });

// Generate ZK proof for age verification without revealing birthdate
const zkProof = await generateZKProof({
  credential,
  statement: 'subject.age >= 18',
  publicInputs: ['subject.country']
});
```

### With @proofpass/client

```typescript
import { generateDIDKeyPair, issueVC } from '@proofpass/vc-toolkit';
import { ProofPassClient } from '@proofpass/client';

const client = new ProofPassClient({ apiKey: process.env.API_KEY });
const keyPair = generateDIDKeyPair();

// Issue credential locally
const vcJwt = await issueVC({ credential, issuerKeyPair: keyPair });

// Store on ProofPass platform
await client.credentials.create({
  credential: vcJwt,
  metadata: { issuer: keyPair.did }
});
```

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Building

```bash
# Build TypeScript to JavaScript
npm run build

# Clean build artifacts
npm run clean
```

## Standards Compliance

This toolkit implements the following W3C standards:

- [Verifiable Credentials Data Model v1.1](https://www.w3.org/TR/vc-data-model/)
- [Decentralized Identifiers (DIDs) v1.0](https://www.w3.org/TR/did-core/)
- [DID Method: key](https://w3c-ccg.github.io/did-method-key/)
- [DID Method: web](https://w3c-ccg.github.io/did-method-web/)
- [Ed25519 Signature 2020](https://w3c-ccg.github.io/lds-ed25519-2020/)
- [Status List 2021](https://w3c-ccg.github.io/vc-status-list-2021/)

## Dependencies

Key dependencies:
- `@noble/ed25519` - Secure Ed25519 implementation
- `@noble/hashes` - Cryptographic hash functions
- `did-jwt` - JWT for DIDs
- `did-jwt-vc` - W3C Verifiable Credentials with JWT
- `did-resolver` - Universal DID resolver
- `key-did-resolver` - did:key method resolver
- `web-did-resolver` - did:web method resolver

## License

LGPL-3.0

## Related Packages

- [`@proofpass/types`](../types/README.md) - Shared TypeScript types
- [`@proofpass/blockchain`](../blockchain/README.md) - Blockchain anchoring
- [`@proofpass/zk-toolkit`](../zk-toolkit/README.md) - Zero-knowledge proofs
- [`@proofpass/client`](../client/README.md) - API client

## Documentation

- [Main Documentation](../../docs/README.md)
- [W3C Verifiable Credentials Guide](../../docs/guides/verifiable-credentials.md)
- [API Reference](../../docs/api-reference.md)

## Support

- Repository: https://github.com/PROOFPASS/ProofPassPlatform
- Issues: https://github.com/PROOFPASS/ProofPassPlatform/issues
- Documentation: https://proofpass.github.io/ProofPassPlatform/
