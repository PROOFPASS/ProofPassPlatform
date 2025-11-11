# Authentication & API Keys

Complete guide to authenticating with the ProofPass API using API keys.

## Overview

ProofPass uses API keys to authenticate requests to the API. All API requests must include an API key in the `X-API-Key` header.

**Key Features**:
- Simple header-based authentication
- Support for multiple keys per organization
- Separate test and live environments
- Fine-grained permissions
- Automatic rate limiting per key

## API Key Format

ProofPass API keys follow a specific format:

```
pk_live_abc123def456ghi789jkl012mno345pqr678stu901vwx234
```

**Format Structure**:
- `pk_` - Prefix indicating "ProofPass Key"
- `live_` or `test_` - Environment indicator
- 44 random characters - Base64url encoded random bytes

**Key Types**:

| Type | Prefix | Usage |
|------|--------|-------|
| Live | `pk_live_` | Production environment, real data |
| Test | `pk_test_` | Development/testing, sandbox data |

## Creating API Keys

### Via Dashboard

1. Log in to [platform.proofpass.co](https://platform.proofpass.co)
2. Navigate to **Settings → API Keys**
3. Click **Create New API Key**
4. Configure the key:
   - **Name**: Descriptive name (e.g., "Production Server", "Mobile App")
   - **Environment**: Live or Test
   - **Permissions**: Select access level
   - **Expiration**: Optional expiry date
5. Click **Create Key**
6. **Copy and save the key** - it will only be shown once

### Via API (Programmatic)

```bash
curl -X POST https://platform.proofpass.co/api/v1/keys \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "environment": "live",
    "permissions": ["read", "write"],
    "expires_at": "2026-12-31T23:59:59Z"
  }'
```

Response:
```json
{
  "id": "key_abc123",
  "name": "Production Server",
  "key": "pk_live_abc123def456...",
  "prefix": "pk_live_",
  "permissions": ["read", "write"],
  "created_at": "2025-11-10T10:30:00Z",
  "expires_at": "2026-12-31T23:59:59Z"
}
```

**Important**: Store the `key` value securely. It cannot be retrieved again.

## Using API Keys

### Basic Authentication

Include your API key in the `X-API-Key` header with every request:

```bash
curl https://api.proofpass.co/v1/passports \
  -H "X-API-Key: pk_live_abc123def456..."
```

### Authentication Headers

```http
GET /v1/passports HTTP/1.1
Host: api.proofpass.co
X-API-Key: pk_live_abc123def456...
Content-Type: application/json
```

### Client Libraries

#### JavaScript / Node.js

```javascript
import { ProofPassClient } from '@proofpass/client';

const client = new ProofPassClient({
  apiKey: process.env.PROOFPASS_API_KEY,
  environment: 'live' // or 'test'
});

// Make authenticated requests
const passports = await client.passports.list();
```

#### Python

```python
from proofpass import ProofPassClient

client = ProofPassClient(
    api_key=os.environ['PROOFPASS_API_KEY']
)

# Make authenticated requests
passports = client.passports.list()
```

#### cURL

```bash
export PROOFPASS_API_KEY="pk_live_abc123def456..."

curl https://api.proofpass.co/v1/passports \
  -H "X-API-Key: $PROOFPASS_API_KEY"
```

#### Postman

1. Create a new request
2. Go to **Authorization** tab
3. Select **API Key** from the Type dropdown
4. Configure:
   - Key: `X-API-Key`
   - Value: Your API key
   - Add to: Header

## Key Permissions

### Permission Levels

| Permission | Description | Endpoints |
|------------|-------------|-----------|
| `read` | Read-only access | GET requests only |
| `write` | Create and update | GET, POST, PUT, PATCH |
| `delete` | Delete resources | All including DELETE |
| `admin` | Full administrative access | All operations |

### Scope-Based Permissions

Fine-grained control over specific resources:

```json
{
  "scopes": [
    "passports:read",
    "passports:write",
    "credentials:read",
    "credentials:write",
    "credentials:issue",
    "blockchain:read",
    "zkp:*"
  ]
}
```

**Common Scopes**:
- `passports:*` - All passport operations
- `credentials:read` - View credentials
- `credentials:issue` - Issue new credentials
- `credentials:verify` - Verify credentials
- `blockchain:anchor` - Anchor data on blockchain
- `zkp:generate` - Generate zero-knowledge proofs
- `zkp:verify` - Verify ZK proofs
- `admin:*` - Administrative operations

### Creating Keys with Specific Permissions

```bash
curl -X POST https://platform.proofpass.co/api/v1/keys \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Mobile App",
    "environment": "live",
    "scopes": [
      "passports:read",
      "credentials:verify"
    ]
  }'
```

## Managing API Keys

### Listing Keys

View all API keys for your organization:

```bash
curl https://platform.proofpass.co/api/v1/keys \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

Response:
```json
{
  "keys": [
    {
      "id": "key_abc123",
      "name": "Production Server",
      "prefix": "pk_live_abc1",
      "permissions": ["read", "write"],
      "last_used_at": "2025-11-10T14:20:00Z",
      "created_at": "2025-11-01T10:30:00Z",
      "expires_at": null
    },
    {
      "id": "key_def456",
      "name": "Development",
      "prefix": "pk_test_def4",
      "permissions": ["read"],
      "last_used_at": "2025-11-09T18:45:00Z",
      "created_at": "2025-10-15T09:00:00Z",
      "expires_at": "2025-12-31T23:59:59Z"
    }
  ]
}
```

### Updating Keys

Update key name or permissions:

```bash
curl -X PATCH https://platform.proofpass.co/api/v1/keys/key_abc123 \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Updated Name",
    "permissions": ["read", "write", "delete"]
  }'
```

### Revoking Keys

Immediately revoke an API key:

```bash
curl -X DELETE https://platform.proofpass.co/api/v1/keys/key_abc123 \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

Or via dashboard:
```
Settings → API Keys → [Key Name] → Revoke
```

## Rate Limiting

### Understanding Rate Limits

Rate limits are applied per API key based on your plan:

| Plan | Daily Limit | Monthly Limit | Burst Limit |
|------|-------------|---------------|-------------|
| Free | 100 req/day | 3,000 req/month | 10 req/min |
| Pro | 10,000 req/day | 300,000 req/month | 100 req/min |
| Enterprise | Unlimited | Unlimited | 1,000 req/min |

### Rate Limit Headers

Every API response includes rate limit information:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9543
X-RateLimit-Reset: 1699660800
```

**Headers**:
- `X-RateLimit-Limit` - Maximum requests per period
- `X-RateLimit-Remaining` - Requests remaining in current period
- `X-RateLimit-Reset` - Unix timestamp when limit resets

### Handling Rate Limits

When you exceed the rate limit:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Daily request limit reached",
    "limit": 100,
    "current": 100,
    "reset_at": "2025-11-11T00:00:00Z"
  }
}
```

**Best Practices**:

```javascript
async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);

    // Check rate limit headers
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining < 10) {
      console.warn(`Rate limit low: ${remaining} requests remaining`);
    }

    if (response.status === 429) {
      // Implement exponential backoff
      const resetTime = new Date(reset * 1000);
      const waitTime = resetTime - new Date();
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return makeRequest(url, options); // Retry
    }

    return response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
```

### Optimizing API Usage

**1. Implement Caching**:
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchFromAPI(key);
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

**2. Batch Requests**:
```javascript
// Instead of multiple individual requests
const credentials = await Promise.all(
  ids.map(id => client.credentials.get(id))
);

// Use batch endpoint
const credentials = await client.credentials.batchGet(ids);
```

**3. Use Webhooks**:
Instead of polling for updates, subscribe to webhooks:
```javascript
// Polling (uses many API calls)
setInterval(async () => {
  const status = await client.transactions.get(txId);
  if (status.confirmed) {
    handleConfirmation(status);
  }
}, 5000);

// Webhooks (no API calls needed)
app.post('/webhooks/transaction', (req, res) => {
  const { transaction } = req.body;
  if (transaction.confirmed) {
    handleConfirmation(transaction);
  }
  res.sendStatus(200);
});
```

## Security Best Practices

### Storing API Keys

**✅ DO**:

```bash
# Use environment variables
export PROOFPASS_API_KEY="pk_live_abc123..."
```

```javascript
// Load from environment
const apiKey = process.env.PROOFPASS_API_KEY;
```

```python
# Use python-dotenv
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv('PROOFPASS_API_KEY')
```

**❌ DON'T**:

```javascript
// Never hardcode keys
const apiKey = 'pk_live_abc123...'; // BAD!

// Never commit to git
// config.json
{
  "apiKey": "pk_live_abc123..." // BAD!
}

// Never expose in frontend
<script>
  const apiKey = 'pk_live_abc123...'; // BAD!
</script>
```

### Using .env Files

```bash
# .env
PROOFPASS_API_KEY=pk_live_abc123...
PROOFPASS_ENVIRONMENT=production
```

```bash
# .gitignore
.env
.env.*
!.env.example
```

```bash
# .env.example (commit this)
PROOFPASS_API_KEY=pk_test_your_test_key_here
PROOFPASS_ENVIRONMENT=development
```

### Key Rotation

Rotate API keys regularly (every 90 days):

**1. Create New Key**:
```bash
curl -X POST https://platform.proofpass.co/api/v1/keys \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"name": "Production Server v2", "environment": "live"}'
```

**2. Update Your Application**:
```bash
# Update environment variable
export PROOFPASS_API_KEY="pk_live_new_key..."

# Restart services
systemctl restart your-app
```

**3. Verify New Key Works**:
```bash
curl https://api.proofpass.co/v1/health \
  -H "X-API-Key: $PROOFPASS_API_KEY"
```

**4. Revoke Old Key**:
```bash
curl -X DELETE https://platform.proofpass.co/api/v1/keys/key_old \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### Key Separation

Use different keys for different environments and services:

```
pk_live_production_backend_...     # Production backend
pk_live_production_workers_...     # Background workers
pk_test_staging_all_...            # Staging environment
pk_test_dev_alice_...              # Developer: Alice
pk_test_dev_bob_...                # Developer: Bob
```

**Benefits**:
- Isolate security breaches
- Track usage per service
- Revoke specific access without affecting others
- Different permissions per service

### Monitoring Key Usage

Set up alerts for suspicious activity:

```javascript
// Monitor for unusual patterns
const analytics = {
  requestsPerMinute: 0,
  errorsPerMinute: 0,
  uniqueIPs: new Set()
};

app.use((req, res, next) => {
  analytics.requestsPerMinute++;
  analytics.uniqueIPs.add(req.ip);

  // Alert on anomalies
  if (analytics.requestsPerMinute > 1000) {
    alertSecurityTeam('High request rate detected');
  }

  if (analytics.uniqueIPs.size > 100) {
    alertSecurityTeam('Requests from many IPs');
  }

  next();
});
```

## Troubleshooting

### Invalid API Key

```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "The provided API key is invalid or has been revoked"
  }
}
```

**Solutions**:
1. Check key is correctly copied (no extra spaces)
2. Verify key hasn't been revoked
3. Ensure using correct environment (live vs test)
4. Check key hasn't expired

### Insufficient Permissions

```json
{
  "error": {
    "code": "insufficient_permissions",
    "message": "API key does not have permission for this operation",
    "required": "credentials:issue",
    "granted": ["credentials:read"]
  }
}
```

**Solutions**:
1. Check key permissions in dashboard
2. Create new key with required permissions
3. Update key permissions if allowed

### Expired API Key

```json
{
  "error": {
    "code": "api_key_expired",
    "message": "API key expired on 2025-10-31",
    "expired_at": "2025-10-31T23:59:59Z"
  }
}
```

**Solutions**:
1. Create new API key
2. Update application configuration
3. Remove expired key

## Testing API Keys

### Test Mode

Use test keys for development:

```bash
# Test key - uses sandbox data
curl https://api.proofpass.co/v1/credentials/issue \
  -H "X-API-Key: pk_test_abc123..." \
  -d '{"test": true}'
```

**Test Mode Features**:
- Separate database
- No blockchain costs
- Faster operations
- Reset data anytime

### Verification Script

Test your API key setup:

```bash
#!/bin/bash
# test-api-key.sh

API_KEY="${PROOFPASS_API_KEY}"
BASE_URL="https://api.proofpass.co/v1"

echo "Testing API key: ${API_KEY:0:15}..."

# Test authentication
response=$(curl -s -w "%{http_code}" \
  -H "X-API-Key: $API_KEY" \
  "$BASE_URL/health")

http_code="${response: -3}"
body="${response:0:${#response}-3}"

if [ "$http_code" = "200" ]; then
  echo "✅ API key is valid"
  echo "Response: $body"
else
  echo "❌ API key test failed"
  echo "HTTP Status: $http_code"
  echo "Response: $body"
  exit 1
fi
```

## Next Steps

- [Using ProofPass SaaS](./using-proofpass-saas.md) - Complete SaaS guide
- [Pricing & Plans](./pricing-plans.md) - Compare plans and features
- [API Reference](./api-reference.md) - Detailed API documentation
- [Quick Reference](./quick-reference.md) - Common operations

## Need Help?

- **Documentation**: Full API docs at [docs.proofpass.co](https://docs.proofpass.co)
- **Support**: support@proofpass.co
- **Security Issues**: security@proofpass.co
