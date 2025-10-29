# API Documentation - ProofPass Platform

## Overview

ProofPass provides a comprehensive RESTful API documented with **Swagger/OpenAPI 3.0**. All API endpoints are fully documented with request/response schemas, examples, and interactive testing capabilities.

---

## Accessing Swagger UI

### Local Development

Once you have the API server running locally:

1. **Start the API server:**
   ```bash
   cd apps/api
   npm run dev
   ```

2. **Access Swagger UI:**
   ```
   http://localhost:3000/docs
   ```

3. **Access OpenAPI JSON spec:**
   ```
   http://localhost:3000/documentation/json
   ```

### Production

In production, Swagger UI is available at:
```
https://your-domain.com/docs
```

---

## API Overview

### Base URL

- **Development:** `http://localhost:3000`
- **Production:** `https://api.proofpass.com` (configure in deployment)

### API Version

Current version: `v1`

All endpoints are prefixed with `/api/v1/` (except health checks).

### Authentication

ProofPass API supports two authentication methods:

#### 1. JWT Bearer Token (User Authentication)

```http
Authorization: Bearer <your_jwt_token>
```

**How to get a token:**
- Register: `POST /api/v1/auth/register`
- Login: `POST /api/v1/auth/login`

#### 2. API Key (Programmatic Access)

```http
X-API-Key: <your_api_key>
```

**How to get an API key:**
- Included in registration/login response
- View in user profile: `GET /api/v1/auth/me`

---

## API Tags

The API is organized into the following functional groups:

| Tag | Description | Endpoints |
|-----|-------------|-----------|
| **auth** | Authentication & user management | `/api/v1/auth/*` |
| **attestations** | W3C Verifiable Credentials | `/api/v1/attestations/*` |
| **passports** | Product Passports (aggregated attestations) | `/api/v1/passports/*` |
| **zkp** | Zero-Knowledge Proofs | `/api/v1/zkp/*` |
| **health** | Health & readiness checks | `/health`, `/ready` |

---

## Core Endpoints

### Authentication

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "organization": "ACME Corp"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "organization": "ACME Corp",
    "api_key": "pk_live_...",
    "created_at": "2024-10-28T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

---

### Attestations

#### Create Attestation
```http
POST /api/v1/attestations
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "did:example:123456789abcdefghi",
  "type": "ProductCertification",
  "claims": {
    "certification": "ISO 9001",
    "issueDate": "2024-01-15",
    "expiryDate": "2025-01-15"
  },
  "blockchain_network": "stellar"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "subject": "did:example:123456789abcdefghi",
  "type": "ProductCertification",
  "claims": {
    "certification": "ISO 9001",
    "issueDate": "2024-01-15",
    "expiryDate": "2025-01-15"
  },
  "issuer": "did:proofpass:issuer123",
  "blockchain_tx_hash": "ABC123...",
  "blockchain_network": "stellar",
  "created_at": "2024-10-28T10:00:00Z",
  "verifiable_credential": { ... }
}
```

#### Get All Attestations
```http
GET /api/v1/attestations
Authorization: Bearer <token>
```

#### Get Specific Attestation
```http
GET /api/v1/attestations/:id
Authorization: Bearer <token>
```

#### Verify Attestation (Public)
```http
POST /api/v1/attestations/:id/verify
```

**Response (200):**
```json
{
  "valid": true,
  "blockchain_verified": true,
  "signature_valid": true,
  "details": {
    "transaction_hash": "ABC123...",
    "block_number": 12345,
    "timestamp": "2024-10-28T10:00:00Z"
  }
}
```

---

### Product Passports

#### Create Product Passport
```http
POST /api/v1/passports
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": "SKU-12345",
  "name": "Organic Coffee Beans",
  "description": "Premium organic coffee from Colombia",
  "attestation_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ],
  "blockchain_network": "stellar"
}
```

**Response (201):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "product_id": "SKU-12345",
  "name": "Organic Coffee Beans",
  "description": "Premium organic coffee from Colombia",
  "attestation_ids": [...],
  "qr_code": "data:image/png;base64,...",
  "created_at": "2024-10-28T10:00:00Z"
}
```

#### Get Product Passport by ID (Public)
```http
GET /api/v1/passports/:id
```

#### Get Product Passport by Product ID (Public)
```http
GET /api/v1/passports/product/:productId
```

#### List User's Passports
```http
GET /api/v1/passports?limit=50&offset=0
Authorization: Bearer <token>
```

#### Verify Product Passport (Public)
```http
GET /api/v1/passports/:id/verify
```

#### Add Attestation to Passport
```http
POST /api/v1/passports/:id/attestations
Authorization: Bearer <token>
Content-Type: application/json

{
  "attestation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Zero-Knowledge Proofs

#### Generate ZK Proof
```http
POST /api/v1/zkp/proofs
Authorization: Bearer <token>
Content-Type: application/json

{
  "attestation_id": "550e8400-e29b-41d4-a716-446655440000",
  "circuit_type": "range",
  "private_inputs": {
    "value": 42,
    "salt": "random_salt_123"
  },
  "public_inputs": {
    "min": 0,
    "max": 100
  }
}
```

**Response (201):**
```json
{
  "proof": "0x1234567890abcdef...",
  "public_inputs": ["0", "100"],
  "circuit_type": "range"
}
```

#### Get ZK Proof by ID (Public)
```http
GET /api/v1/zkp/proofs/:id
```

#### List User's ZK Proofs
```http
GET /api/v1/zkp/proofs?limit=50&offset=0
Authorization: Bearer <token>
```

#### Verify ZK Proof (Public)
```http
GET /api/v1/zkp/proofs/:id/verify
```

**Response (200):**
```json
{
  "valid": true,
  "circuit_type": "range"
}
```

#### Get Proofs for Attestation
```http
GET /api/v1/attestations/:attestationId/proofs
```

---

### Health Checks

#### Basic Health Check
```http
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-10-28T10:00:00Z",
  "version": "0.1.0"
}
```

#### Readiness Check (with DB/Redis)
```http
GET /ready
```

**Response (200):**
```json
{
  "status": "ready",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2024-10-28T10:00:00Z"
}
```

---

## Rate Limiting

ProofPass implements multi-tier rate limiting to ensure fair usage and protect the API:

| Tier | Endpoints | Limit | Window |
|------|-----------|-------|--------|
| **Global** | All endpoints | 100 requests | 1 minute |
| **Auth** | `/api/v1/auth/*` | 5 requests | 15 minutes |
| **User** | Attestations, Passports | 60 requests | 1 minute |
| **Expensive** | ZKP operations | 10 requests | 1 minute |

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698480000
```

### Rate Limit Exceeded (429)

```json
{
  "error": "Too Many Requests",
  "details": "Rate limit exceeded. Please wait before retrying."
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "details": {
    "field": "Additional context"
  }
}
```

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| **200** | Success |
| **201** | Created |
| **400** | Bad Request (validation error) |
| **401** | Unauthorized (invalid/missing token) |
| **404** | Not Found |
| **429** | Too Many Requests (rate limit) |
| **500** | Internal Server Error |

---

## Security Headers

All API responses include comprehensive security headers:

```http
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## OpenAPI Specification

### Download OpenAPI JSON

```bash
curl http://localhost:3000/documentation/json > openapi.json
```

### Generate Client SDKs

Use the OpenAPI spec to generate client SDKs in any language:

```bash
# JavaScript/TypeScript
npx @openapitools/openapi-generator-cli generate \
  -i openapi.json \
  -g typescript-axios \
  -o ./client

# Python
openapi-generator generate \
  -i openapi.json \
  -g python \
  -o ./python-client

# Go
openapi-generator generate \
  -i openapi.json \
  -g go \
  -o ./go-client
```

---

## Interactive Testing with Swagger UI

Swagger UI provides an interactive interface to test all API endpoints:

1. **Navigate to `/docs`**
2. **Click "Authorize"** and enter your JWT token or API key
3. **Select an endpoint** from the list
4. **Click "Try it out"**
5. **Fill in parameters** and request body
6. **Click "Execute"** to see the response

### Example: Testing Authentication

1. Expand **auth** tag
2. Click on `POST /api/v1/auth/register`
3. Click **"Try it out"**
4. Fill in the request body:
   ```json
   {
     "email": "test@example.com",
     "password": "Test123456!",
     "name": "Test User"
   }
   ```
5. Click **"Execute"**
6. Copy the `token` from the response
7. Click **"Authorize"** at the top
8. Paste the token in the **bearerAuth** field
9. Now you can test authenticated endpoints!

---

## Schema Definitions

All request and response schemas are fully documented in Swagger UI under **Schemas** section:

- **User Schema** - User account structure
- **Attestation Schema** - W3C Verifiable Credential format
- **Passport Schema** - Product passport structure
- **ZK Proof Schema** - Zero-knowledge proof format
- **Verification Response** - Verification result structure
- **Error Schema** - Standard error format

---

## Best Practices

### 1. Always Use HTTPS in Production

```javascript
// ✅ Good
const apiUrl = 'https://api.proofpass.com';

// ❌ Bad (development only)
const apiUrl = 'http://api.proofpass.com';
```

### 2. Store Tokens Securely

```javascript
// ✅ Good - Use secure storage
localStorage.setItem('proofpass_token', token);

// ❌ Bad - Don't expose in URLs
fetch(`/api?token=${token}`);  // Never do this!
```

### 3. Handle Rate Limits Gracefully

```javascript
async function apiCall(url, options) {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return apiCall(url, options);  // Retry
  }

  return response.json();
}
```

### 4. Validate Inputs Client-Side

```javascript
// ✅ Good - Validate before sending
const email = input.value.trim();
if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
  throw new Error('Invalid email format');
}
```

### 5. Use Pagination for Lists

```javascript
// ✅ Good - Use limit/offset
const passports = await fetch('/api/v1/passports?limit=50&offset=0');

// ❌ Bad - Fetching all records
const allPassports = await fetch('/api/v1/passports');  // Could be huge!
```

---

## Support

### Questions?

- **Documentation:** [docs/README.md](../docs/README.md)
- **GitHub Issues:** https://github.com/PROOFPASS/ProofPassPlatform/issues
- **Email:** fboiero@frvm.utn.edu.ar

### Found a Bug?

Please report API bugs on GitHub with:
- Endpoint URL
- Request payload
- Expected vs actual response
- Swagger UI screenshot (if applicable)

---

**Last Updated:** October 28, 2024
**API Version:** 0.1.0
**OpenAPI Version:** 3.0.0
