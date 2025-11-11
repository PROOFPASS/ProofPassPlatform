# Plan de Mejoras - ProofPass Platform

**Fecha:** 30 de Octubre, 2024
**Versión:** 1.0

---

## 🎯 Objetivo

Completar la implementación de la plataforma SaaS ProofPass para que cumpla con todas las promesas de la web (https://www.proofpass.co/) y esté lista para producción.

**Timeline total estimado:** 4-5 semanas para MVP funcional

---

## 📋 FASE 1: CRÍTICO - Sistema SaaS Funcional
**Duración:** 1-2 semanas
**Objetivo:** Hacer funcional el sistema multi-tenant

### Task 1.1: API Key Authentication Middleware ⏱️ 2-3 días

**Archivo a crear:** `apps/api/src/middleware/api-key-auth.ts`

**Implementación:**
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../config/database';
import bcrypt from 'bcrypt';

export async function authenticateAPIKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // 1. Extraer API key del header
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.code(401).send({ error: 'API key required' });
  }

  // 2. Validar formato (pk_live_* o pk_test_*)
  const prefix = apiKey.substring(0, 8); // pk_live_ o pk_test_

  if (!prefix.startsWith('pk_')) {
    return reply.code(401).send({ error: 'Invalid API key format' });
  }

  // 3. Buscar en BD por prefix
  const result = await query(`
    SELECT
      ak.id,
      ak.key_hash,
      ak.is_active,
      ak.expires_at,
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

  // 4. Verificar hash con bcrypt
  const isValid = await bcrypt.compare(apiKey, keyRecord.key_hash);

  if (!isValid) {
    return reply.code(401).send({ error: 'Invalid API key' });
  }

  // 5. Check expiration
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return reply.code(401).send({ error: 'API key expired' });
  }

  // 6. Check rate limits (daily)
  const usageResult = await query(`
    SELECT COUNT(*) as count
    FROM usage_records
    WHERE organization_id = $1
      AND date = CURRENT_DATE
  `, [keyRecord.org_id]);

  const todayUsage = parseInt(usageResult.rows[0].count);
  const limit = keyRecord.requests_per_day;

  if (limit !== -1 && todayUsage >= limit) {
    return reply.code(429).send({
      error: 'Rate limit exceeded',
      limit,
      current: todayUsage,
      reset_at: new Date().setHours(24, 0, 0, 0)
    });
  }

  // 7. Attach client info to request
  request.client = {
    orgId: keyRecord.org_id,
    apiKeyId: keyRecord.id,
    plan: keyRecord.plan_name,
    limits: {
      requestsPerDay: keyRecord.requests_per_day,
      blockchainOpsPerMonth: keyRecord.blockchain_ops_per_month
    }
  };

  // 8. Update last_used_at
  query(
    'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
    [keyRecord.id]
  ).catch(err => request.log.error(err));
}
```

**Registro en main.ts:**
```typescript
// apps/api/src/main.ts

import { authenticateAPIKey } from './middleware/api-key-auth';

// Agregar después de línea 237
// Para endpoints que usan API key en vez de JWT
await server.register(async (instance) => {
  instance.addHook('preHandler', authenticateAPIKey);
  // Aquí irían routes públicas con API key
});
```

**Tipos a agregar:**
```typescript
// apps/api/src/types/fastify.d.ts
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    client?: {
      orgId: string;
      apiKeyId: string;
      plan: string;
      limits: {
        requestsPerDay: number;
        blockchainOpsPerMonth: number;
      };
    };
  }
}
```

---

### Task 1.2: Usage Tracking Middleware ⏱️ 2-3 días

**Archivo a crear:** `apps/api/src/middleware/usage-tracking.ts`

**Implementación:**
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../config/database';

// Credit costs por operation type
const CREDIT_COSTS = {
  'blockchain_anchor': 10,
  'attestation_create': 5,
  'passport_create': 3,
  'zkp_generate': 20,
  'api_call': 1,
};

function getOperationType(path: string): string {
  if (path.includes('/blockchain/anchor')) return 'blockchain_anchor';
  if (path.includes('/attestations') && path.includes('POST')) return 'attestation_create';
  if (path.includes('/passports') && path.includes('POST')) return 'passport_create';
  if (path.includes('/zkp') && path.includes('POST')) return 'zkp_generate';
  return 'api_call';
}

export async function trackUsage(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const client = request.client;

  if (!client) {
    // Solo trackear si hay client (API key auth)
    return;
  }

  try {
    // Determinar operation type
    const operationType = getOperationType(request.routerPath || request.url);
    const creditsUsed = CREDIT_COSTS[operationType] || 1;

    // Insert en usage_records
    await query(`
      INSERT INTO usage_records (
        organization_id,
        api_key_id,
        endpoint,
        method,
        status_code,
        operation_type,
        credits_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      client.orgId,
      client.apiKeyId,
      request.routerPath || request.url,
      request.method,
      reply.statusCode,
      operationType,
      creditsUsed
    ]);

    // Update usage_aggregates (async, fire and forget)
    updateAggregates(client.orgId, operationType, creditsUsed, reply.statusCode)
      .catch(err => request.log.error(err, 'Failed to update aggregates'));

  } catch (error) {
    // No fallar request si tracking falla
    request.log.error(error, 'Usage tracking failed');
  }
}

async function updateAggregates(
  orgId: string,
  operationType: string,
  credits: number,
  statusCode: number
): Promise<void> {
  const isBlockchainOp = operationType === 'blockchain_anchor';
  const isAttestation = operationType === 'attestation_create';

  const status2xx = statusCode >= 200 && statusCode < 300 ? 1 : 0;
  const status4xx = statusCode >= 400 && statusCode < 500 ? 1 : 0;
  const status5xx = statusCode >= 500 ? 1 : 0;

  await query(`
    INSERT INTO usage_aggregates (
      organization_id,
      date,
      total_requests,
      blockchain_ops,
      attestations_created,
      total_credits_used,
      requests_2xx,
      requests_4xx,
      requests_5xx
    ) VALUES ($1, CURRENT_DATE, 1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (organization_id, date)
    DO UPDATE SET
      total_requests = usage_aggregates.total_requests + 1,
      blockchain_ops = usage_aggregates.blockchain_ops + $2,
      attestations_created = usage_aggregates.attestations_created + $3,
      total_credits_used = usage_aggregates.total_credits_used + $4,
      requests_2xx = usage_aggregates.requests_2xx + $5,
      requests_4xx = usage_aggregates.requests_4xx + $6,
      requests_5xx = usage_aggregates.requests_5xx + $7,
      updated_at = NOW()
  `, [
    orgId,
    isBlockchainOp ? 1 : 0,
    isAttestation ? 1 : 0,
    credits,
    status2xx,
    status4xx,
    status5xx
  ]);
}
```

**Registro en main.ts:**
```typescript
// apps/api/src/main.ts
import { trackUsage } from './middleware/usage-tracking';

// Agregar DESPUÉS de authenticateAPIKey
instance.addHook('onResponse', trackUsage);
```

---

### Task 1.3: Admin API Endpoints ⏱️ 3-5 días

**Estructura de archivos:**
```
apps/api/src/modules/admin/
├── organizations/
│   ├── routes.ts
│   └── service.ts
├── payments/
│   ├── routes.ts
│   └── service.ts
└── api-keys/
    ├── routes.ts
    └── service.ts
```

**Ejemplo: Organizations Service**

**Archivo:** `apps/api/src/modules/admin/organizations/service.ts`

```typescript
import { query } from '../../../config/database';
import type { Organization } from '@proofpass/types';

export async function createOrganization(data: {
  name: string;
  email: string;
  plan_id?: string;
  billing_email?: string;
  country?: string;
}): Promise<Organization> {
  const result = await query(`
    INSERT INTO organizations (
      name,
      email,
      plan_id,
      billing_email,
      country,
      status
    ) VALUES ($1, $2, $3, $4, $5, 'active')
    RETURNING *
  `, [
    data.name,
    data.email,
    data.plan_id || (await query('SELECT id FROM plans WHERE slug = $1', ['free'])).rows[0].id,
    data.billing_email || data.email,
    data.country
  ]);

  return result.rows[0];
}

export async function listOrganizations(filters?: {
  status?: string;
  plan?: string;
  limit?: number;
  offset?: number;
}): Promise<Organization[]> {
  let queryStr = `
    SELECT
      o.*,
      p.name as plan_name,
      COUNT(u.id) as user_count
    FROM organizations o
    JOIN plans p ON o.plan_id = p.id
    LEFT JOIN users u ON o.id = u.organization_id
  `;

  const params: any[] = [];
  const conditions: string[] = [];

  if (filters?.status) {
    conditions.push(`o.status = $${params.length + 1}`);
    params.push(filters.status);
  }

  if (filters?.plan) {
    conditions.push(`p.slug = $${params.length + 1}`);
    params.push(filters.plan);
  }

  if (conditions.length > 0) {
    queryStr += ' WHERE ' + conditions.join(' AND ');
  }

  queryStr += ' GROUP BY o.id, p.name ORDER BY o.created_at DESC';

  if (filters?.limit) {
    queryStr += ` LIMIT $${params.length + 1}`;
    params.push(filters.limit);
  }

  if (filters?.offset) {
    queryStr += ` OFFSET $${params.length + 1}`;
    params.push(filters.offset);
  }

  const result = await query(queryStr, params);
  return result.rows;
}

export async function updateOrganizationPlan(
  orgId: string,
  newPlanId: string,
  subscriptionEnd?: Date
): Promise<Organization> {
  const result = await query(`
    UPDATE organizations
    SET
      plan_id = $1,
      subscription_end = $2,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `, [newPlanId, subscriptionEnd, orgId]);

  if (result.rows.length === 0) {
    throw new Error('Organization not found');
  }

  return result.rows[0];
}

export async function getOrganizationUsage(orgId: string): Promise<{
  today: any;
  month: any;
  history: any[];
}> {
  // Uso de hoy
  const todayResult = await query(`
    SELECT * FROM usage_aggregates
    WHERE organization_id = $1 AND date = CURRENT_DATE
  `, [orgId]);

  // Uso del mes
  const monthResult = await query(`
    SELECT
      SUM(total_requests) as total_requests,
      SUM(blockchain_ops) as blockchain_ops,
      SUM(attestations_created) as attestations_created,
      SUM(total_credits_used) as total_credits_used
    FROM usage_aggregates
    WHERE organization_id = $1
      AND date >= DATE_TRUNC('month', CURRENT_DATE)
  `, [orgId]);

  // Historial últimos 30 días
  const historyResult = await query(`
    SELECT * FROM usage_aggregates
    WHERE organization_id = $1
      AND date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY date DESC
  `, [orgId]);

  return {
    today: todayResult.rows[0] || {},
    month: monthResult.rows[0] || {},
    history: historyResult.rows
  };
}
```

**Routes:** `apps/api/src/modules/admin/organizations/routes.ts`

```typescript
import { FastifyInstance } from 'fastify';
import {
  createOrganization,
  listOrganizations,
  updateOrganizationPlan,
  getOrganizationUsage
} from './service';

export async function adminOrganizationRoutes(server: FastifyInstance) {
  // Crear organización
  server.post('/organizations', {
    schema: {
      description: 'Create a new organization (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          plan_id: { type: 'string', format: 'uuid' },
          billing_email: { type: 'string', format: 'email' },
          country: { type: 'string', minLength: 2, maxLength: 2 }
        }
      }
    },
    preHandler: async (request, reply) => {
      await request.jwtVerify();
      // TODO: Check if user is admin
    },
    handler: async (request, reply) => {
      const org = await createOrganization(request.body as any);
      return reply.code(201).send(org);
    }
  });

  // Listar organizaciones
  server.get('/organizations', {
    schema: {
      description: 'List all organizations (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'suspended', 'cancelled'] },
          plan: { type: 'string' },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 }
        }
      }
    },
    preHandler: async (request, reply) => {
      await request.jwtVerify();
    },
    handler: async (request) => {
      const orgs = await listOrganizations(request.query as any);
      return { organizations: orgs };
    }
  });

  // Cambiar plan
  server.patch('/organizations/:id/plan', {
    schema: {
      description: 'Update organization plan (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['plan_id'],
        properties: {
          plan_id: { type: 'string', format: 'uuid' },
          subscription_end: { type: 'string', format: 'date-time' }
        }
      }
    },
    preHandler: async (request, reply) => {
      await request.jwtVerify();
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { plan_id, subscription_end } = request.body as any;

      const org = await updateOrganizationPlan(
        id,
        plan_id,
        subscription_end ? new Date(subscription_end) : undefined
      );

      return reply.send(org);
    }
  });

  // Ver uso de organización
  server.get('/organizations/:id/usage', {
    schema: {
      description: 'Get organization usage statistics (admin only)',
      tags: ['admin'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    },
    preHandler: async (request, reply) => {
      await request.jwtVerify();
    },
    handler: async (request) => {
      const { id } = request.params as { id: string };
      const usage = await getOrganizationUsage(id);
      return usage;
    }
  });
}
```

**Registro en main.ts:**
```typescript
// apps/api/src/main.ts
import { adminOrganizationRoutes } from './modules/admin/organizations/routes';

// Registrar rutas admin (después de línea 237)
await server.register(async (instance) => {
  instance.addHook('preHandler', rateLimiters.user);
  await instance.register(adminOrganizationRoutes, { prefix: '/api/v1/admin' });
});
```

**Similarmente crear:**
- `apps/api/src/modules/admin/payments/` (registrar pagos, listar, etc.)
- `apps/api/src/modules/admin/api-keys/` (generar keys para org, listar, desactivar)

---

### Task 1.4: Migrar a Stellar Mainnet ⏱️ 1 día

**Pasos:**

1. **Crear cuenta en Stellar mainnet:**
   - Ir a https://laboratory.stellar.org/#account-creator
   - Generar keypair
   - Fondear cuenta (comprar XLM en exchange y transferir)

2. **Actualizar `.env.production.api`:**
```bash
STELLAR_NETWORK=mainnet
STELLAR_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STELLAR_PUBLIC_KEY=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

3. **Verificar en código:**
```typescript
// packages/stellar-sdk/src/stellar-client.ts
// Ya soporta mainnet, solo cambiar .env
```

4. **Testing:**
```bash
# Verificar balance
curl https://api.proofpass.co/api/v1/blockchain/balance
# Debe mostrar balance real en XLM
```

---

## 📋 FASE 2: ALTA - Frontend y Escalabilidad
**Duración:** 2-4 semanas

### Task 2.1: Admin Dashboard Frontend ⏱️ 2-3 semanas

**Setup:**
```bash
cd apps/
npx create-next-app@latest platform --typescript --tailwind --app --src-dir
cd platform
npm install @tanstack/react-query zustand recharts @radix-ui/react-dialog shadcn-ui
```

**Páginas críticas:**

1. **Dashboard principal** (`app/(admin)/dashboard/page.tsx`):
   - KPIs: Total de clientes, Revenue mensual, Requests totales
   - Gráfico de revenue últimos 6 meses
   - Alertas: Límites alcanzados, suscripciones venciendo

2. **Lista de clientes** (`app/(admin)/clients/page.tsx`):
   - Tabla con: Nombre, Plan, Status, Último pago, Uso
   - Filtros por plan y status
   - Botón "Nuevo Cliente"

3. **Detalle de cliente** (`app/(admin)/clients/[id]/page.tsx`):
   - Info básica
   - Plan actual y botón "Cambiar Plan"
   - Métricas de uso (hoy, mes, histórico)
   - API keys del cliente
   - Historial de pagos

4. **Registro de pago** (`app/(admin)/payments/page.tsx`):
   - Form: Cliente, Monto, Fecha, Método, Referencia, Período
   - Upload de comprobante
   - Botón "Registrar y Actualizar Suscripción"

---

### Task 2.2: Client Portal Frontend ⏱️ 1-2 semanas

**Páginas críticas:**

1. **Dashboard cliente** (`app/(client)/dashboard/page.tsx`):
   - Plan actual
   - Uso hoy vs límite
   - Próxima renovación
   - Call-to-action "Upgrade"

2. **API Keys** (`app/(client)/api-keys/page.tsx`):
   - Lista de keys (prefijo visible, key completa oculta)
   - Botón "Generar Nueva Key"
   - Botón "Desactivar" por key

3. **Métricas** (`app/(client)/usage/page.tsx`):
   - Gráfico de requests por día (último mes)
   - Breakdown por operation type
   - Top endpoints

---

### Task 2.3: Message Queue para Blockchain ⏱️ 3-4 días

**Setup:**
```bash
npm install bullmq ioredis
```

**Implementación:**

`apps/api/src/queues/blockchain-queue.ts`:
```typescript
import { Queue, Worker } from 'bullmq';
import { redisClient } from '../config/redis';
import { StellarClient } from '@proofpass/stellar-sdk';

export const blockchainQueue = new Queue('blockchain-anchoring', {
  connection: redisClient
});

export async function queueBlockchainAnchor(data: {
  attestationId: string;
  credential: any;
}) {
  await blockchainQueue.add('anchor', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });
}

// Worker
const worker = new Worker('blockchain-anchoring', async (job) => {
  const { attestationId, credential } = job.data;

  const client = new StellarClient(/* config */);
  const result = await client.anchorData(JSON.stringify(credential));

  // Update DB
  await query(`
    UPDATE attestations
    SET blockchain_tx_hash = $1, status = 'anchored'
    WHERE id = $2
  `, [result.txHash, attestationId]);

  return result;
}, {
  connection: redisClient
});
```

**Usar en attestations/service.ts:**
```typescript
// Cambiar línea 84-88
// De:
anchorToStellar(attestation.id, signedCredential).catch(...);

// A:
queueBlockchainAnchor({
  attestationId: attestation.id,
  credential: signedCredential
});
```

---

### Task 2.4: Redis Caching ⏱️ 2-3 días

**Implementación:**

`apps/api/src/utils/cache.ts`:
```typescript
import { redisClient } from '../config/redis';

export async function cacheGet<T>(key: string): Promise<T | null> {
  const cached = await redisClient.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheSet(key: string, value: any, ttlSeconds: number): Promise<void> {
  await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  await redisClient.del(key);
}
```

**Aplicar en attestations/routes.ts:**
```typescript
// GET /attestations/:id
handler: async (request, reply) => {
  const { id } = request.params;

  // Try cache first
  const cacheKey = `attestation:${id}`;
  const cached = await cacheGet(cacheKey);

  if (cached) {
    return reply.send(cached);
  }

  // Fetch from DB
  const attestation = await getAttestation(id, user.id);

  if (attestation) {
    // Cache for 10 minutes
    await cacheSet(cacheKey, attestation, 600);
  }

  return reply.send(attestation);
}
```

**Invalidar cache en POST/PATCH:**
```typescript
// POST /attestations
handler: async (request, reply) => {
  const attestation = await createAttestation(data, user.id);

  // Invalidate user's attestations list cache
  await cacheDel(`attestations:user:${user.id}`);

  return reply.code(201).send(attestation);
}
```

---

## ✅ Checklist de Implementación

### Fase 1 (Crítico)
- [ ] API Key Authentication Middleware
  - [ ] Crear `middleware/api-key-auth.ts`
  - [ ] Agregar tipos en `types/fastify.d.ts`
  - [ ] Registrar en `main.ts`
  - [ ] Testing con Postman/curl
- [ ] Usage Tracking Middleware
  - [ ] Crear `middleware/usage-tracking.ts`
  - [ ] Registrar en `main.ts`
  - [ ] Verificar inserts en `usage_records`
  - [ ] Verificar updates en `usage_aggregates`
- [ ] Admin API Endpoints
  - [ ] Organizations routes & service
  - [ ] Payments routes & service
  - [ ] API Keys routes & service
  - [ ] Testing de todos los endpoints
- [ ] Stellar Mainnet
  - [ ] Crear cuenta mainnet
  - [ ] Fondear con XLM
  - [ ] Actualizar `.env.production.api`
  - [ ] Testing de anchor en mainnet

### Fase 2 (Alta)
- [ ] Admin Dashboard
  - [ ] Setup Next.js project
  - [ ] Dashboard principal
  - [ ] Lista de clientes
  - [ ] Detalle de cliente
  - [ ] Registro de pagos
  - [ ] Deploy a Vercel/Netlify
- [ ] Client Portal
  - [ ] Dashboard cliente
  - [ ] Gestión de API keys
  - [ ] Métricas de uso
- [ ] Message Queue
  - [ ] Setup BullMQ
  - [ ] Queue para blockchain anchoring
  - [ ] Worker process
  - [ ] Monitoring de queue
- [ ] Redis Caching
  - [ ] Cache utils
  - [ ] Aplicar en attestations
  - [ ] Aplicar en passports
  - [ ] Cache invalidation

---

## 📊 Estimación de Esfuerzo Total

| Fase | Tasks | Días | Semanas |
|------|-------|------|---------|
| Fase 1 | 4 tasks | 8-12 días | 1.5-2.5 semanas |
| Fase 2 | 4 tasks | 15-20 días | 3-4 semanas |
| **TOTAL MVP** | **8 tasks** | **23-32 días** | **4.5-6.5 semanas** |

---

## 🎯 Prioridades

**MUST HAVE para MVP:**
- ✅ Fase 1 completa (critical)
- ✅ Admin Dashboard (Task 2.1)
- ✅ Client Portal básico (Task 2.2)

**NICE TO HAVE:**
- Message Queue (Task 2.3) - mejora robustez pero no crítico
- Redis Caching (Task 2.4) - mejora performance pero no crítico para MVP

**Recomendación:** Enfocarse en **Fase 1 + Dashboards (2.1 y 2.2)** para MVP funcional en 4-5 semanas.

---

**Próximos pasos sugeridos:**
1. Comenzar con Task 1.1 (API Key Auth) - es bloqueante para todo lo demás
2. Paralelamente, hacer Task 1.4 (Mainnet) - es independiente
3. Luego Task 1.2 (Usage Tracking) - depende de 1.1
4. Finalmente Task 1.3 (Admin API) - depende de 1.1 y 1.2
5. Una vez Fase 1 lista, comenzar frontends en paralelo

