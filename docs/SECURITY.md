# Security Best Practices - ProofPass Platform

**Last Updated:** October 28, 2024
**Version:** 1.0.0
**Status:** Production Ready

---

## Table of Contents

1. [Security Architecture Overview](#security-architecture-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [Security Headers](#security-headers)
7. [Database Security](#database-security)
8. [API Key Management](#api-key-management)
9. [Logging & Monitoring](#logging--monitoring)
10. [Deployment Security](#deployment-security)
11. [Vulnerability Response](#vulnerability-response)

---

## Security Architecture Overview

ProofPass implements a defense-in-depth security strategy with multiple layers of protection:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Network Security (HTTPS, CORS, Rate Limiting)     │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Input Validation (Zod Schemas, Sanitization)      │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Authentication (JWT, API Keys)                    │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Authorization (Resource Ownership)                │
├─────────────────────────────────────────────────────────────┤
│  Layer 5: Business Logic (Service Layer)                    │
├─────────────────────────────────────────────────────────────┤
│  Layer 6: Data Access (Parameterized Queries)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL + Redis + Stellar                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Security Features

- **Defense in Depth:** Multiple security layers
- **Fail Secure:** Errors default to deny access
- **Least Privilege:** Users only access their resources
- **Input Validation:** All inputs validated and sanitized
- **Rate Limiting:** Multi-tier protection against abuse
- **Audit Logging:** All security events logged
- **Secure Defaults:** Security-first configuration

---

## Authentication & Authorization

### JWT Token Authentication

**Implementation:** `apps/api/src/modules/auth/`

**Token Structure:**
```typescript
{
  id: string,          // User UUID
  email: string,       // User email
  iat: number,         // Issued at timestamp
  exp: number          // Expiration timestamp (24 hours)
}
```

**Security Measures:**
- Tokens expire after 24 hours
- Secret key stored in environment variables
- Tokens signed with HS256 algorithm
- No sensitive data in token payload

**Usage:**
```typescript
// Protected route
server.addHook('onRequest', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});
```

### API Key Authentication

**Implementation:** `apps/api/src/middleware/security.ts`

**Format:** 64-character hexadecimal string
```
Example: a1b2c3d4e5f6...(64 chars total)
```

**Security Measures:**
- Keys are hashed with salt before storage (SHA-256)
- Format validation on every request
- Rotation mechanism (manual for MVP)
- Rate limited separately from user requests

**Best Practices:**
1. **Never commit API keys to version control**
2. **Rotate keys every 90 days minimum**
3. **Use different keys for development/production**
4. **Revoke keys immediately if compromised**
5. **Monitor API key usage for anomalies**

---

## Input Validation & Sanitization

### Zod Schema Validation

**Implementation:** All routes use Zod schemas

**Example:**
```typescript
const CreateAttestationSchema = z.object({
  type: z.enum(['identity', 'certification', 'proof_of_ownership']),
  claims: z.record(z.any()),
  subject_did: z.string().optional(),
});
```

**Benefits:**
- Type-safe input validation
- Automatic TypeScript type inference
- Clear error messages
- Runtime type checking

### Input Sanitization

**Implementation:** `apps/api/src/middleware/security.ts`

**Sanitization Rules:**
```typescript
// XSS Prevention
sanitizeString(input: string) {
  return input
    .replace(/[<>'\"]/g, '')  // Remove dangerous characters
    .trim();
}

// SQL Injection Detection
detectSQLInjection(input: string) {
  const patterns = [
    /(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b.*=.*|'1'='1)/i,
  ];
  return patterns.some(p => p.test(input));
}
```

**Protected Fields:**
Certain fields are NOT sanitized to preserve data integrity:
- `password` - User passwords (hashed)
- `hash` - Cryptographic hashes
- `proof` - Zero-knowledge proofs

**When Sanitization Runs:**
1. **Query parameters** - Before route handler
2. **Request body** - Before route handler (recursive)
3. **URL parameters** - UUID format validation

---

## Rate Limiting

### Multi-Tier Rate Limiting

**Implementation:** `apps/api/src/middleware/rate-limit.ts`

**Four Configuration Tiers:**

| Tier | Limit | Window | Use Case |
|------|-------|--------|----------|
| **Global** | 100 req | 1 min | Default protection |
| **Auth** | 5 req | 15 min | Login/Register (brute force protection) |
| **User** | 60 req | 1 min | Standard API operations |
| **Expensive** | 10 req | 1 min | ZK proof generation, blockchain ops |

**How It Works:**
```typescript
// Redis-based distributed rate limiting
Key Format: "rl:{tier}:{user_id_or_ip}"

Example:
- Authenticated user: "rl:user:550e8400-e29b-41d4-a716-446655440000"
- Anonymous user: "rl:global:192.168.1.1"
```

**Response Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698456789000
Retry-After: 30
```

**Best Practices:**
1. **Monitor rate limit hits** - High numbers indicate abuse
2. **Adjust limits based on usage patterns**
3. **Implement backoff strategy in clients**
4. **Whitelist trusted IPs if needed**

**Fallback Protection:**
If Redis fails, basic in-memory rate limiting (100 req/min) still protects the API.

---

## Error Handling

### Centralized Error Handler

**Implementation:** `apps/api/src/middleware/error-handler.ts`

**Custom Error Classes:**
```typescript
ValidationError      // 400 - Invalid input
AuthenticationError  // 401 - Missing/invalid credentials
AuthorizationError   // 403 - Insufficient permissions
NotFoundError        // 404 - Resource not found
ConflictError        // 409 - Resource conflict
RateLimitError       // 429 - Too many requests
InternalError        // 500 - Server error
```

**Error Response Format:**
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
  "requestId": "req_1698456789_abc123"
}
```

**Security Considerations:**
- Never expose stack traces in production
- Log all errors with context for investigation
- Generic messages for internal errors
- Detailed validation errors for client debugging
- Request ID for error correlation

**What Gets Logged:**
```typescript
{
  err: error,
  url: request.url,
  method: request.method,
  userId: request.user?.id,
  ip: request.ip,
  requestId: request.id
}
```

---

## Security Headers

### HTTP Security Headers

**Implementation:**
- `@fastify/helmet` plugin
- `apps/api/src/middleware/security.ts`

**Headers Applied:**

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Enable XSS filter |
| `Strict-Transport-Security` | `max-age=31536000` | Force HTTPS |
| `X-DNS-Prefetch-Control` | `off` | Disable DNS prefetch |
| `X-Download-Options` | `noopen` | Prevent file execution |
| `X-Permitted-Cross-Domain-Policies` | `none` | Restrict cross-domain |
| `Content-Security-Policy` | (see below) | Control resource loading |

**Content Security Policy (CSP):**
```
default-src 'self';
style-src 'self' 'unsafe-inline';
script-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
```

**CORS Configuration:**
```typescript
{
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}
```

---

## Database Security

### SQL Injection Prevention

**Parameterized Queries:**
```typescript
// SAFE - Always use parameterized queries
const result = await query(
  'SELECT * FROM attestations WHERE user_id = $1 AND type = $2',
  [userId, type]
);

// UNSAFE - Never concatenate user input
const result = await query(
  `SELECT * FROM attestations WHERE user_id = '${userId}'`
);
```

**Additional Protection:**
- Input validation before queries
- SQL injection pattern detection
- Least privilege database user
- Connection pooling with limits

### Password Security

**Hashing:** bcrypt with 10 salt rounds
```typescript
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Password Requirements:**
- Minimum 8 characters
- No maximum (allow passphrases)
- No complexity requirements (avoid common passwords instead)

**Password Storage:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- Never store plaintext!
  -- ...
);
```

---

## API Key Management

### Generation & Storage

**Generation:**
```typescript
import crypto from 'crypto';

// Generate 256-bit key (64 hex characters)
const apiKey = crypto.randomBytes(32).toString('hex');
```

**Storage:**
```typescript
// Hash before storing
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto
  .createHash('sha256')
  .update(apiKey + salt)
  .digest('hex');

// Store hash + salt, NOT the original key
await query(
  'INSERT INTO api_keys (key_hash, salt, user_id) VALUES ($1, $2, $3)',
  [hash, salt, userId]
);
```

**Validation:**
```typescript
// Retrieve salt, hash incoming key, compare
const { key_hash, salt } = await getApiKeyRecord(providedKey);
const hash = hashApiKey(providedKey, salt);
return hash === key_hash;
```

### API Key Rotation

**Manual Rotation Process:**
1. Generate new API key
2. Store new key hash with creation date
3. Notify user to update applications
4. Keep old key active for grace period (7 days)
5. Revoke old key after grace period

**Automated Rotation (Future):**
- Implement expiration dates
- Send rotation reminders (30 days before expiry)
- Auto-generate new key on expiration
- Provide rotation webhook

---

## Logging & Monitoring

### Structured Logging with Pino

**Configuration:** `apps/api/src/main.ts`

**Log Levels:**
- `trace` - Extremely detailed (disabled in production)
- `debug` - Development information
- `info` - General informational messages
- `warn` - Warning messages (potential issues)
- `error` - Error messages (requires attention)
- `fatal` - Fatal errors (service crashes)

**Production Logging:**
```json
{
  "level": 30,
  "time": 1698456789000,
  "pid": 12345,
  "hostname": "api-server-1",
  "requestId": "req_1698456789_abc123",
  "req": {
    "method": "POST",
    "url": "/api/v1/attestations",
    "headers": { "host": "api.proofpass.com" }
  },
  "res": {
    "statusCode": 201
  },
  "msg": "Request completed"
}
```

**What to Log:**
- All authentication attempts (success/failure)
- Authorization failures
- Rate limit violations
- Input validation errors
- Blockchain transactions
- Critical errors
- NEVER log passwords or sensitive data
- NEVER log full API keys (log only last 4 chars)

**Log Retention:**
- Development: 7 days
- Production: 90 days (compliance requirement)
- Archive critical logs for 1 year

---

## Deployment Security

### Environment Variables

**Required Variables:**
```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Security
JWT_SECRET=<256-bit-secret>        # CRITICAL: Use strong random value
CORS_ORIGIN=https://app.proofpass.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?ssl=true
REDIS_URL=redis://user:pass@host:6379

# Stellar
STELLAR_NETWORK=mainnet
STELLAR_SECRET_KEY=<stellar-secret-key>
```

**Secret Management:**
1. **Never commit secrets to Git**
2. **Use environment-specific .env files**
3. **Rotate secrets regularly**
4. **Use secret management service (AWS Secrets Manager, Vault)**

### Docker Security

**Best Practices:**
```dockerfile
# Use specific versions
FROM node:18.18.0-alpine

# Run as non-root user
USER node

# Minimize attack surface
RUN apk --no-cache add dumb-init

# Health checks
HEALTHCHECK --interval=30s CMD node healthcheck.js
```

**docker-compose.yml:**
```yaml
# Network isolation
networks:
  internal:
    driver: bridge

# Read-only root filesystem
read_only: true

# Resource limits
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
```

### HTTPS/TLS

**Configuration:**
```nginx
# Nginx reverse proxy
server {
  listen 443 ssl http2;
  ssl_certificate /etc/ssl/certs/cert.pem;
  ssl_certificate_key /etc/ssl/private/key.pem;

  # TLS 1.3 only
  ssl_protocols TLSv1.3;
  ssl_prefer_server_ciphers off;

  # HSTS
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

**Certificate Management:**
- Use Let's Encrypt for free certificates
- Auto-renewal with certbot
- Monitor certificate expiration

---

## Vulnerability Response

### Reporting Security Issues

**Contact:** security@proofpass.com
**PGP Key:** [Link to public key]

**Please include:**
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

**Response Timeline:**
- **24 hours:** Initial acknowledgment
- **7 days:** Severity assessment
- **30 days:** Fix deployed (critical issues)
- **90 days:** Fix deployed (non-critical issues)

### Security Update Process

1. **Assessment:** Evaluate severity (Critical/High/Medium/Low)
2. **Patch Development:** Fix in isolated branch
3. **Testing:** Comprehensive testing including security tests
4. **Deployment:** Deploy to production ASAP (critical issues)
5. **Notification:** Inform users via email/status page
6. **Public Disclosure:** After fix deployed + grace period

### Known Issues & Mitigations

**Current Limitations:**
1. **ZK Proofs are simplified (MVP)** - Not production-grade zk-SNARKs
   - Mitigation: Clearly document limitations, plan upgrade to Circom/snarkjs

2. **Manual API key rotation** - No automatic expiration
   - Mitigation: Document rotation process, implement auto-rotation in Phase 5

3. **Single JWT secret** - No key rotation mechanism
   - Mitigation: Plan for JWT secret rotation strategy

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled with valid certificate
- [ ] Database connections use SSL
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled and tested
- [ ] Error handler doesn't expose stack traces
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] API keys hashed before storage
- [ ] Log sensitive data (passwords, keys) is filtered

### Post-Deployment

- [ ] Monitor logs for suspicious activity
- [ ] Set up alerts for rate limit violations
- [ ] Monitor authentication failure rates
- [ ] Review security headers with online scanner
- [ ] Test rate limiting under load
- [ ] Verify HTTPS redirects working
- [ ] Check database connection pooling
- [ ] Test error responses in production mode

### Ongoing Maintenance

- [ ] Rotate JWT secret every 6 months
- [ ] Update dependencies monthly (security patches weekly)
- [ ] Review logs weekly for anomalies
- [ ] Rotate API keys every 90 days
- [ ] Renew TLS certificates before expiry
- [ ] Backup database daily
- [ ] Test disaster recovery quarterly
- [ ] Security audit annually

---

## Additional Resources

**OWASP Top 10 Compliance:**
- A01:2021 - Broken Access Control
- A02:2021 - Cryptographic Failures
- A03:2021 - Injection
- A04:2021 - Insecure Design
- A05:2021 - Security Misconfiguration
- A07:2021 - Identification and Authentication Failures
- A09:2021 - Security Logging and Monitoring Failures

**References:**
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Fastify Security Guidelines](https://www.fastify.io/docs/latest/Guides/Security/)

---

**Document Version:** 1.0.0
**Author:** fboiero <fboiero@frvm.utn.edu.ar>
**Last Review:** October 28, 2024
**Next Review:** January 28, 2025
