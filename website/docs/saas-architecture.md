# Arquitectura SaaS - ProofPass Platform

Sistema multi-tenant para gestión de clientes, licencias y facturación.

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                  PLATFORM.PROOFPASS.CO                      │
│              Dashboard Administrativo                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Clientes   │  │  Licencias   │  │  Métricas    │     │
│  │   Usuarios   │  │   Planes     │  │   Uso        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │         Portal de Cliente                       │       │
│  │  - API Keys                                     │       │
│  │  - Ver Licencia                                 │       │
│  │  - Métricas de Uso                              │       │
│  │  - Facturación                                  │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  API.PROOFPASS.CO                           │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │  Rate Limiting por Cliente/Plan               │         │
│  │  - Free: 100 req/día                          │         │
│  │  - Pro: 10,000 req/día                        │         │
│  │  - Enterprise: Ilimitado                      │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │  Tracking de Uso                               │         │
│  │  - Requests por cliente                        │         │
│  │  - Operaciones por tipo                        │         │
│  │  - Costos por operación                        │         │
│  └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Modelo de Datos

### Clientes (Organizations)

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(255), -- Dominio del cliente (ej: acme.com)
  plan_id UUID REFERENCES plans(id),
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled

  -- Billing
  billing_email VARCHAR(255),
  billing_address TEXT,
  tax_id VARCHAR(100),

  -- Stripe/Payment
  stripe_customer_id VARCHAR(255),
  payment_method_id VARCHAR(255),

  -- Limits (override plan defaults)
  custom_request_limit INTEGER,
  custom_blockchain_ops_limit INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_plan ON organizations(plan_id);
```

### Planes

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL, -- Free, Pro, Enterprise
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Limits
  requests_per_day INTEGER DEFAULT 100,
  requests_per_month INTEGER DEFAULT 3000,
  blockchain_ops_per_month INTEGER DEFAULT 10,
  max_users INTEGER DEFAULT 1,
  max_api_keys INTEGER DEFAULT 1,

  -- Features
  features JSONB DEFAULT '{}', -- {"zkp": true, "attestations": true}

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default plans
INSERT INTO plans (name, slug, price_monthly, requests_per_day, blockchain_ops_per_month) VALUES
  ('Free', 'free', 0, 100, 10),
  ('Pro', 'pro', 49, 10000, 1000),
  ('Enterprise', 'enterprise', 499, -1, -1); -- -1 = unlimited
```

### Usuarios (vinculados a organizaciones)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,

  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member

  -- Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
```

### API Keys

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL, -- pk_live_, pk_test_
  key_hash VARCHAR(255) NOT NULL, -- Hashed API key

  -- Permissions
  scopes TEXT[] DEFAULT '{}', -- ['blockchain:read', 'blockchain:write', 'attestations:*']

  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE UNIQUE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

### Tracking de Uso

```sql
CREATE TABLE usage_records (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  api_key_id UUID REFERENCES api_keys(id),

  -- Request info
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,

  -- Resource usage
  operation_type VARCHAR(100), -- blockchain_anchor, attestation_create, etc.
  credits_used INTEGER DEFAULT 1,

  -- Timestamps
  recorded_at TIMESTAMP DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_usage_org_date ON usage_records(organization_id, date);
CREATE INDEX idx_usage_date ON usage_records(date);
CREATE INDEX idx_usage_operation ON usage_records(operation_type);

-- Partitioning por mes para mejor performance
CREATE TABLE usage_records_2024_11 PARTITION OF usage_records
  FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
```

### Métricas Agregadas (para dashboard rápido)

```sql
CREATE TABLE usage_aggregates (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Counts
  total_requests INTEGER DEFAULT 0,
  blockchain_ops INTEGER DEFAULT 0,
  attestations_created INTEGER DEFAULT 0,

  -- Credits
  total_credits_used INTEGER DEFAULT 0,

  -- Status codes
  requests_2xx INTEGER DEFAULT 0,
  requests_4xx INTEGER DEFAULT 0,
  requests_5xx INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, date)
);

CREATE INDEX idx_aggregates_org_date ON usage_aggregates(organization_id, date DESC);
```

### Subscripciones

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),

  -- Stripe
  stripe_subscription_id VARCHAR(255),
  stripe_status VARCHAR(50), -- active, past_due, canceled, etc.

  -- Billing period
  current_period_start DATE,
  current_period_end DATE,

  -- Pricing
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  interval VARCHAR(20), -- monthly, yearly

  -- Status
  status VARCHAR(50) DEFAULT 'active',
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### Invoices

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),

  -- Invoice details
  invoice_number VARCHAR(100) UNIQUE,
  stripe_invoice_id VARCHAR(255),

  amount DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, open, paid, void
  paid_at TIMESTAMP,
  due_date DATE,

  -- PDF
  pdf_url TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

## 🔑 Sistema de API Keys

### Formato de Keys

```
Producción: pk_live_abc123def456...
Test:       pk_test_abc123def456...
```

### Generación y Validación

```typescript
// apps/api/src/utils/api-keys.ts
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class APIKeyManager {
  static generate(prefix: 'pk_live_' | 'pk_test_'): { key: string; hash: string } {
    // Generate random key
    const randomBytes = crypto.randomBytes(32);
    const key = prefix + randomBytes.toString('base64url');

    // Hash for storage
    const hash = bcrypt.hashSync(key, 10);

    return { key, hash };
  }

  static async validate(key: string, hash: string): Promise<boolean> {
    return bcrypt.compare(key, hash);
  }

  static extractPrefix(key: string): string {
    return key.substring(0, 8); // pk_live_ or pk_test_
  }
}
```

## 🔐 Middleware de Autenticación

```typescript
// apps/api/src/middleware/auth-client.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../config/database';

export async function authenticateAPIKey(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.code(401).send({ error: 'API key required' });
  }

  try {
    // Get key from database
    const prefix = apiKey.substring(0, 8);

    const result = await pool.query(`
      SELECT
        ak.*,
        o.id as org_id,
        o.status as org_status,
        o.plan_id,
        p.name as plan_name,
        p.requests_per_day,
        p.blockchain_ops_per_month
      FROM api_keys ak
      JOIN organizations o ON ak.organization_id = o.id
      JOIN plans p ON o.plan_id = p.id
      WHERE ak.key_prefix = $1
        AND ak.is_active = true
        AND o.status = 'active'
    `, [prefix]);

    if (result.rows.length === 0) {
      return reply.code(401).send({ error: 'Invalid API key' });
    }

    const keyRecord = result.rows[0];

    // Validate hash
    const isValid = await APIKeyManager.validate(apiKey, keyRecord.key_hash);

    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid API key' });
    }

    // Check expiration
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return reply.code(401).send({ error: 'API key expired' });
    }

    // Check rate limits
    const usage = await checkRateLimits(keyRecord.org_id, keyRecord.plan_name);

    if (usage.exceeded) {
      return reply.code(429).send({
        error: 'Rate limit exceeded',
        limit: usage.limit,
        current: usage.current,
        reset_at: usage.reset_at
      });
    }

    // Attach to request
    request.client = {
      orgId: keyRecord.org_id,
      userId: keyRecord.user_id,
      apiKeyId: keyRecord.id,
      plan: keyRecord.plan_name,
      limits: {
        requestsPerDay: keyRecord.requests_per_day,
        blockchainOpsPerMonth: keyRecord.blockchain_ops_per_month
      }
    };

    // Update last used
    pool.query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [keyRecord.id]
    );

  } catch (error) {
    request.log.error(error, 'API key authentication failed');
    return reply.code(500).send({ error: 'Authentication failed' });
  }
}

async function checkRateLimits(orgId: string, planName: string) {
  // Check daily usage
  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM usage_records
    WHERE organization_id = $1
      AND date = CURRENT_DATE
  `, [orgId]);

  const current = parseInt(result.rows[0].count);

  // Get plan limits
  const limits = await pool.query(
    'SELECT requests_per_day FROM plans WHERE name = $1',
    [planName]
  );

  const limit = limits.rows[0].requests_per_day;

  // -1 means unlimited
  if (limit === -1) {
    return { exceeded: false, limit: -1, current };
  }

  const exceeded = current >= limit;
  const resetAt = new Date();
  resetAt.setHours(24, 0, 0, 0);

  return {
    exceeded,
    limit,
    current,
    reset_at: resetAt
  };
}
```

## 📊 Tracking de Uso

```typescript
// apps/api/src/middleware/usage-tracking.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../config/database';

export async function trackUsage(request: FastifyRequest, reply: FastifyReply) {
  const client = request.client;

  if (!client) return;

  try {
    // Determine operation type
    const operationType = getOperationType(request.routerPath);
    const creditsUsed = getCredits(operationType);

    await pool.query(`
      INSERT INTO usage_records (
        organization_id,
        user_id,
        api_key_id,
        endpoint,
        method,
        status_code,
        operation_type,
        credits_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      client.orgId,
      client.userId,
      client.apiKeyId,
      request.routerPath,
      request.method,
      reply.statusCode,
      operationType,
      creditsUsed
    ]);

    // Update aggregates (async, no await)
    updateAggregates(client.orgId, operationType);

  } catch (error) {
    request.log.error(error, 'Failed to track usage');
    // Don't fail request if tracking fails
  }
}

function getOperationType(path: string): string {
  if (path.includes('/blockchain/anchor')) return 'blockchain_anchor';
  if (path.includes('/attestations')) return 'attestation_create';
  if (path.includes('/passports')) return 'passport_create';
  if (path.includes('/zkp')) return 'zkp_generate';
  return 'api_call';
}

function getCredits(operationType: string): number {
  const costs = {
    'blockchain_anchor': 10,
    'attestation_create': 5,
    'passport_create': 3,
    'zkp_generate': 20,
    'api_call': 1
  };
  return costs[operationType] || 1;
}

async function updateAggregates(orgId: string, operationType: string) {
  await pool.query(`
    INSERT INTO usage_aggregates (
      organization_id,
      date,
      total_requests,
      ${operationType === 'blockchain_anchor' ? 'blockchain_ops,' : ''}
      total_credits_used
    ) VALUES ($1, CURRENT_DATE, 1, ${operationType === 'blockchain_anchor' ? '1,' : ''} $2)
    ON CONFLICT (organization_id, date)
    DO UPDATE SET
      total_requests = usage_aggregates.total_requests + 1,
      ${operationType === 'blockchain_anchor' ? 'blockchain_ops = usage_aggregates.blockchain_ops + 1,' : ''}
      total_credits_used = usage_aggregates.total_credits_used + $2,
      updated_at = NOW()
  `, [orgId, getCredits(operationType)]);
}
```

## 🎯 Próximos pasos

Ver documentación específica:
- [Admin API Endpoints](ADMIN_API.md) - Endpoints de administración
- [Client Dashboard](CLIENT_DASHBOARD.md) - Dashboard de cliente
- [Billing Integration](BILLING_INTEGRATION.md) - Integración de pagos

## 📞 Referencias

- Stripe API: https://stripe.com/docs/api
- Rate Limiting: https://redis.io/docs/manual/patterns/rate-limiter/
- Multi-tenancy: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
