# API Endpoints - Referencia Completa

**Base URL:** `https://api.proofpass.co/api/v1`

---

## 🔐 Autenticación

Hay dos tipos de autenticación:

### 1. JWT (para usuarios admin)
```bash
# Login
POST /auth/login
{
  "email": "admin@proofpass.co",
  "password": "password"
}

# Response
{
  "token": "eyJhbGc...",
  "user": { ... }
}

# Usar en requests:
Authorization: Bearer eyJhbGc...
```

### 2. API Key (para aplicaciones cliente)
```bash
# Usar en requests:
X-API-Key: pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 👤 Auth Endpoints

### POST /auth/register
Registrar nuevo usuario

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "organization": "Acme Corp"
}
```

**Response:** `201 Created`
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "api_key": "pk_xxxx..." // Mostrado solo una vez!
  }
}
```

---

### POST /auth/login
Iniciar sesión

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGc...",
  "user": { ... }
}
```

---

### GET /auth/me
Obtener usuario actual (requiere auth)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

## 🏢 Admin - Organizations

Todos requieren: `Authorization: Bearer <token>`

### POST /admin/organizations
Crear nueva organización

**Body:**
```json
{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "plan_id": "uuid-del-plan", // Opcional, default: free
  "billing_email": "billing@acme.com",
  "billing_contact": "John Doe",
  "country": "US",
  "subscription_start": "2024-11-01",
  "subscription_end": "2024-12-01"
}
```

**Response:** `201 Created`

---

### GET /admin/organizations
Listar todas las organizaciones

**Query params:**
- `status` - `active` | `suspended` | `cancelled`
- `plan` - `free` | `pro` | `enterprise`
- `limit` - número (default: 50, max: 100)
- `offset` - número (default: 0)

**Response:** `200 OK`
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "email": "contact@acme.com",
      "plan_name": "Pro",
      "status": "active",
      "user_count": 3,
      "api_key_count": 2,
      "created_at": "2024-10-01T..."
    }
  ],
  "total": 45
}
```

---

### GET /admin/organizations/:id
Ver detalle de organización

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "plan_name": "Pro",
  "plan_slug": "pro",
  "price_monthly": 49.00,
  "requests_per_day": 10000,
  "blockchain_ops_per_month": 1000,
  "status": "active",
  "subscription_end": "2024-12-01",
  ...
}
```

---

### PATCH /admin/organizations/:id
Actualizar organización

**Body:**
```json
{
  "name": "New Name",
  "billing_email": "newbilling@acme.com",
  "billing_address": "123 Main St, City, State 12345",
  "tax_id": "12-3456789",
  "country": "US",
  "payment_method": "Transferencia Bancaria",
  "payment_notes": "Cuenta IBAN: ...",
  "notes": "Cliente VIP"
}
```

**Response:** `200 OK`

---

### PATCH /admin/organizations/:id/plan
Cambiar plan de organización

**Body:**
```json
{
  "plan_id": "uuid-del-plan-pro",
  "subscription_end": "2024-12-31"
}
```

**Response:** `200 OK`

---

### PATCH /admin/organizations/:id/status
Cambiar status de organización

**Body:**
```json
{
  "status": "suspended" // active | suspended | cancelled
}
```

**Response:** `200 OK`

---

### GET /admin/organizations/:id/usage
Ver métricas de uso de organización

**Response:** `200 OK`
```json
{
  "today": {
    "total_requests": 245,
    "blockchain_ops": 12,
    "attestations_created": 8,
    "total_credits_used": 156
  },
  "month": {
    "total_requests": 8934,
    "blockchain_ops": 456,
    "attestations_created": 234,
    "total_credits_used": 5678,
    "success_rate": 98.5
  },
  "history": [
    {
      "date": "2024-10-30",
      "total_requests": 245,
      "blockchain_ops": 12,
      ...
    }
  ]
}
```

---

### DELETE /admin/organizations/:id
Eliminar organización (soft delete)

**Response:** `204 No Content`

---

## 💳 Admin - Payments

Todos requieren: `Authorization: Bearer <token>`

### POST /admin/payments
Registrar nuevo pago manual

**Body:**
```json
{
  "organization_id": "uuid",
  "amount": 49.00,
  "currency": "USD",
  "payment_date": "2024-10-30",
  "payment_method": "Transferencia Bancaria",
  "reference_number": "TRF-20241030-12345",
  "period_start": "2024-11-01",
  "period_end": "2024-12-01",
  "notes": "Pago plan Pro - Noviembre 2024",
  "proof_url": "https://bucket.s3.amazonaws.com/comprobante.pdf",
  "auto_extend_subscription": true // Default: true
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "amount": 49.00,
  "status": "confirmed",
  "created_at": "2024-10-30T..."
}
```

ℹ️ Si `auto_extend_subscription: true`, actualiza `organizations.subscription_end` automáticamente.

---

### GET /admin/payments
Listar todos los pagos

**Query params:**
- `organization_id` - UUID
- `status` - `pending` | `confirmed` | `rejected`
- `payment_method` - string
- `from_date` - fecha (YYYY-MM-DD)
- `to_date` - fecha (YYYY-MM-DD)
- `limit` - número (default: 50)
- `offset` - número (default: 0)

**Response:** `200 OK`
```json
{
  "payments": [
    {
      "id": "uuid",
      "organization_name": "Acme Corp",
      "organization_email": "contact@acme.com",
      "amount": 49.00,
      "payment_date": "2024-10-30",
      "payment_method": "Transferencia Bancaria",
      "status": "confirmed",
      "recorded_by_name": "Admin User"
    }
  ],
  "total": 123
}
```

---

### GET /admin/payments/:id
Ver detalle de pago

**Response:** `200 OK`

---

### PATCH /admin/payments/:id/status
Actualizar status de pago

**Body:**
```json
{
  "status": "confirmed" // pending | confirmed | rejected
}
```

**Response:** `200 OK`

---

### GET /admin/payments/stats
Estadísticas de pagos

**Query params:**
- `organization_id` - UUID (opcional)
- `from_date` - fecha (opcional)
- `to_date` - fecha (opcional)

**Response:** `200 OK`
```json
{
  "total_amount": 12345.00,
  "payment_count": 234,
  "by_method": [
    { "payment_method": "Transferencia Bancaria", "total": 8900.00, "count": 180 },
    { "payment_method": "Efectivo", "total": 2340.00, "count": 48 }
  ],
  "by_status": [
    { "status": "confirmed", "total": 11500.00, "count": 230 },
    { "status": "pending", "total": 845.00, "count": 4 }
  ]
}
```

---

### GET /admin/payments/pending
Pagos pendientes de confirmar

**Response:** `200 OK`
```json
{
  "payments": [
    {
      "id": "uuid",
      "organization_name": "Acme Corp",
      "amount": 49.00,
      "payment_date": "2024-10-29",
      "status": "pending"
    }
  ]
}
```

---

## 🔑 Admin - API Keys

Todos requieren: `Authorization: Bearer <token>`

### POST /admin/api-keys
Generar nueva API key

**Body:**
```json
{
  "organization_id": "uuid",
  "user_id": "uuid",
  "name": "Production API Key",
  "environment": "live", // live | test
  "expires_at": "2025-10-30T23:59:59Z" // Opcional
}
```

**Response:** `201 Created`
```json
{
  "apiKey": {
    "id": "uuid",
    "name": "Production API Key",
    "key_prefix": "pk_live_",
    "is_active": true,
    "created_at": "2024-10-30T..."
  },
  "plainKey": "pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "warning": "IMPORTANT: The plainKey is shown only once. Save it securely!"
}
```

⚠️ **CRÍTICO:** `plainKey` se muestra solo una vez. Guardar en lugar seguro.

---

### GET /admin/api-keys
Listar API keys de una organización

**Query params:**
- `organization_id` - UUID (requerido)
- `include_inactive` - boolean (default: false)

**Response:** `200 OK`
```json
{
  "apiKeys": [
    {
      "id": "uuid",
      "name": "Production Key",
      "key_prefix": "pk_live_",
      "is_active": true,
      "last_used_at": "2024-10-30T10:15:30Z",
      "created_at": "2024-10-01T..."
    }
  ]
}
```

---

### GET /admin/api-keys/:id
Ver detalle de API key

**Response:** `200 OK`

---

### PATCH /admin/api-keys/:id/deactivate
Desactivar API key

**Response:** `200 OK`

---

### PATCH /admin/api-keys/:id/reactivate
Reactivar API key

**Response:** `200 OK`

---

### DELETE /admin/api-keys/:id
Eliminar API key permanentemente

**Response:** `204 No Content`

---

### GET /admin/api-keys/:id/usage
Ver estadísticas de uso de API key

**Query params:**
- `days` - número (default: 30, max: 365)

**Response:** `200 OK`
```json
{
  "total_requests": 1523,
  "last_used_at": "2024-10-30T10:15:30Z",
  "daily_usage": [
    { "date": "2024-10-30", "requests": 245 },
    { "date": "2024-10-29", "requests": 189 }
  ]
}
```

---

### POST /admin/api-keys/:id/rotate
Rotar API key (generar nueva y desactivar vieja)

**Body:**
```json
{
  "name": "Rotated Production Key"
}
```

**Response:** `201 Created`
```json
{
  "newApiKey": { ... },
  "plainKey": "pk_live_xxxxxxxxx",
  "oldKeyDeactivated": true,
  "warning": "IMPORTANT: The plainKey is shown only once. Save it securely!"
}
```

---

## 📝 Attestations

### POST /attestations
Crear nueva attestation (requiere auth)

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "subject": "did:example:12345",
  "type": "SupplyChainAttestation",
  "claims": {
    "productId": "ABC-123",
    "origin": "Factory A",
    "certifiedBy": "Inspector John"
  },
  "blockchain_network": "stellar" // stellar | optimism
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "type": "SupplyChainAttestation",
  "credential": { ... },
  "qr_code": "data:image/png;base64,...",
  "status": "pending",
  "created_at": "2024-10-30T..."
}
```

ℹ️ Blockchain anchoring ocurre async. Status cambia de `pending` → `anchored`.

---

### GET /attestations
Listar mis attestations (requiere auth)

**Response:** `200 OK`
```json
{
  "attestations": [
    {
      "id": "uuid",
      "type": "SupplyChainAttestation",
      "status": "anchored",
      "blockchain_tx_hash": "abc123...",
      "created_at": "2024-10-30T..."
    }
  ]
}
```

---

### GET /attestations/:id
Ver attestation por ID (requiere auth)

**Response:** `200 OK`

---

### POST /attestations/:id/verify
Verificar attestation (público, no requiere auth)

**Response:** `200 OK`
```json
{
  "valid": true,
  "attestation": { ... },
  "verification": {
    "credentialValid": true,
    "blockchainVerified": true
  },
  "errors": []
}
```

---

## 📦 Product Passports

### POST /passports
Crear product passport (requiere auth)

**Body:**
```json
{
  "product_id": "SKU-12345",
  "name": "Organic Cotton T-Shirt",
  "description": "100% organic cotton, fair trade certified",
  "attestation_ids": [
    "uuid-attestation-1",
    "uuid-attestation-2"
  ],
  "blockchain_network": "stellar"
}
```

**Response:** `201 Created`

---

### GET /passports/:id
Ver passport por ID (requiere auth)

**Response:** `200 OK`

---

### GET /passports/product/:productId
Ver passport por product ID (requiere auth)

**Response:** `200 OK`

---

### GET /passports
Listar mis passports (requiere auth)

**Response:** `200 OK`

---

### POST /passports/:id/verify
Verificar passport y todas sus attestations (público)

**Response:** `200 OK`
```json
{
  "valid": true,
  "passport": { ... },
  "attestations_verified": [
    {
      "attestation_id": "uuid",
      "valid": true,
      "blockchain_verified": true,
      "signature_verified": true
    }
  ]
}
```

---

## 🔐 Zero-Knowledge Proofs

### POST /zkp
Generar zero-knowledge proof (requiere auth)

**Body:**
```json
{
  "attestation_id": "uuid",
  "circuit_type": "threshold", // threshold | range | set_membership
  "public_inputs": {
    "threshold": 18
  },
  "private_inputs": {
    "value": 25
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "circuit_type": "threshold",
  "proof": "...",
  "public_inputs": { ... },
  "verified": true,
  "created_at": "2024-10-30T..."
}
```

---

### GET /zkp/:id
Ver proof por ID (requiere auth)

**Response:** `200 OK`

---

### POST /zkp/:id/verify
Verificar zero-knowledge proof (público)

**Response:** `200 OK`
```json
{
  "valid": true,
  "proof": { ... }
}
```

---

### GET /zkp
Listar mis proofs (requiere auth)

**Query params:**
- `limit` - número (default: 50)
- `offset` - número (default: 0)

**Response:** `200 OK`

---

## ⛓️ Blockchain

### GET /blockchain/info
Info del blockchain (público)

**Response:** `200 OK`
```json
{
  "network": "mainnet",
  "horizon_url": "https://horizon.stellar.org",
  "public_key": "GXXXXXXXXX...",
  "asset_code": "XLM"
}
```

---

### GET /blockchain/balance
Ver balance (requiere auth)

**Response:** `200 OK`
```json
{
  "balance": "123.4567890",
  "asset": "XLM",
  "network": "mainnet"
}
```

---

### POST /blockchain/anchor
Anclar datos en blockchain (requiere auth)

**Body:**
```json
{
  "data": "Hash or string to anchor",
  "metadata": {
    "type": "certification",
    "id": "12345"
  }
}
```

**Response:** `201 Created`
```json
{
  "txHash": "abc123def456...",
  "dataHash": "sha256hash...",
  "publicKey": "GXXXXXXXXX...",
  "network": "mainnet",
  "timestamp": "2024-10-30T12:34:56Z"
}
```

---

### GET /blockchain/transactions/:hash
Ver transacción por hash (público)

**Response:** `200 OK`

---

### GET /blockchain/transactions
Ver mi historial de transacciones (requiere auth)

**Query params:**
- `limit` - número (default: 10, max: 100)

**Response:** `200 OK`

---

### POST /blockchain/verify
Verificar datos en blockchain (público)

**Body:**
```json
{
  "txHash": "abc123def456...",
  "data": "Original data to verify"
}
```

**Response:** `200 OK`
```json
{
  "verified": true,
  "transaction": { ... },
  "dataHash": "sha256hash...",
  "timestamp": "2024-10-30T12:34:56Z"
}
```

---

## 🏥 Health Checks

### GET /health
Health check básico (público)

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-10-30T12:34:56Z",
  "version": "0.1.0"
}
```

---

### GET /ready
Readiness check con DB y Redis (público)

**Response:** `200 OK`
```json
{
  "status": "ready",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2024-10-30T12:34:56Z"
}
```

---

## 📚 Documentación Interactiva

### GET /docs
Swagger UI con documentación completa

Abrir en navegador: `https://api.proofpass.co/docs`

---

## 🔢 Rate Limits

Todos los endpoints tienen rate limiting:

| Tipo | Límite | Ventana | Scope |
|------|--------|---------|-------|
| **Auth** | 5 requests | 15 minutos | Por IP |
| **User** | 60 requests | 1 minuto | Por usuario/IP |
| **Expensive** | 10 requests | 1 minuto | Por usuario/IP |
| **Global** | 100 requests | 1 minuto | Por IP |

**Headers de respuesta:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698765432000
```

**Rate limits por plan (API Key):**
| Plan | Requests/Día | Blockchain Ops/Mes |
|------|--------------|---------------------|
| **Free** | 100 | 10 |
| **Pro** | 10,000 | 1,000 |
| **Enterprise** | Ilimitado | Ilimitado |

---

## ❌ Errores Comunes

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**Solución:** Incluir header `Authorization: Bearer <token>` o `X-API-Key: <key>`

---

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "limit": 100,
  "current": 100,
  "reset_at": "2024-10-31T00:00:00Z"
}
```

**Solución:** Esperar hasta `reset_at` o upgrade de plan

---

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Solución:** Corregir el body según la documentación

---

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

---

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

**Solución:** Contactar soporte si persiste

---

## 📖 Ejemplos Completos

### Ejemplo 1: Crear organización y generar API key

```bash
# 1. Login como admin
TOKEN=$(curl -s -X POST https://api.proofpass.co/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@proofpass.co","password":"password"}' \
  | jq -r '.token')

# 2. Crear organización
ORG=$(curl -s -X POST https://api.proofpass.co/api/v1/admin/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Acme Corp",
    "email": "contact@acme.com",
    "billing_email": "billing@acme.com",
    "country": "US"
  }')

ORG_ID=$(echo $ORG | jq -r '.id')
USER_ID=$(echo $ORG | jq -r '.user_id')

# 3. Generar API key para la organización
API_KEY_RESPONSE=$(curl -s -X POST https://api.proofpass.co/api/v1/admin/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "user_id": "'$USER_ID'",
    "name": "Production Key",
    "environment": "live"
  }')

API_KEY=$(echo $API_KEY_RESPONSE | jq -r '.plainKey')

echo "API Key generada: $API_KEY"
echo "⚠️ GUARDAR en lugar seguro - no se volverá a mostrar!"
```

---

### Ejemplo 2: Usar API key para crear attestation

```bash
# Usar API key para autenticar
curl -X POST https://api.proofpass.co/api/v1/attestations \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "subject": "did:proofpass:product-12345",
    "type": "OrganicCertification",
    "claims": {
      "productId": "SKU-12345",
      "certifiedBy": "Organic Alliance",
      "certificationDate": "2024-10-30",
      "standard": "USDA Organic"
    }
  }'
```

---

### Ejemplo 3: Registrar pago y extender suscripción

```bash
curl -X POST https://api.proofpass.co/api/v1/admin/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "amount": 49.00,
    "payment_date": "2024-10-30",
    "payment_method": "Transferencia Bancaria",
    "reference_number": "TRF-20241030-001",
    "period_start": "2024-11-01",
    "period_end": "2024-12-01",
    "notes": "Pago plan Pro - Noviembre 2024",
    "auto_extend_subscription": true
  }'
```

---

## 📞 Soporte

- **Email:** support@proofpass.co
- **Docs:** https://docs.proofpass.co
- **GitHub:** https://github.com/proofpass/platform

---

**Total de endpoints:** 55+
- ✅ 3 Auth
- ✅ 8 Admin Organizations
- ✅ 6 Admin Payments
- ✅ 8 Admin API Keys
- ✅ 4 Attestations
- ✅ 5 Product Passports
- ✅ 4 Zero-Knowledge Proofs
- ✅ 7 Blockchain
- ✅ 2 Health Checks

**Última actualización:** 30 de Octubre, 2024
