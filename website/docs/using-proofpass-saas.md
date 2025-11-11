# Using ProofPass SaaS

Get started with ProofPass as a hosted service - no infrastructure setup required.

## Overview

ProofPass SaaS at **platform.proofpass.co** provides a fully-managed digital identity and credential verification platform. You get:

- Instant access to the full ProofPass API
- Automatic scalability and updates
- 99.9% uptime SLA
- No infrastructure management
- Dedicated support

## Quick Start

### 1. Create Your Account

1. Go to [platform.proofpass.co](https://platform.proofpass.co)
2. Click "Sign Up" and provide:
   - Your email address
   - Organization name
   - Password
3. Verify your email address
4. Choose your plan (Free, Pro, or Enterprise)

### 2. Create an Organization

After signing up, you'll be prompted to create your organization:

- **Organization Name**: Your company or project name
- **Domain** (optional): Your company domain (e.g., acme.com)
- **Billing Email**: Where invoices will be sent

### 3. Get Your API Key

Once your organization is created:

1. Go to **Settings → API Keys**
2. Click "Create New API Key"
3. Give it a descriptive name (e.g., "Production", "Development")
4. Copy and securely store your API key

**Important**: API keys are only shown once. Store them securely.

```
Format: pk_live_abc123def456...
```

## Using the Dashboard

### Dashboard Overview

The main dashboard shows:

- **Usage Statistics**: Current month's API calls, blockchain operations
- **Quick Actions**: Create credentials, verify documents, manage users
- **Recent Activity**: Latest API calls and operations
- **Plan Status**: Current plan, limits, and usage

### Managing API Keys

**Create API Key**:
```
Settings → API Keys → Create New Key
```

**Key Types**:
- **Live Keys** (`pk_live_...`): For production use
- **Test Keys** (`pk_test_...`): For development and testing

**Permissions**:
- Full Access: All operations
- Read Only: Query data, no modifications
- Custom: Specific endpoint access

**Best Practices**:
- Use test keys for development
- Rotate keys regularly (every 90 days)
- Use different keys for different services
- Delete unused keys immediately

### Monitoring Usage

**View Usage**:
```
Dashboard → Usage & Billing
```

**Metrics Available**:
- Total API requests (daily/monthly)
- Blockchain operations count
- Attestations created
- ZKP proofs generated
- Response times and errors

**Usage Alerts**:
- Get notified when approaching limits
- Configure alerts in Settings → Notifications

## Making Your First API Call

### Using Your API Key

Include your API key in the `X-API-Key` header:

```bash
curl https://api.proofpass.co/v1/health \
  -H "X-API-Key: pk_live_abc123def456..."
```

### Create a Digital Passport

```bash
curl -X POST https://api.proofpass.co/v1/passports \
  -H "X-API-Key: pk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "did:example:user123",
    "credentials": [
      {
        "type": "EmailVerification",
        "email": "user@example.com",
        "verified": true
      }
    ]
  }'
```

Response:
```json
{
  "id": "passport_abc123",
  "subject": "did:example:user123",
  "status": "active",
  "created_at": "2025-11-10T10:30:00Z",
  "credentials": [...]
}
```

### Issue a Verifiable Credential

```bash
curl -X POST https://api.proofpass.co/v1/credentials/issue \
  -H "X-API-Key: pk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "credential": {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      "type": ["VerifiableCredential", "UniversityDegree"],
      "issuer": "did:example:university",
      "issuanceDate": "2025-11-10T10:30:00Z",
      "credentialSubject": {
        "id": "did:example:student123",
        "degree": {
          "type": "BachelorDegree",
          "name": "Bachelor of Science in Computer Science"
        }
      }
    }
  }'
```

### Anchor Data on Blockchain

```bash
curl -X POST https://api.proofpass.co/v1/blockchain/anchor \
  -H "X-API-Key: pk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "QmXYZ...hash",
    "metadata": {
      "type": "credential",
      "id": "vc_123"
    }
  }'
```

Response:
```json
{
  "transaction_id": "stellar_tx_abc123",
  "hash": "QmXYZ...",
  "timestamp": "2025-11-10T10:30:00Z",
  "blockchain": "stellar",
  "status": "confirmed"
}
```

## Integration Examples

### Node.js / JavaScript

```javascript
import { ProofPassClient } from '@proofpass/client';

const client = new ProofPassClient({
  apiKey: 'pk_live_your_key_here',
  baseURL: 'https://api.proofpass.co/v1'
});

// Create a passport
const passport = await client.passports.create({
  subject: 'did:example:user123',
  credentials: [
    {
      type: 'EmailVerification',
      email: 'user@example.com',
      verified: true
    }
  ]
});

console.log('Passport created:', passport.id);
```

### Python

```python
import requests

API_KEY = 'pk_live_your_key_here'
BASE_URL = 'https://api.proofpass.co/v1'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# Create a credential
response = requests.post(
    f'{BASE_URL}/credentials/issue',
    headers=headers,
    json={
        'credential': {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            'type': ['VerifiableCredential'],
            'issuer': 'did:example:issuer',
            'credentialSubject': {
                'id': 'did:example:user123',
                'name': 'John Doe'
            }
        }
    }
)

credential = response.json()
print(f"Credential created: {credential['id']}")
```

### React / Frontend

```jsx
import { useProofPass } from '@proofpass/react';

function MyComponent() {
  const { verifyCredential, loading } = useProofPass({
    apiKey: process.env.NEXT_PUBLIC_PROOFPASS_KEY
  });

  const handleVerify = async (credential) => {
    try {
      const result = await verifyCredential(credential);
      if (result.verified) {
        console.log('Credential is valid!');
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  return (
    <button onClick={handleVerify} disabled={loading}>
      Verify Credential
    </button>
  );
}
```

## Managing Your Account

### Updating Organization Details

```
Settings → Organization → Edit Details
```

Update:
- Organization name
- Billing information
- Contact email
- Domain

### Adding Team Members

```
Settings → Team → Invite Member
```

**Roles Available**:
- **Owner**: Full access, billing management
- **Admin**: Manage users, view billing
- **Developer**: Create API keys, view usage
- **Viewer**: Read-only access

### Changing Your Plan

```
Settings → Billing → Change Plan
```

**Upgrade Process**:
1. Select new plan (Pro or Enterprise)
2. Enter payment information
3. Confirm upgrade
4. New limits apply immediately

**Downgrade Process**:
1. Select lower plan
2. Confirm downgrade
3. Changes apply at next billing cycle

## Billing & Invoices

### View Invoices

```
Settings → Billing → Invoices
```

- Download PDF invoices
- View payment history
- Update payment method

### Payment Methods

Accepted payment methods:
- Credit/Debit cards (Visa, Mastercard, Amex)
- ACH transfers (Enterprise only)
- Wire transfers (Enterprise only)

### Pricing Breakdown

See detailed pricing at [Pricing & Plans](./pricing-plans.md).

**Usage-Based Billing** (Enterprise):
- Base monthly fee
- Per-API-call charges beyond included quota
- Blockchain operation fees
- Premium support

## Rate Limits & Quotas

### Understanding Rate Limits

Each plan has different limits:

| Plan       | Requests/Day | Blockchain Ops/Month | Support     |
|------------|--------------|----------------------|-------------|
| Free       | 100          | 10                   | Community   |
| Pro        | 10,000       | 1,000                | Email       |
| Enterprise | Unlimited    | Unlimited            | Dedicated   |

### Handling Rate Limits

When you hit a rate limit, the API returns:

```json
{
  "error": "rate_limit_exceeded",
  "message": "Daily request limit reached",
  "limit": 100,
  "current": 100,
  "reset_at": "2025-11-11T00:00:00Z"
}
```

**Best Practices**:
- Implement exponential backoff
- Cache responses when possible
- Monitor usage dashboard
- Upgrade plan before hitting limits

## Support & Resources

### Getting Help

**Documentation**:
- [API Reference](./api-reference.md)
- [Integration Guide](./frontend-integration.md)
- [Quick Reference](./quick-reference.md)

**Support Channels**:
- **Community**: [GitHub Discussions](https://github.com/PROOFPASS/ProofPassPlatform/discussions)
- **Email**: support@proofpass.co (Pro & Enterprise)
- **Slack**: Dedicated channel (Enterprise only)

**Response Times**:
- Free: Community support (best effort)
- Pro: 24-48 hours
- Enterprise: 4-8 hours (priority support)

### Status & Uptime

Check system status:
- [status.proofpass.co](https://status.proofpass.co)
- Subscribe to incident notifications
- View historical uptime

### API Changelog

Stay updated with API changes:
- [API Changelog](https://docs.proofpass.co/changelog)
- Subscribe to release notes
- Review breaking changes

## Security Best Practices

### Protecting Your API Keys

**DO**:
- Store keys in environment variables
- Use separate keys for dev/staging/prod
- Rotate keys every 90 days
- Delete unused keys immediately
- Use key-specific permissions

**DON'T**:
- Commit keys to version control
- Share keys via email or chat
- Use production keys in development
- Embed keys in client-side code

### Secure Integration

```javascript
// ✅ Good: Server-side API calls
// backend/api/verify.js
import { ProofPassClient } from '@proofpass/client';

const client = new ProofPassClient({
  apiKey: process.env.PROOFPASS_API_KEY  // Secure
});

// ❌ Bad: Client-side API key exposure
// frontend/App.jsx
const client = new ProofPassClient({
  apiKey: 'pk_live_123...'  // NEVER do this!
});
```

### Webhook Security

When using webhooks:
- Verify webhook signatures
- Use HTTPS endpoints only
- Validate payload structure
- Implement replay protection

## Migration from Open Source

If you're migrating from self-hosted ProofPass:

### Export Your Data

```bash
# From your self-hosted instance
npm run export:data -- --output data.json
```

### Import to SaaS

```bash
# Using ProofPass CLI
npx @proofpass/cli import \
  --api-key pk_live_your_key \
  --data data.json
```

### Update Integrations

Change API base URL from:
```
http://your-server.com/api/v1
```

To:
```
https://api.proofpass.co/v1
```

Add authentication header:
```javascript
headers: {
  'X-API-Key': 'pk_live_your_key_here'
}
```

## Next Steps

- [Authentication & API Keys](./authentication-api-keys.md) - Detailed API authentication guide
- [Pricing & Plans](./pricing-plans.md) - Compare plans and features
- [API Reference](./api-reference.md) - Complete API documentation
- [Frontend Integration](./frontend-integration.md) - Build user interfaces

## Need More Help?

- Contact Sales: sales@proofpass.co
- Technical Support: support@proofpass.co
- Schedule Demo: [Book a demo](https://proofpass.co/demo)
