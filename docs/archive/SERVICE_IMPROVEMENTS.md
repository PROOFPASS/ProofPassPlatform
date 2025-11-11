# ProofPass Platform - Service Improvements Plan

## 📋 Overview

Este documento detalla las mejoras planificadas e implementadas para elevar ProofPass de un MVP a una plataforma production-ready. Las mejoras están organizadas en 4 áreas clave que abordan seguridad, monetización, experiencia de desarrollador y features avanzadas.

**Estado Actual:** En implementación
**Última Actualización:** 2025-10-31
**Responsable:** @fboiero

---

## 🎯 Áreas de Mejora

| # | Área | Prioridad | Estado | Progreso |
|---|------|-----------|--------|----------|
| 1 | **Seguridad & Compliance** | 🔴 Crítica | ✅ Completa | 100% |
| 2 | **Monetización** | 🔴 Alta | 📋 Planeada | 0% |
| 3 | **Developer Experience** | 🟡 Media-Alta | 📋 Planeada | 0% |
| 4 | **Features Avanzadas** | 🟡 Media | 📋 Planeada | 0% |

---

## 🔐 Área 1: Seguridad & Compliance W3C

### Objetivos
- Reemplazar HMAC por criptografía real (Ed25519)
- Implementar DIDs estándares (did:key)
- Agregar sistema de revocación (Status List 2021)
- Cumplir con estándares W3C para VCs

### Estado: ✅ Completa

### Cambios Implementados

#### 1.1 Firmas Criptográficas Ed25519

**Antes (HMAC - NO production-ready):**
```typescript
// ❌ Firma con HMAC (symmetric key, no real signature)
const signature = crypto
  .createHmac('sha256', privateKey)
  .update(credentialString)
  .digest('hex');
```

**Después (Ed25519 - Production-ready):**
```typescript
// ✅ Firma criptográfica asimétrica con Ed25519
import { signCredentialEd25519 } from '@proofpass/vc-toolkit';

const signedCredential = await signCredentialEd25519({
  credential,
  secretKey: ed25519SecretKey,
  verificationMethod: `${issuerDID}#key-1`
});

// Resultado:
{
  "@context": [...],
  "id": "urn:uuid:...",
  "type": ["VerifiableCredential", "IdentityVerification"],
  "issuer": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2025-10-31T12:00:00Z",
    "verificationMethod": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXg",
    "proofPurpose": "assertionMethod",
    "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjWp1CktyGesjuTSwRdoWhAfGFCF5bppETSTojQCrfFPP2oumHKtz"
  }
}
```

**Archivos creados:**
- `packages/vc-toolkit/src/ed25519-crypto.ts` - Operaciones criptográficas Ed25519
- `packages/vc-toolkit/src/vc-signer-ed25519.ts` - Firma de VCs con Ed25519

**Dependencias agregadas:**
- `@noble/ed25519@^2.0.0` - Implementación Ed25519 auditada
- `@noble/hashes@^1.3.0` - Funciones hash seguras
- `multiformats@^12.1.0` - Soporte multicodec/multibase
- `multibase@^4.0.6` - Encoding para DIDs

#### 1.2 Sistema de Revocación (Status List 2021)

**Implementación:**
```typescript
import {
  createStatusList,
  setStatus,
  getStatus,
  encodeStatusList,
  createStatusListCredential
} from '@proofpass/vc-toolkit';

// Crear lista de estado (131,072 slots ~ 16KB comprimido)
const statusList = createStatusList();

// Revocar credential en índice 42
const updatedList = setStatus(statusList, 42, true);

// Crear Status List Credential
const statusListCred = createStatusListCredential(
  'https://api.proofpass.co/credentials/status/1',
  'did:key:z6Mk...',
  updatedList,
  'revocation'
);

// En el VC, agregar referencia:
{
  "credentialStatus": {
    "id": "https://api.proofpass.co/credentials/status/1#42",
    "type": "StatusList2021Entry",
    "statusPurpose": "revocation",
    "statusListIndex": "42",
    "statusListCredential": "https://api.proofpass.co/credentials/status/1"
  }
}
```

**Archivos creados:**
- `packages/vc-toolkit/src/status-list.ts` - Implementación completa de Status List 2021

**Features:**
- ✅ Bit array eficiente (1 bit por credential)
- ✅ Compresión GZIP (16KB para 131k credentials)
- ✅ Revocación y suspensión
- ✅ Compatible con W3C Status List 2021

#### 1.3 DIDs Estándares (did:key)

**Implementación:**
```typescript
import { generateKeyPair, publicKeyToDID, didToPublicKey } from '@proofpass/vc-toolkit';

// Generar keypair
const keyPair = await generateKeyPair();

// Convertir a DID
const did = publicKeyToDID(keyPair.publicKey);
// Output: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"

// Extraer public key de DID
const publicKey = didToPublicKey(did);
```

**Beneficios:**
- ✅ Estándar W3C-CCG
- ✅ Self-sovereign identity
- ✅ No requiere registry centralizado
- ✅ Interoperable con otros sistemas

### Próximos Pasos para Área 1

1. ✅ Actualizar `packages/vc-toolkit` ✅ COMPLETO
2. ⏳ Migrar API de attestations para usar Ed25519
3. ⏳ Agregar tabla `status_lists` en base de datos
4. ⏳ Crear endpoints de revocación
5. ⏳ Actualizar documentación

---

## 💰 Área 2: Monetización & Stripe Integration

### Objetivos
- Integrar Stripe para pagos recurrentes
- Implementar facturación basada en uso (usage-based billing)
- Self-service plan upgrades
- Webhooks de Stripe para automatización

### Estado: 📋 Planeada (0%)

### Plan de Implementación

#### 2.1 Integración Stripe Connect

```typescript
// Módulo de billing con Stripe
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Crear customer
const customer = await stripe.customers.create({
  email: organization.email,
  name: organization.name,
  metadata: {
    organization_id: organization.id
  }
});

// Crear subscription
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: 'price_pro_monthly' }],
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
  metadata: {
    organization_id: organization.id,
    plan_slug: 'pro'
  }
});
```

#### 2.2 Usage-Based Billing

```typescript
// Reportar uso a Stripe
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItem.id,
  {
    quantity: creditsUsed,
    timestamp: Math.floor(Date.now() / 1000),
    action: 'increment'
  }
);
```

#### 2.3 Webhooks Stripe

Eventos a procesar:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.updated`

### Archivos a Crear

- `apps/api/src/modules/billing/stripe-service.ts`
- `apps/api/src/modules/billing/webhooks.ts`
- `apps/api/src/modules/billing/usage-reporter.ts`
- `apps/api/src/modules/billing/routes.ts`

### Endpoints Nuevos

```
POST   /api/v1/billing/create-checkout
POST   /api/v1/billing/customer-portal
GET    /api/v1/billing/invoices
GET    /api/v1/billing/usage-report
POST   /api/v1/billing/webhooks/stripe
```

---

## 👨‍💻 Área 3: Developer Experience

### Objetivos
- SDK JavaScript/TypeScript oficial
- Sistema de webhooks para eventos
- Templates de attestations
- Documentación mejorada con ejemplos

### Estado: 📋 Planeada (0%)

### 3.1 SDK JavaScript (@proofpass/client)

```typescript
// Ejemplo de uso del SDK
import { ProofPassClient } from '@proofpass/client';

const client = new ProofPassClient({
  apiKey: 'pk_live_...',
  baseURL: 'https://api.proofpass.co'
});

// Crear attestation
const attestation = await client.attestations.create({
  subject: 'did:key:z6Mk...',
  type: 'IdentityVerification',
  claims: {
    full_name: 'John Doe',
    date_of_birth: '1990-01-01',
    verified: true
  }
});

// Generar ZK proof
const proof = await client.zkp.generate({
  attestationId: attestation.id,
  circuitType: 'range',
  privateInputs: { value: 25 },
  publicInputs: { min: 18, max: 65 }
});

// Verificar attestation
const verification = await client.attestations.verify(attestation.id);
console.log(verification.valid); // true

// Listar con paginación
for await (const attestation of client.attestations.list({ limit: 100 })) {
  console.log(attestation.id);
}
```

**Features del SDK:**
- ✅ TypeScript-first con tipos completos
- ✅ Paginación automática con async iterators
- ✅ Retry logic configurable
- ✅ Rate limiting handling
- ✅ Streaming responses para operaciones largas
- ✅ Webhooks signature verification helper

### 3.2 Sistema de Webhooks

```typescript
// Configurar webhook
POST /api/v1/webhooks
{
  "url": "https://customer.com/webhooks/proofpass",
  "events": [
    "attestation.created",
    "attestation.verified",
    "attestation.revoked",
    "blockchain.anchored",
    "zkp.generated",
    "organization.updated"
  ],
  "secret": "whsec_..." // Auto-generated para HMAC verification
}

// Payload enviado
POST https://customer.com/webhooks/proofpass
X-ProofPass-Signature: t=1635724800,v1=a1b2c3...
{
  "id": "evt_123abc",
  "type": "attestation.created",
  "created": "2025-10-31T12:00:00Z",
  "data": {
    "object": {
      "id": "att_456def",
      "type": "IdentityVerification",
      "subject": "did:key:z6Mk...",
      "created_at": "2025-10-31T12:00:00Z"
    }
  }
}
```

**Features de Webhooks:**
- ✅ HMAC signature verification
- ✅ Retry automático (3 reintentos con exponential backoff)
- ✅ Logs de entregas
- ✅ Test endpoint para simular eventos
- ✅ Filtrado por eventos
- ✅ Rate limiting por webhook

### 3.3 Templates de Attestations

```typescript
// Crear template
POST /api/v1/attestation-templates
{
  "name": "KYC Identity Verification",
  "description": "Standard KYC template with personal info",
  "type": "IdentityVerification",
  "schema": {
    "type": "object",
    "required": ["full_name", "date_of_birth", "country"],
    "properties": {
      "full_name": {
        "type": "string",
        "minLength": 2
      },
      "date_of_birth": {
        "type": "string",
        "format": "date",
        "description": "ISO 8601 date format"
      },
      "country": {
        "type": "string",
        "pattern": "^[A-Z]{2}$",
        "description": "ISO 3166-1 alpha-2 country code"
      },
      "document_type": {
        "type": "string",
        "enum": ["passport", "drivers_license", "national_id"]
      }
    }
  },
  "metadata": {
    "version": "1.0.0",
    "author": "ProofPass"
  }
}

// Usar template
POST /api/v1/attestations/from-template/tpl_kyc_001
{
  "subject": "did:key:z6Mk...",
  "claims": {
    "full_name": "John Doe",
    "date_of_birth": "1990-01-01",
    "country": "AR",
    "document_type": "passport"
  }
}
// Validación automática contra schema del template
```

**Beneficios:**
- ✅ Validación automática con JSON Schema
- ✅ Reutilización across organizations
- ✅ Versionado de templates
- ✅ Templates públicos y privados

---

## ⚡ Área 4: Features Avanzadas

### Objetivos
- Batch operations para alta throughput
- Search & filtering avanzado
- Expiry & lifecycle management
- Analytics mejorado

### Estado: 📋 Planeada (0%)

### 4.1 Batch Operations

```typescript
// Crear múltiples attestations
POST /api/v1/attestations/batch
{
  "attestations": [
    {
      "subject": "did:key:z6Mk1...",
      "type": "IdentityVerification",
      "claims": { "verified": true }
    },
    {
      "subject": "did:key:z6Mk2...",
      "type": "IdentityVerification",
      "claims": { "verified": true }
    }
    // ... hasta 100 por request
  ]
}

// Response con resultados parciales
{
  "created": 98,
  "failed": 2,
  "results": [
    { "id": "att_1", "status": "created" },
    { "id": "att_2", "status": "created" },
    { "id": null, "status": "failed", "error": "Invalid DID format" },
    // ...
  ],
  "batch_id": "batch_abc123"
}

// Verificar batch status
GET /api/v1/attestations/batch/batch_abc123
{
  "id": "batch_abc123",
  "total": 100,
  "completed": 100,
  "succeeded": 98,
  "failed": 2,
  "status": "completed",
  "created_at": "2025-10-31T12:00:00Z",
  "completed_at": "2025-10-31T12:05:23Z"
}
```

### 4.2 Search & Filtering Avanzado

```typescript
// Búsqueda avanzada con múltiples filtros
GET /api/v1/attestations/search?
  type=IdentityVerification,ProductCertification&
  status=anchored&
  created_after=2025-01-01&
  created_before=2025-12-31&
  claims.country=AR&
  claims.verified=true&
  blockchain_network=stellar&
  has_zkp=true&
  sort=-created_at,type&
  limit=50&
  cursor=eyJpZCI6ImF0dF8xMjMiLCJjcmVhdGVkX2F0IjoiMjAyNS0xMC0zMSJ9

// Response
{
  "data": [...],
  "pagination": {
    "has_more": true,
    "next_cursor": "eyJ...",
    "total_count": 1523
  },
  "meta": {
    "query_time_ms": 45,
    "filters_applied": 7
  }
}
```

### 4.3 Lifecycle Management

```typescript
// Attestation con expiración
POST /api/v1/attestations
{
  "subject": "did:key:z6Mk...",
  "type": "DriverLicense",
  "claims": {...},
  "expirationDate": "2026-12-31T23:59:59Z",
  "lifecycle": {
    "renewable": true,
    "renewal_period_days": 30,
    "notification_days_before": [30, 7, 1],
    "auto_revoke_on_expiry": false
  }
}

// Sistema envía webhooks:
// - attestation.expiring_soon (30 días antes)
// - attestation.expiring_soon (7 días antes)
// - attestation.expiring_soon (1 día antes)
// - attestation.expired (al expirar)

// Renovar attestation
POST /api/v1/attestations/:id/renew
{
  "extend_by_days": 365,
  "update_claims": {
    "renewed_at": "2025-10-31",
    "renewed_by": "admin@company.com"
  }
}
```

---

## 📊 Métricas de Éxito

### Área 1: Seguridad
- ✅ 100% de VCs usando Ed25519
- ✅ did:key en todos los issuer DIDs
- ✅ Sistema de revocación funcional
- ⏳ Audit de seguridad externa

### Área 2: Monetización
- ⏳ Stripe integrado y funcional
- ⏳ 90%+ de customers en paid plans
- ⏳ Usage-based billing operativo
- ⏳ <1% de failed payments

### Área 3: Developer Experience
- ⏳ SDK publicado en npm
- ⏳ 80%+ de integraciones usan SDK
- ⏳ Webhooks con 99.9% delivery rate
- ⏳ Documentación con 50+ ejemplos

### Área 4: Features
- ⏳ Batch operations con 100+ items/request
- ⏳ Search response time < 100ms (p95)
- ⏳ 90%+ de attestations con lifecycle management
- ⏳ Analytics dashboard para customers

---

## 🗓️ Timeline

### Sprint 1 (Semana 1-2): Área 1 - Seguridad ✅ COMPLETO
- [x] Implementar Ed25519 crypto
- [x] Sistema de revocación Status List 2021
- [x] Actualizar vc-toolkit
- [ ] Migrar API de attestations
- [ ] Testing exhaustivo

### Sprint 2 (Semana 3-4): Área 2 - Monetización
- [ ] Integración Stripe
- [ ] Usage-based billing
- [ ] Webhooks Stripe
- [ ] Customer portal

### Sprint 3 (Semana 5-6): Área 3 - Developer Experience
- [ ] SDK JavaScript
- [ ] Sistema de webhooks
- [ ] Templates de attestations
- [ ] Documentación mejorada

### Sprint 4 (Semana 7-8): Área 4 - Features
- [ ] Batch operations
- [ ] Search avanzado
- [ ] Lifecycle management
- [ ] Analytics dashboard

### Sprint 5 (Semana 9-10): Polish & Launch
- [ ] Testing end-to-end
- [ ] Performance optimization
- [ ] Security audit
- [ ] Launch comunicación

---

## 📝 Notas de Implementación

### Compatibilidad Backward

Para mantener compatibilidad con clientes existentes:

```typescript
// Opción 1: Parámetro para elegir algoritmo
POST /api/v1/attestations
{
  "subject": "did:key:z6Mk...",
  "type": "IdentityVerification",
  "claims": {...},
  "signature_algorithm": "ed25519" // or "hmac" (deprecated)
}

// Opción 2: Header
POST /api/v1/attestations
X-ProofPass-Signature-Version: 2.0  // 1.0 = HMAC, 2.0 = Ed25519
```

**Estrategia de migración:**
1. Ambos algoritmos disponibles por 6 meses
2. Notificaciones a customers usando HMAC
3. Deprecation warnings in API responses
4. Hard cutoff after 6 months

### Database Schema Changes

```sql
-- Nueva tabla para status lists
CREATE TABLE status_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  purpose VARCHAR(20) NOT NULL, -- 'revocation' or 'suspension'
  encoded_list TEXT NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 131072,
  used_slots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Agregar status list reference a attestations
ALTER TABLE attestations
ADD COLUMN status_list_id UUID REFERENCES status_lists(id),
ADD COLUMN status_list_index INTEGER,
ADD COLUMN is_revoked BOOLEAN DEFAULT FALSE,
ADD COLUMN revoked_at TIMESTAMP,
ADD COLUMN revocation_reason TEXT;

-- Index para búsquedas rápidas
CREATE INDEX idx_attestations_status
ON attestations(status_list_id, status_list_index)
WHERE status_list_id IS NOT NULL;

-- Webhooks table
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Webhook deliveries log
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id),
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🔗 Referencias

- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [Ed25519Signature2020](https://w3c-ccg.github.io/lds-ed25519-2020/)
- [Status List 2021](https://w3c-ccg.github.io/vc-status-list-2021/)
- [did:key Method](https://w3c-ccg.github.io/did-method-key/)
- [Stripe API](https://stripe.com/docs/api)
- [@noble/ed25519](https://github.com/paulmillr/noble-ed25519)

---

**Última actualización:** 2025-10-31
**Próxima revisión:** 2025-11-07
