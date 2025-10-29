# API Architecture - ProofPass Platform

**Version:** 1.0.0
**Last Updated:** October 28, 2024
**Status:** Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Request Lifecycle](#request-lifecycle)
4. [Module Structure](#module-structure)
5. [Middleware Stack](#middleware-stack)
6. [Data Flow](#data-flow)
7. [Technology Stack](#technology-stack)
8. [Scaling Considerations](#scaling-considerations)

---

## System Overview

ProofPass is a blockchain-based platform for creating, managing, and verifying digital attestations and zero-knowledge proofs. The system follows a modern, layered architecture with clear separation of concerns.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│              (Web, Mobile, Third-party APIs)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS (REST API)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                     │
│              SSL Termination, Rate Limiting                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│   API Server 1   │      │   API Server N   │
│  (Node.js/Fastify)│     │  (Node.js/Fastify)│
└─────────┬────────┘      └─────────┬────────┘
          │                         │
          └────────────┬────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
┌──────────┐    ┌──────────┐   ┌──────────┐
│PostgreSQL│    │  Redis   │   │  Stellar │
│ Database │    │  Cache   │   │Blockchain│
└──────────┘    └──────────┘   └──────────┘
```

### Core Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **API Server** | Node.js 18 + Fastify | RESTful API, business logic |
| **Database** | PostgreSQL 15 | Persistent data storage |
| **Cache** | Redis 7 | Session management, rate limiting |
| **Blockchain** | Stellar | Immutable attestation anchoring |
| **Documentation** | Swagger/OpenAPI | Interactive API docs |

---

## Architecture Patterns

### 1. Layered Architecture

The application follows a strict layered architecture:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │  HTTP Routes
│  (REST endpoints, input validation)     │  apps/api/src/modules/*/routes.ts
├─────────────────────────────────────────┤
│         Business Logic Layer            │  Service Functions
│  (attestations, passports, ZKP)         │  apps/api/src/modules/*/service.ts
├─────────────────────────────────────────┤
│         Data Access Layer               │  SQL Queries
│  (database queries, models)             │  apps/api/src/config/database.ts
├─────────────────────────────────────────┤
│         Infrastructure Layer            │  External Services
│  (Redis, Stellar, VC toolkit)           │  packages/*
└─────────────────────────────────────────┘
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Easy to test each layer independently
- ✅ Changes to one layer don't affect others
- ✅ Facilitates team collaboration

### 2. Monorepo with Workspaces

```
ProofPassPlatform/
├── apps/
│   └── api/                    # Main API application
│       ├── src/
│       │   ├── config/         # Configuration
│       │   ├── middleware/     # Custom middleware
│       │   └── modules/        # Feature modules
│       └── __tests__/          # Tests
│
├── packages/                   # Shared libraries
│   ├── types/                  # TypeScript type definitions
│   ├── vc-toolkit/             # Verifiable Credentials
│   ├── zk-toolkit/             # Zero-Knowledge Proofs
│   └── stellar-sdk/            # Blockchain client
│
└── package.json                # Workspace configuration
```

**Benefits:**
- ✅ Code reusability across projects
- ✅ Consistent versioning
- ✅ Simplified dependency management
- ✅ Easy to create new applications (web, mobile)

### 3. Dependency Injection

Services receive dependencies as parameters:

```typescript
// ✅ GOOD: Dependencies injected
export async function createAttestation(
  data: CreateAttestationDTO,
  userId: string,
  stellarClient: StellarClient  // Injected
): Promise<Attestation> {
  // ...
}

// ❌ BAD: Direct dependency
import { stellarClient } from '../config/stellar';
export async function createAttestation(/* ... */) {
  const tx = await stellarClient.anchorData(/* ... */);
}
```

**Benefits:**
- ✅ Easy to test (mock dependencies)
- ✅ Flexible configuration
- ✅ Loose coupling

---

## Request Lifecycle

Understanding how a request flows through the system:

### 1. Incoming Request

```typescript
POST /api/v1/attestations
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "certification",
  "claims": {
    "certificationId": "CERT-12345",
    "issuedBy": "Acme Corp"
  }
}
```

### 2. Middleware Processing

```
┌──────────────────────────────────────────────────┐
│  1. Request ID Generation                        │
│     → Assigns unique ID: req_1698456789_abc123   │
├──────────────────────────────────────────────────┤
│  2. Security Headers                             │
│     → Adds X-Frame-Options, CSP, etc.            │
├──────────────────────────────────────────────────┤
│  3. Request Size Limiting                        │
│     → Checks Content-Length < 10MB               │
├──────────────────────────────────────────────────┤
│  4. Content-Type Validation                      │
│     → Ensures application/json                   │
├──────────────────────────────────────────────────┤
│  5. CORS Check                                   │
│     → Validates origin                           │
├──────────────────────────────────────────────────┤
│  6. Helmet Security                              │
│     → Additional HTTP header security            │
├──────────────────────────────────────────────────┤
│  7. Rate Limiting                                │
│     → Checks Redis: rl:user:<userId>             │
│     → Increments counter if under limit          │
├──────────────────────────────────────────────────┤
│  8. JWT Authentication                           │
│     → Verifies token signature                   │
│     → Decodes user info (id, email)              │
├──────────────────────────────────────────────────┤
│  9. Input Sanitization                           │
│     → Removes XSS patterns                       │
│     → Detects SQL injection attempts             │
├──────────────────────────────────────────────────┤
│  10. Zod Schema Validation                       │
│     → Validates request body structure           │
│     → Type-checks all fields                     │
└──────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│              Route Handler                       │
│  POST /api/v1/attestations                       │
└──────────────────────────────────────────────────┘
```

### 3. Business Logic Execution

```typescript
// Route handler delegates to service
const attestation = await createAttestation(
  validatedData,
  request.user.id
);
```

**Service Layer** (`apps/api/src/modules/attestations/service.ts`):
1. Create Verifiable Credential
2. Anchor to Stellar blockchain
3. Store in PostgreSQL
4. Cache in Redis (optional)
5. Return attestation object

### 4. Response Formation

```typescript
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "certification",
  "claims": { /* ... */ },
  "credential": { /* W3C VC */ },
  "blockchain_tx_hash": "abc123...",
  "status": "anchored",
  "created_at": "2024-10-28T12:00:00Z"
}

Headers:
X-Request-ID: req_1698456789_abc123
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1698456849000
```

---

## Module Structure

Each feature follows a consistent module structure:

### Example: Attestations Module

```
apps/api/src/modules/attestations/
├── routes.ts                 # HTTP endpoints
├── service.ts                # Business logic
└── schemas.ts                # Zod validation schemas
```

### Route Layer (`routes.ts`)

**Responsibilities:**
- Define HTTP endpoints
- Parse request parameters
- Validate input with Zod
- Call service layer
- Format response
- Handle HTTP-specific concerns

```typescript
export async function attestationRoutes(
  server: FastifyInstance
): Promise<void> {
  // POST /attestations
  server.post<{ Body: CreateAttestationDTO }>(
    '/attestations',
    {
      onRequest: [server.authenticate],  // Auth middleware
      schema: {
        body: CreateAttestationSchema,   // Validation
      },
    },
    async (request, reply) => {
      const attestation = await createAttestation(
        request.body,
        request.user.id
      );
      reply.code(201).send(attestation);
    }
  );
}
```

### Service Layer (`service.ts`)

**Responsibilities:**
- Implement business logic
- Coordinate between components
- Handle transactions
- Perform validations
- Return domain objects

```typescript
export async function createAttestation(
  data: CreateAttestationDTO,
  userId: string
): Promise<Attestation> {
  // 1. Business logic validation
  if (data.type === 'certification' && !data.claims.certificationId) {
    throw new ValidationError('Certification ID required');
  }

  // 2. Create Verifiable Credential
  const credential = createVerifiableCredential({
    issuerDID: `did:proofpass:${userId}`,
    subject: data.claims,
    type: ['VerifiableCredential', data.type],
  });

  // 3. Anchor to blockchain
  const stellarClient = new StellarClient(/* config */);
  const credentialHash = hashCredential(credential);
  const tx = await stellarClient.anchorData(credentialHash);

  // 4. Store in database
  const result = await query(
    `INSERT INTO attestations (...) VALUES (...) RETURNING *`,
    [/* params */]
  );

  // 5. Return attestation
  return result.rows[0];
}
```

### Schema Layer (`schemas.ts`)

**Responsibilities:**
- Define input/output types
- Validation rules
- Type safety

```typescript
import { z } from 'zod';

export const CreateAttestationSchema = z.object({
  type: z.enum(['identity', 'certification', 'proof_of_ownership']),
  claims: z.record(z.any()),
  subject_did: z.string().optional(),
});

export type CreateAttestationDTO = z.infer<typeof CreateAttestationSchema>;
```

---

## Middleware Stack

### Execution Order

Middleware executes in this specific order:

```typescript
1. onRequest         → Security headers, request ID
2. preParsing        → (not used)
3. preValidation     → Request size, content-type
4. preHandler        → Input sanitization, rate limiting
5. handler           → Route handler (business logic)
6. preSerialization  → (not used)
7. onSend            → (not used)
8. onResponse        → Logging
9. onError           → Error handler
```

### Custom Middleware

**Security Middleware** (`apps/api/src/middleware/security.ts`):
- `addSecurityHeaders` - HTTP security headers
- `requestSizeLimiter` - 10MB request limit
- `validateContentType` - JSON content validation
- `requestSanitizer` - XSS and SQL injection prevention

**Rate Limiting** (`apps/api/src/middleware/rate-limit.ts`):
- `rateLimiters.global` - 100 req/min (all requests)
- `rateLimiters.auth` - 5 req/15min (authentication)
- `rateLimiters.user` - 60 req/min (standard operations)
- `rateLimiters.expensive` - 10 req/min (ZK proofs, blockchain)

**Error Handler** (`apps/api/src/middleware/error-handler.ts`):
- Centralized error handling
- Custom error classes
- Structured error responses
- Security-conscious error messages

---

## Data Flow

### Creating an Attestation

```
┌─────────┐
│ Client  │
└────┬────┘
     │ POST /api/v1/attestations
     │ { type, claims }
     ▼
┌─────────────┐
│  Fastify    │ Middleware: Auth, Validation, Sanitization
│   Routes    │
└──────┬──────┘
       │ createAttestation(data, userId)
       ▼
┌─────────────┐
│  Service    │ 1. Create VC with vc-toolkit
│   Layer     │ 2. Hash credential
└──────┬──────┘ 3. Anchor to Stellar
       │        4. Store in PostgreSQL
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│  vc-toolkit │    │   Stellar   │
│             │    │  Blockchain │
│ Generate VC │    │  Anchor TX  │
│ Hash VC     │    │             │
└─────────────┘    └──────┬──────┘
                          │ tx_hash
                          ▼
                   ┌─────────────┐
                   │ PostgreSQL  │
                   │             │
                   │ INSERT INTO │
                   │ attestations│
                   └──────┬──────┘
                          │ Attestation object
                          ▼
                   ┌─────────────┐
                   │   Client    │
                   │  Response   │
                   └─────────────┘
```

### Verifying an Attestation

```
┌─────────┐
│ Client  │
└────┬────┘
     │ GET /api/v1/attestations/:id/verify
     ▼
┌─────────────┐
│   Routes    │
└──────┬──────┘
       │ verifyAttestation(id)
       ▼
┌─────────────┐
│  Service    │ 1. Fetch from PostgreSQL
│   Layer     │ 2. Verify VC signature
└──────┬──────┘ 3. Check blockchain
       │        4. Validate not expired
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│  vc-toolkit │    │   Stellar   │
│             │    │  Blockchain │
│ Verify VC   │    │  Verify TX  │
│ Check sig   │    │             │
└─────────────┘    └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Client    │
                   │  {valid:true}│
                   └─────────────┘
```

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18.18.0 | Runtime environment |
| **TypeScript** | 5.2+ | Type-safe JavaScript |
| **Fastify** | 4.24+ | Web framework |
| **PostgreSQL** | 15+ | Relational database |
| **Redis** | 7+ | Caching & sessions |
| **Stellar SDK** | 11+ | Blockchain integration |

### Libraries & Tools

| Library | Purpose |
|---------|---------|
| **Zod** | Runtime type validation |
| **Bcrypt** | Password hashing |
| **JWT** | Token authentication |
| **Pino** | Structured logging |
| **Jest** | Unit & integration testing |
| **Docker** | Containerization |

### Why These Technologies?

**Fastify over Express:**
- ✅ 2-3x faster performance
- ✅ Built-in schema validation
- ✅ Better TypeScript support
- ✅ Plugin architecture

**PostgreSQL over MongoDB:**
- ✅ ACID transactions
- ✅ Strong consistency
- ✅ Complex queries (JOINs)
- ✅ Data integrity constraints

**Redis over Memcached:**
- ✅ Data persistence
- ✅ Advanced data structures
- ✅ Pub/Sub support
- ✅ Built-in expiration

**Stellar over Ethereum:**
- ✅ Low transaction fees ($0.00001)
- ✅ Fast confirmation (3-5 seconds)
- ✅ Built-in assets
- ✅ Compliance-friendly

---

## Scaling Considerations

### Horizontal Scaling

**Current Architecture Supports:**
- ✅ Stateless API servers
- ✅ Session storage in Redis (shared)
- ✅ Database connection pooling
- ✅ Load balancer ready

**Scaling Path:**
```
Single Server → Multiple Servers → Kubernetes Cluster
```

### Database Scaling

**Read Replicas:**
```sql
-- Write to primary
INSERT INTO attestations (...) VALUES (...);

-- Read from replica
SELECT * FROM attestations WHERE user_id = $1;
```

**Connection Pooling:**
```typescript
const pool = new Pool({
  max: 20,              // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Caching Strategy

**1. Cache-Aside Pattern:**
```typescript
// Try cache first
let attestation = await getCache(`attestation:${id}`);

if (!attestation) {
  // Cache miss: fetch from DB
  attestation = await query('SELECT * FROM attestations WHERE id = $1', [id]);

  // Store in cache (1 hour TTL)
  await setCache(`attestation:${id}`, attestation, 3600);
}

return attestation;
```

**2. Cache Invalidation:**
```typescript
// Update attestation
await query('UPDATE attestations SET status = $1 WHERE id = $2', ['verified', id]);

// Invalidate cache
await deleteCache(`attestation:${id}`);
```

### Rate Limiting at Scale

**Redis Lua Script** (atomic operations):
```lua
local current = redis.call('GET', KEYS[1])
if current and tonumber(current) >= tonumber(ARGV[1]) then
  return 0
end
redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], ARGV[2])
return 1
```

### Monitoring & Observability

**Metrics to Track:**
- Request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- Database connection pool usage
- Redis cache hit rate
- Stellar transaction success rate

**Recommended Tools:**
- Prometheus (metrics collection)
- Grafana (visualization)
- ELK Stack (log aggregation)
- Sentry (error tracking)

---

## API Versioning

### URL-based Versioning

```
/api/v1/attestations    ← Current version
/api/v2/attestations    ← Future version
```

**Benefits:**
- ✅ Clear and explicit
- ✅ Easy to route
- ✅ Supports multiple versions simultaneously

### Breaking Changes Policy

**Major Version (v1 → v2):**
- Removing endpoints
- Changing response structure
- Renaming fields

**Minor Changes (backward compatible):**
- Adding new endpoints
- Adding optional fields
- Deprecating fields (with warning)

**Deprecation Process:**
1. Announce deprecation (3 months notice)
2. Add `X-Deprecated` header to responses
3. Update documentation
4. Remove in next major version

---

## Error Handling Strategy

### Error Response Format

```json
{
  "error": "ValidationError",
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "path": "claims.email",
      "message": "Invalid email format"
    }
  ],
  "requestId": "req_1698456789_abc123",
  "timestamp": "2024-10-28T12:00:00Z"
}
```

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Valid auth, insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Maintenance mode |

---

## Testing Strategy

### Test Pyramid

```
         ┌────────┐
         │  E2E   │  ← 10% (Full system tests)
         └────────┘
       ┌───────────┐
       │Integration│  ← 30% (API routes, multiple units)
       └───────────┘
     ┌──────────────┐
     │     Unit     │  ← 60% (Functions, pure logic)
     └──────────────┘
```

### Coverage Targets

- **Overall:** 85%+
- **Business logic (services):** 90%+
- **Routes:** 85%+
- **Utilities:** 95%+

### Test Organization

```
apps/api/__tests__/
├── unit/                    # Unit tests
│   └── auth.test.ts
├── integration/             # Integration tests
│   ├── auth.integration.test.ts
│   ├── passports.integration.test.ts
│   └── zkp.integration.test.ts
└── helpers/                 # Test utilities
    ├── factories.ts         # Test data factories
    ├── db-helpers.ts        # Database helpers
    └── setup.ts             # Test setup
```

---

## Documentation

### API Documentation

**Swagger/OpenAPI:** Available at `/docs`
- Interactive API explorer
- Request/response examples
- Authentication testing
- Schema definitions

### Code Documentation

**JSDoc Comments:**
```typescript
/**
 * Creates a new attestation and anchors it to the blockchain
 *
 * @param data - Attestation data (type, claims)
 * @param userId - ID of the user creating the attestation
 * @returns The created attestation with blockchain transaction hash
 * @throws {ValidationError} If attestation data is invalid
 * @throws {InternalError} If blockchain anchoring fails
 */
export async function createAttestation(
  data: CreateAttestationDTO,
  userId: string
): Promise<Attestation> {
  // ...
}
```

---

## Future Enhancements

### Phase 5 Roadmap

1. **WebSocket Support** - Real-time attestation updates
2. **GraphQL API** - Alternative to REST for complex queries
3. **Event Sourcing** - Audit trail for all operations
4. **Microservices** - Split into specialized services
5. **Machine Learning** - Fraud detection, anomaly detection

---

**Document Version:** 1.0.0
**Author:** fboiero <fboiero@frvm.utn.edu.ar>
**Last Updated:** October 28, 2024
