# ProofPass Platform - API Architecture

**Version:** 1.0.0
**Last Updated:** November 9, 2024
**Author:** Federico Boiero <fboiero@frvm.utn.edu.ar>

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Layered Architecture](#layered-architecture)
5. [Core Components](#core-components)
6. [Data Flow](#data-flow)
7. [Security Architecture](#security-architecture)
8. [API Design](#api-design)
9. [Database Design](#database-design)
10. [Blockchain Integration](#blockchain-integration)
11. [Authentication & Authorization](#authentication--authorization)
12. [Error Handling](#error-handling)
13. [Testing Strategy](#testing-strategy)
14. [Performance & Scalability](#performance--scalability)
15. [Monitoring & Observability](#monitoring--observability)
16. [Deployment Architecture](#deployment-architecture)
17. [Development Workflow](#development-workflow)

---

## Executive Summary

ProofPass Platform is a production-grade, blockchain-anchored system for creating, managing, and verifying digital attestations, product passports, and verifiable credentials. The architecture follows industry best practices with a focus on security, scalability, and standards compliance.

### Key Architectural Principles

- **Security First:** Multi-layered security with defense in depth
- **Standards Compliance:** W3C Verifiable Credentials, OpenAPI 3.0, ISO 8601
- **Scalability:** Stateless design for horizontal scaling
- **Maintainability:** Clean architecture with separation of concerns
- **Observability:** Comprehensive logging and monitoring
- **Testability:** High test coverage (85%+) with unit, integration, and e2e tests

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  (Web Apps, Mobile Apps, Third-party Integrations)          │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS/REST API
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  CORS    │  │   Rate   │  │  Auth    │  │ Security │   │
│  │ Handling │  │ Limiting │  │ Middleware│ │ Headers  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 Application Layer (Fastify)                  │
│  ┌───────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Routes   │  │  Services  │  │ Validators │            │
│  │ (Handlers)│  │  (Logic)   │  │  (Schemas) │            │
│  └───────────┘  └────────────┘  └────────────┘            │
└──┬───────────┬──────────┬──────────┬─────────────────────┘
   │           │          │          │
   ▼           ▼          ▼          ▼
┌──────┐  ┌───────┐  ┌────────┐  ┌───────────┐
│ PostgreSQL │ Redis  │ W3C VC │  │  Stellar  │
│ Database│  Cache │ Toolkit │  │ Blockchain│
└──────┘  └───────┘  └────────┘  └───────────┘
```

### Component Interaction Flow

```
[Client Request]
     ↓
[Fastify Server] → [Request Validation]
     ↓
[Authentication Middleware] → [JWT/API Key Verification]
     ↓
[Rate Limiting] → [Check Request Limits]
     ↓
[Route Handler] → [Business Logic]
     ↓
[Service Layer] ─┬→ [Database Operations]
                 ├→ [Cache Operations]
                 ├→ [VC Generation]
                 └→ [Blockchain Anchoring]
     ↓
[Response Formatting] → [Security Headers]
     ↓
[Client Response]
```

---

## Technology Stack

### Backend Core

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **TypeScript** | 5+ | Type-safe development |
| **Fastify** | 4+ | High-performance web framework |
| **PostgreSQL** | 15+ | Primary data store |
| **Redis** | 7+ | Caching layer |

### Libraries & Frameworks

```typescript
{
  // Core Framework
  "fastify": "^4.24.3",
  "@fastify/cors": "^8.4.2",
  "@fastify/helmet": "^11.1.1",
  "@fastify/rate-limit": "^9.0.1",
  "@fastify/jwt": "^7.2.3",
  "@fastify/swagger": "^8.12.0",

  // Database & ORM
  "pg": "^8.11.3",
  "redis": "^4.6.10",

  // Validation & Schemas
  "zod": "^3.22.4",

  // Blockchain
  "stellar-sdk": "^11.1.0",

  // Security
  "bcrypt": "^5.1.1",
  "helmet": "^7.1.0",

  // Logging
  "pino": "^8.16.2",
  "pino-pretty": "^10.2.3",

  // Testing
  "jest": "^29.7.0",
  "ts-jest": "^29.1.1",
  "supertest": "^6.3.3"
}
```

### Blockchain Technology

- **Network:** Stellar (Mainnet/Testnet)
- **Protocol:** Stellar Core Protocol 19+
- **SDK:** Stellar SDK v11+
- **Transaction Type:** Custom attestation anchoring

### Standards Compliance

- **W3C Verifiable Credentials 1.1:** Digital credential format
- **OpenAPI 3.0:** API documentation standard
- **JSON Web Tokens (RFC 7519):** Authentication
- **ISO 8601:** Date/time representation
- **RESTful:** API design principles

---

## Layered Architecture

### 1. Presentation Layer

**Responsibility:** Handle HTTP requests and responses

```
apps/api/src/
├── routes/
│   ├── attestations/    # Attestation endpoints
│   ├── passports/       # Product passport endpoints
│   ├── auth/            # Authentication endpoints
│   ├── blockchain/      # Blockchain verification
│   └── health/          # Health check endpoints
```

**Key Files:**
- `routes/index.ts` - Route registration
- `routes/*/routes.ts` - Route definitions with handlers
- `middlewares/` - Request/response middleware

### 2. Business Logic Layer

**Responsibility:** Core business rules and domain logic

```
apps/api/src/
├── services/
│   ├── attestation.service.ts    # Attestation business logic
│   ├── passport.service.ts       # Product passport logic
│   ├── auth.service.ts           # Authentication logic
│   ├── blockchain.service.ts     # Blockchain interactions
│   └── zkproof.service.ts        # Zero-knowledge proofs
```

**Design Patterns:**
- Service Layer Pattern
- Dependency Injection
- Factory Pattern (for VC generation)
- Strategy Pattern (for blockchain networks)

### 3. Data Access Layer

**Responsibility:** Database and external service interactions

```
apps/api/src/
├── db/
│   ├── models/          # Database models
│   ├── migrations/      # Schema migrations
│   └── queries/         # SQL queries
├── cache/
│   └── redis.client.ts  # Redis operations
```

**Database Operations:**
- Parameterized queries (SQL injection prevention)
- Connection pooling
- Transaction management
- Migration versioning

### 4. Integration Layer

**Responsibility:** External service integrations

```
packages/
├── stellar-sdk/         # Stellar blockchain integration
├── vc-toolkit/          # W3C VC generation
├── qr-toolkit/          # QR code generation
└── zk-toolkit/          # Zero-knowledge proofs
```

---

## Core Components

### 1. Fastify Server (`apps/api/src/server.ts`)

```typescript
import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';

export async function createServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    },
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    trustProxy: true
  });

  // Security Headers
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });

  // CORS Configuration
  await server.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  });

  // Rate Limiting (4-tier system)
  await server.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    allowList: process.env.RATE_LIMIT_WHITELIST?.split(','),
    skipOnError: false
  });

  // JWT Authentication
  await server.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: {
      expiresIn: '24h',
      algorithm: 'HS256'
    }
  });

  // API Documentation
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'ProofPass API',
        description: 'Blockchain-anchored attestation and verification system',
        version: '1.0.0'
      },
      servers: [
        { url: 'http://localhost:3001', description: 'Development' },
        { url: 'https://api.proofpass.org', description: 'Production' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          apiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header'
          }
        }
      }
    }
  });

  return server;
}
```

### 2. Authentication Middleware

```typescript
// apps/api/src/middlewares/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticationMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Check JWT token
    if (request.headers.authorization) {
      const token = request.headers.authorization.replace('Bearer ', '');
      const decoded = await request.server.jwt.verify(token);
      request.user = decoded;
      return;
    }

    // Check API key
    if (request.headers['x-api-key']) {
      const apiKey = request.headers['x-api-key'] as string;
      const user = await validateApiKey(apiKey);
      if (user) {
        request.user = user;
        return;
      }
    }

    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Valid authentication required'
    });
  } catch (error) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}
```

### 3. Service Layer Example

```typescript
// apps/api/src/services/attestation.service.ts
import { db } from '../db/connection';
import { vcToolkit } from '@proofpass/vc-toolkit';
import { stellarService } from '@proofpass/stellar-sdk';
import { qrService } from '@proofpass/qr-toolkit';

export class AttestationService {
  async createAttestation(data: CreateAttestationDto): Promise<Attestation> {
    // 1. Validate input
    const validated = attestationSchema.parse(data);

    // 2. Generate W3C Verifiable Credential
    const vc = await vcToolkit.generateCredential({
      issuer: validated.issuerId,
      subject: validated.subject,
      claims: validated.claims,
      type: ['VerifiableCredential', 'AttestationCredential']
    });

    // 3. Anchor to Stellar blockchain
    const txHash = await stellarService.anchorAttestation({
      credentialHash: vc.hash,
      issuer: validated.issuerId
    });

    // 4. Generate QR code
    const qrCode = await qrService.generate({
      data: {
        id: vc.id,
        hash: vc.hash,
        verificationUrl: `https://verify.proofpass.org/${vc.id}`
      }
    });

    // 5. Store in database
    const attestation = await db.attestations.create({
      ...validated,
      vcId: vc.id,
      vcHash: vc.hash,
      blockchainTxHash: txHash,
      qrCode: qrCode,
      status: 'active'
    });

    // 6. Cache for fast retrieval
    await cache.set(`attestation:${attestation.id}`, attestation, 3600);

    return attestation;
  }

  async verifyAttestation(id: string): Promise<VerificationResult> {
    // 1. Retrieve attestation
    const attestation = await this.getAttestation(id);

    // 2. Verify blockchain anchor
    const blockchainValid = await stellarService.verifyTransaction(
      attestation.blockchainTxHash
    );

    // 3. Verify credential signature
    const credentialValid = await vcToolkit.verifyCredential(
      attestation.vcHash
    );

    // 4. Check revocation status
    const notRevoked = attestation.status === 'active';

    return {
      valid: blockchainValid && credentialValid && notRevoked,
      checks: {
        blockchain: blockchainValid,
        signature: credentialValid,
        notRevoked: notRevoked
      },
      attestation: attestation
    };
  }
}
```

---

## Data Flow

### 1. Create Attestation Flow

```
Client Request (POST /api/v1/attestations)
    ↓
[1] Request Validation (Zod schema)
    ↓
[2] Authentication Check (JWT/API Key)
    ↓
[3] Rate Limit Check (100 req/min)
    ↓
[4] Business Logic Execution
    ├─→ Generate W3C VC (vc-toolkit)
    ├─→ Anchor to Stellar (stellar-sdk)
    ├─→ Generate QR Code (qr-toolkit)
    └─→ Store in PostgreSQL
    ↓
[5] Cache Result (Redis, TTL 1h)
    ↓
[6] Return Response (201 Created)
```

### 2. Verify Attestation Flow

```
Client Request (GET /api/v1/attestations/:id/verify)
    ↓
[1] Check Cache (Redis)
    ├─→ Hit: Return cached result
    └─→ Miss: Continue
    ↓
[2] Retrieve Attestation (PostgreSQL)
    ↓
[3] Verify Blockchain Anchor (Stellar)
    ↓
[4] Verify VC Signature (crypto)
    ↓
[5] Check Revocation Status (DB)
    ↓
[6] Aggregate Results
    ↓
[7] Cache Verification Result (Redis, TTL 10min)
    ↓
[8] Return Response (200 OK)
```

### 3. Zero-Knowledge Proof Flow

```
Client Request (POST /api/v1/zkproofs/verify)
    ↓
[1] Parse ZK Proof Data
    ↓
[2] Identify Proof Type
    ├─→ Threshold Proof (value ≥ threshold)
    ├─→ Range Proof (min ≤ value ≤ max)
    └─→ Set Membership (value ∈ set)
    ↓
[3] Execute Verification Algorithm
    ├─→ No access to actual value
    └─→ Only verify mathematical proof
    ↓
[4] Return Boolean Result
    ↓
[5] Log Verification (audit trail)
```

---

## Security Architecture

### 1. Authentication Mechanisms

**JWT (JSON Web Tokens):**
```typescript
// Token Structure
{
  header: {
    alg: "HS256",
    typ: "JWT"
  },
  payload: {
    sub: "user-id-123",
    email: "user@example.com",
    role: "issuer",
    organizationId: "org-456",
    iat: 1699564800,
    exp: 1699651200  // 24 hours
  },
  signature: "HMACSHA256(...)"
}
```

**API Keys:**
- Format: `ppk_live_` or `ppk_test_` + 32 random bytes (hex)
- Stored: bcrypt hashed in database
- Rate limit: 1000 requests/hour per key
- Scopes: read, write, admin

### 2. Rate Limiting Strategy

**4-Tier Rate Limiting:**

```typescript
// Tier 1: Global (all requests)
{
  max: 100,
  timeWindow: '1 minute'
}

// Tier 2: Per-IP
{
  max: 50,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip
}

// Tier 3: Per-User (authenticated)
{
  max: 200,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.user?.id
}

// Tier 4: Per-Endpoint (critical operations)
{
  max: 10,
  timeWindow: '1 minute',
  routes: ['/api/v1/attestations', '/api/v1/passports']
}
```

### 3. Input Validation & Sanitization

```typescript
// Zod Schema Example
const createAttestationSchema = z.object({
  templateId: z.string().uuid(),
  subject: z.object({
    id: z.string().max(255),
    type: z.enum(['Product', 'Person', 'Organization'])
  }),
  claims: z.record(z.any()).refine(
    (claims) => Object.keys(claims).length > 0,
    { message: 'At least one claim required' }
  ),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.string()).optional()
});

// SQL Injection Prevention (Parameterized Queries)
const query = `
  SELECT * FROM attestations
  WHERE id = $1 AND organization_id = $2
`;
const result = await db.query(query, [attestationId, organizationId]);
```

### 4. Security Headers

```typescript
{
  "Content-Security-Policy": "default-src 'self'; script-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Cross-Origin-Embedder-Policy": "require-corp"
}
```

### 5. Encryption

**In Transit:**
- TLS 1.3 (enforced)
- HTTPS redirect (all HTTP → HTTPS)
- HSTS with preload

**At Rest:**
- Password hashing: bcrypt (10 rounds)
- Sensitive data: AES-256-GCM
- Database: PostgreSQL TDE (optional)

**Key Management:**
- Environment variables (non-production)
- HashiCorp Vault / OpenBao (production)
- Key rotation: 90 days

---

## API Design

### 1. RESTful Principles

**Resource Naming:**
```
/api/v1/attestations          # Collection
/api/v1/attestations/:id      # Resource
/api/v1/attestations/:id/verify  # Sub-resource action
```

**HTTP Methods:**
- GET: Retrieve resources (idempotent, cacheable)
- POST: Create new resources
- PUT: Full update (idempotent)
- PATCH: Partial update
- DELETE: Remove resources (idempotent)

### 2. Request/Response Format

**Request:**
```http
POST /api/v1/attestations HTTP/1.1
Host: api.proofpass.org
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "templateId": "550e8400-e29b-41d4-a716-446655440000",
  "subject": {
    "id": "PRODUCT-12345",
    "type": "Product"
  },
  "claims": {
    "certificationId": "CERT-2024-001",
    "issuer": "Acme Certification Corp",
    "certifiedDate": "2024-11-09T10:00:00Z",
    "standard": "ISO 9001:2015"
  }
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/v1/attestations/123e4567-e89b-12d3-a456-426614174000
X-Request-Id: req_abc123

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "templateId": "550e8400-e29b-41d4-a716-446655440000",
  "subject": {
    "id": "PRODUCT-12345",
    "type": "Product"
  },
  "claims": {
    "certificationId": "CERT-2024-001",
    "issuer": "Acme Certification Corp",
    "certifiedDate": "2024-11-09T10:00:00Z",
    "standard": "ISO 9001:2015"
  },
  "vcId": "urn:uuid:123e4567-e89b-12d3-a456-426614174000",
  "vcHash": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  "blockchainTxHash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "status": "active",
  "createdAt": "2024-11-09T10:05:30Z",
  "updatedAt": "2024-11-09T10:05:30Z"
}
```

### 3. Error Responses

**Standard Error Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "claims.certifiedDate",
        "message": "Invalid ISO 8601 date format"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2024-11-09T10:05:30Z"
  }
}
```

**HTTP Status Codes:**
- 200: OK (success)
- 201: Created (resource created)
- 204: No Content (success, no body)
- 400: Bad Request (validation error)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (duplicate resource)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error (server error)
- 503: Service Unavailable (maintenance mode)

### 4. Pagination

```
GET /api/v1/attestations?page=2&limit=50&sort=-createdAt
```

**Response:**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 1250,
    "totalPages": 25,
    "hasNext": true,
    "hasPrev": true
  },
  "links": {
    "self": "/api/v1/attestations?page=2&limit=50",
    "first": "/api/v1/attestations?page=1&limit=50",
    "prev": "/api/v1/attestations?page=1&limit=50",
    "next": "/api/v1/attestations?page=3&limit=50",
    "last": "/api/v1/attestations?page=25&limit=50"
  }
}
```

---

## Database Design

### 1. Schema Overview

```sql
-- Organizations (Multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Templates (Attestation Types)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schema JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Attestations
CREATE TABLE attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  template_id UUID REFERENCES templates(id),
  subject JSONB NOT NULL,
  claims JSONB NOT NULL,
  vc_id VARCHAR(255) UNIQUE NOT NULL,
  vc_hash VARCHAR(64) NOT NULL,
  blockchain_tx_hash VARCHAR(64),
  qr_code TEXT,
  status VARCHAR(50) DEFAULT 'active',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Product Passports
CREATE TABLE product_passports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  product_id VARCHAR(255) NOT NULL,
  attestation_ids UUID[] NOT NULL,
  metadata JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['read'],
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_attestations_org ON attestations(organization_id);
CREATE INDEX idx_attestations_template ON attestations(template_id);
CREATE INDEX idx_attestations_vc_id ON attestations(vc_id);
CREATE INDEX idx_attestations_status ON attestations(status);
CREATE INDEX idx_attestations_created ON attestations(created_at DESC);
```

### 2. Migrations

**Migration Strategy:**
- Sequential versioning (001, 002, 003, ...)
- Up/Down migrations for rollback
- Automated via CI/CD
- Zero-downtime deployments

**Example Migration:**
```sql
-- migrations/001_initial_schema.sql
BEGIN;

CREATE TABLE organizations ( ... );
CREATE TABLE users ( ... );
-- ...

COMMIT;
```

---

## Blockchain Integration

### 1. Stellar Network Configuration

```typescript
// packages/stellar-sdk/src/config.ts
export const stellarConfig = {
  network: process.env.STELLAR_NETWORK === 'mainnet'
    ? Networks.PUBLIC
    : Networks.TESTNET,
  horizonUrl: process.env.STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org',
  issuerKeypair: Keypair.fromSecret(
    process.env.STELLAR_ISSUER_SECRET!
  )
};
```

### 2. Anchoring Process

```typescript
async function anchorAttestation(data: AnchorData): Promise<string> {
  const server = new Server(stellarConfig.horizonUrl);

  // 1. Load issuer account
  const account = await server.loadAccount(
    stellarConfig.issuerKeypair.publicKey()
  );

  // 2. Build transaction
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: stellarConfig.network
  })
    .addOperation(
      Operation.manageData({
        name: `proofpass:${data.credentialHash.substring(0, 20)}`,
        value: Buffer.from(data.credentialHash, 'hex')
      })
    )
    .setTimeout(30)
    .build();

  // 3. Sign transaction
  transaction.sign(stellarConfig.issuerKeypair);

  // 4. Submit to network
  const result = await server.submitTransaction(transaction);

  // 5. Return transaction hash
  return result.hash;
}
```

### 3. Verification Process

```typescript
async function verifyBlockchainAnchor(txHash: string): Promise<boolean> {
  const server = new Server(stellarConfig.horizonUrl);

  try {
    // Retrieve transaction from blockchain
    const transaction = await server.transactions()
      .transaction(txHash)
      .call();

    // Verify transaction exists and succeeded
    return transaction.successful === true;
  } catch (error) {
    return false;
  }
}
```

---

## Authentication & Authorization

### 1. JWT Authentication

**Token Generation:**
```typescript
const token = server.jwt.sign({
  sub: user.id,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId
});
```

**Token Verification:**
```typescript
const decoded = await server.jwt.verify(token);
```

### 2. API Key Authentication

**Key Generation:**
```typescript
import crypto from 'crypto';
import bcrypt from 'bcrypt';

async function generateApiKey(): Promise<{ key: string; hash: string }> {
  const prefix = 'ppk_live_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const key = `${prefix}${randomBytes}`;
  const hash = await bcrypt.hash(key, 10);

  return { key, hash };
}
```

**Key Validation:**
```typescript
async function validateApiKey(key: string): Promise<User | null> {
  const apiKey = await db.apiKeys.findByKeyHash(key);
  if (!apiKey) return null;

  const valid = await bcrypt.compare(key, apiKey.key_hash);
  if (!valid) return null;

  // Update last used timestamp
  await db.apiKeys.updateLastUsed(apiKey.id);

  return apiKey.organization;
}
```

### 3. Role-Based Access Control (RBAC)

**Roles:**
- `admin`: Full system access
- `issuer`: Create/manage attestations
- `verifier`: Read-only, verification access
- `member`: Limited access

**Permission Check:**
```typescript
function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  };
}

// Usage
server.get('/api/v1/admin/users', {
  preHandler: [authMiddleware, requireRole(['admin'])]
}, async (request, reply) => {
  // Admin-only endpoint
});
```

---

## Error Handling

### 1. Centralized Error Handler

```typescript
// apps/api/src/errors/error-handler.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

export const errorHandler = (
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: request.id,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Log unexpected errors
  request.log.error(error);

  // Generic error response
  return reply.code(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId: request.id,
      timestamp: new Date().toISOString()
    }
  });
};
```

### 2. Custom Error Classes

```typescript
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}
```

---

## Testing Strategy

### 1. Test Pyramid

```
        ┌─────────┐
        │   E2E   │  (10%)  - Full system tests
        ├─────────┤
        │Integration│ (30%)  - API + DB tests
        ├─────────┤
        │  Unit   │  (60%)  - Service/utility tests
        └─────────┘
```

### 2. Unit Tests

```typescript
// apps/api/src/services/__tests__/attestation.service.test.ts
describe('AttestationService', () => {
  let service: AttestationService;

  beforeEach(() => {
    service = new AttestationService();
  });

  describe('createAttestation', () => {
    it('should create attestation with valid data', async () => {
      const input = {
        templateId: 'uuid-123',
        subject: { id: 'PRODUCT-1', type: 'Product' },
        claims: { cert: 'ISO-9001' }
      };

      const result = await service.createAttestation(input);

      expect(result.id).toBeDefined();
      expect(result.vcHash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.blockchainTxHash).toBeDefined();
    });

    it('should throw validation error for invalid data', async () => {
      const input = { invalidField: 'value' };

      await expect(
        service.createAttestation(input as any)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### 3. Integration Tests

```typescript
// apps/api/src/routes/__tests__/attestations.test.ts
describe('POST /api/v1/attestations', () => {
  let app: FastifyInstance;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestServer();
    authToken = await getTestAuthToken();
  });

  it('should create attestation', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/attestations',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        templateId: 'uuid-123',
        subject: { id: 'PRODUCT-1', type: 'Product' },
        claims: { cert: 'ISO-9001' }
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty('id');
  });
});
```

### 4. Coverage Requirements

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

---

## Performance & Scalability

### 1. Caching Strategy

**Redis Caching:**
```typescript
// Cache frequently accessed data
await cache.set(`attestation:${id}`, attestation, 3600); // 1 hour TTL

// Cache verification results
await cache.set(`verification:${id}`, result, 600); // 10 min TTL

// Invalidate on update
await cache.del(`attestation:${id}`);
```

### 2. Database Optimization

**Connection Pooling:**
```typescript
const pool = new Pool({
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

**Query Optimization:**
- Proper indexing on frequently queried columns
- EXPLAIN ANALYZE for slow queries
- Avoid N+1 queries with proper JOINs

### 3. Horizontal Scaling

**Stateless Design:**
- No server-side sessions
- JWT tokens (client-side state)
- Database for persistent state
- Redis for shared cache

**Load Balancing:**
```
        [Load Balancer]
             |
    ┌────────┼────────┐
    ▼        ▼        ▼
 [API-1]  [API-2]  [API-3]
    └────────┼────────┘
             ▼
       [PostgreSQL]
             ▼
         [Redis]
```

---

## Monitoring & Observability

### 1. Structured Logging

```typescript
// Pino Logger
logger.info({
  msg: 'Attestation created',
  attestationId: result.id,
  organizationId: user.organizationId,
  duration: Date.now() - startTime
});
```

### 2. Health Checks

```typescript
// Health endpoint
GET /health
{
  "status": "healthy",
  "timestamp": "2024-11-09T10:00:00Z",
  "uptime": 86400,
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "stellar": "healthy"
  }
}
```

### 3. Metrics

**Key Metrics:**
- Request rate (req/s)
- Error rate (errors/min)
- Response time (p50, p95, p99)
- Database connection pool usage
- Cache hit ratio

---

## Deployment Architecture

### 1. Docker Containers

```dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/apps/api/src/index.js"]
```

### 2. Environment Configuration

```bash
# Production Environment Variables
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@db:5432/proofpass
REDIS_URL=redis://redis:6379
JWT_SECRET=<secure-secret>
STELLAR_NETWORK=mainnet
STELLAR_ISSUER_SECRET=<encrypted>
LOG_LEVEL=info
ALLOWED_ORIGINS=https://app.proofpass.org
```

---

## Development Workflow

### 1. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### 2. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
```

---

**Document Version:** 1.0.0
**Last Updated:** November 9, 2024
**Author:** Federico Boiero <fboiero@frvm.utn.edu.ar>

**ProofPass Platform** - A Digital Public Good for Trust and Transparency
