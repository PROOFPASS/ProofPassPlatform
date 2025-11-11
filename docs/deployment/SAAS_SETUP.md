# ProofPass - Plataforma SaaS Multi-Tenant

Sistema completo de gestión de clientes, licencias y facturación con pagos manuales.

## 🎯 Visión General

ProofPass es una plataforma SaaS que permite a empresas usar el API de blockchain y attestations mediante suscripciones mensuales. El sistema incluye:

- **Dashboard Administrativo** (`platform.proofpass.co`) - Para gestionar clientes y pagos
- **API Backend** (`api.proofpass.co`) - Con autenticación por API keys y rate limiting
- **Portal de Cliente** (`platform.proofpass.co/client`) - Para que clientes vean su uso y gestionen API keys

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                PLATFORM.PROOFPASS.CO                        │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Admin Dashboard │         │ Client Portal    │         │
│  │  - Clientes      │         │ - API Keys       │         │
│  │  - Pagos         │         │ - Métricas       │         │
│  │  - Facturas      │         │ - Facturación    │         │
│  │  - Métricas      │         │                  │         │
│  └──────────────────┘         └──────────────────┘         │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS
                 │
┌────────────────▼────────────────────────────────────────────┐
│                  API.PROOFPASS.CO                           │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Auth Middleware                             │          │
│  │  - JWT (usuarios admin)                      │          │
│  │  - API Keys (clientes)                       │          │
│  │  - Rate Limiting por plan                    │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Usage Tracking                               │          │
│  │  - Registro de cada request                   │          │
│  │  - Agregación diaria                          │          │
│  │  - Alertas de límites                         │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Business Logic                               │          │
│  │  - Blockchain Operations                      │          │
│  │  - Attestations                               │          │
│  │  - Passports                                  │          │
│  │  - ZKP                                        │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Modelo de Negocio

### Planes

| Plan | Precio | Requests/Día | Blockchain/Mes | Usuarios | Características |
|------|--------|--------------|----------------|----------|-----------------|
| **Free** | $0 | 100 | 10 | 1 | Blockchain, Attestations |
| **Pro** | $49/mes | 10,000 | 1,000 | 5 | Todo + Passports, ZKP |
| **Enterprise** | $499/mes | Ilimitado | Ilimitado | Ilimitado | Todo + Custom + SLA |

### Sistema de Créditos

Cada operación consume créditos:
- Request básico: 1 crédito
- Blockchain anchor: 10 créditos
- Attestation: 5 créditos
- Passport: 3 créditos
- ZKP operation: 20 créditos

## 🗄️ Base de Datos

### Tablas Principales

1. **plans** - Definición de planes de servicio
2. **organizations** - Clientes/Organizaciones
3. **users** - Usuarios vinculados a organizaciones
4. **api_keys** - API keys para autenticación
5. **usage_records** - Tracking detallado de uso (particionada por mes)
6. **usage_aggregates** - Resúmenes diarios para dashboards rápidos
7. **payments** - Registro manual de pagos
8. **invoices** - Facturas generadas
9. **activity_logs** - Historial de acciones

### Migración

```bash
# Ejecutar migración
psql -U proofpass_user -d proofpass_prod \
  -f apps/api/src/config/migrations/003_create_saas_tables.sql
```

## 🔑 Sistema de API Keys

### Formato

```
Producción: pk_live_abc123def456...
Test:       pk_test_abc123def456...
```

### Generación

```typescript
import { APIKeyManager } from './utils/api-keys';

// Generar nueva key
const { key, hash } = APIKeyManager.generate('pk_live_');

// Mostrar al usuario (UNA SOLA VEZ):
console.log('Tu API Key:', key);

// Guardar hash en DB:
await db.query('INSERT INTO api_keys (key_hash, ...) VALUES ($1, ...)', [hash]);
```

### Uso por el Cliente

```javascript
// En su aplicación
const response = await fetch('https://api.proofpass.co/api/v1/blockchain/anchor', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'pk_live_abc123def456...'
  },
  body: JSON.stringify({ data: 'Mi certificación' })
});
```

## 🔐 Autenticación

### Para Administradores (JWT)

```javascript
// Login
POST /api/v1/auth/login
{
  "email": "admin@proofpass.co",
  "password": "..."
}

Response:
{
  "token": "eyJhbGc...",
  "user": { ... }
}

// Usar token
GET /api/v1/admin/organizations
Headers: {
  "Authorization": "Bearer eyJhbGc..."
}
```

### Para Clientes (API Key)

```javascript
// Cualquier endpoint del API
GET /api/v1/blockchain/info
Headers: {
  "X-API-Key": "pk_live_..."
}
```

## 📈 Rate Limiting

### Por Plan

```typescript
// Free: 100 requests/día
// Pro: 10,000 requests/día
// Enterprise: Ilimitado

// Si el cliente excede el límite:
Response: 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "limit": 100,
  "current": 100,
  "reset_at": "2024-10-31T00:00:00Z"
}
```

### Tracking

Cada request se registra automáticamente en `usage_records`:

```typescript
// Middleware trackUsage() registra:
{
  "organization_id": "uuid",
  "endpoint": "/blockchain/anchor",
  "method": "POST",
  "status_code": 201,
  "operation_type": "blockchain_anchor",
  "credits_used": 10,
  "recorded_at": "2024-10-30T12:34:56Z"
}
```

## 💳 Gestión de Pagos (Manual)

### Flujo

```
1. Cliente contacta para upgrade/renovación
   ↓
2. Admin envía datos bancarios
   ↓
3. Cliente realiza pago (transferencia/efectivo/cheque)
   ↓
4. Cliente envía comprobante por email
   ↓
5. Admin verifica pago en banco
   ↓
6. Admin registra pago en platform.proofpass.co
   ↓
7. Sistema actualiza subscription_end automáticamente
   ↓
8. Admin genera factura (opcional)
   ↓
9. Sistema envía email al cliente con confirmación
```

### Registro en el Sistema

```sql
INSERT INTO payments (
  organization_id,
  amount,
  currency,
  payment_date,
  payment_method,
  reference_number,
  period_start,
  period_end,
  status,
  notes
) VALUES (
  'uuid-del-cliente',
  49.00,
  'USD',
  '2024-10-30',
  'Transferencia Bancaria',
  'TRF-20241030-12345',
  '2024-11-01',
  '2024-12-01',
  'confirmed',
  'Pago plan Pro - mes de noviembre'
);

-- Actualizar subscription
UPDATE organizations
SET subscription_end = '2024-12-01'
WHERE id = 'uuid-del-cliente';
```

## 📊 Dashboard Administrativo

### Pantallas Principales

1. **Dashboard Principal**
   - KPIs: Clientes activos, Revenue mensual, Requests totales
   - Alertas: Límites alcanzados, Subscripciones venciendo, Pagos pendientes
   - Gráficos: Revenue últimos 6 meses, Uso por cliente

2. **Gestión de Clientes**
   - Lista con búsqueda y filtros
   - Ver detalle de cada cliente
   - Cambiar plan
   - Ver métricas de uso
   - Suspender/Activar cuenta

3. **Gestión de Pagos**
   - Registrar nuevo pago
   - Historial de pagos
   - Pagos pendientes de confirmar
   - Vincular con factura

4. **Facturas**
   - Generar nueva factura
   - Lista de facturas
   - Descargar PDF
   - Enviar por email

5. **Métricas**
   - Uso global en tiempo real
   - Uso por cliente
   - Reportes personalizados
   - Exportar datos

## 👤 Portal del Cliente

### Funcionalidades

1. **Dashboard**
   - Ver plan actual
   - Uso en tiempo real
   - Límites disponibles
   - Próxima fecha de renovación

2. **API Keys**
   - Ver API keys (ocultas)
   - Generar nueva key
   - Rotar keys
   - Desactivar keys

3. **Métricas**
   - Uso histórico
   - Gráficos de consumo
   - Logs de requests

4. **Facturación**
   - Ver facturas
   - Descargar PDFs
   - Historial de pagos

5. **Soporte**
   - Documentación del API
   - Ejemplos de código
   - Contacto con soporte

## 🚀 Implementación

### Paso 1: Base de Datos

```bash
# Ejecutar migración
cd apps/api
psql -U proofpass_user -d proofpass_prod \
  -f src/config/migrations/003_create_saas_tables.sql

# Verificar tablas creadas
psql -U proofpass_user -d proofpass_prod -c "\dt"
```

### Paso 2: Backend API

Los endpoints ya están parcialmente implementados en `apps/api/src/modules/`.

**Falta agregar:**
- `apps/api/src/modules/admin/` - Endpoints administrativos
- `apps/api/src/modules/organizations/` - Gestión de organizaciones
- `apps/api/src/middleware/api-key-auth.ts` - Autenticación por API key
- `apps/api/src/middleware/usage-tracking.ts` - Tracking de uso

### Paso 3: Frontend Platform

Crear en Next.js/React:

```
apps/platform/
├── app/
│   ├── (admin)/
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── payments/
│   │   ├── invoices/
│   │   └── metrics/
│   └── (client)/
│       ├── dashboard/
│       ├── api-keys/
│       ├── usage/
│       └── billing/
├── components/
├── lib/
└── hooks/
```

## 📚 Documentación

### Para Desarrolladores

- [SAAS_ARCHITECTURE.md](docs/SAAS_ARCHITECTURE.md) - Arquitectura técnica completa
- [ADMIN_DASHBOARD_GUIDE.md](docs/ADMIN_DASHBOARD_GUIDE.md) - Guía del dashboard admin
- [API_DEPLOYMENT_GUIDE.md](docs/API_DEPLOYMENT_GUIDE.md) - Deployment del API
- [FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md) - Integrar frontend con API

### Para Administradores

- **ADMIN_DASHBOARD_GUIDE.md** - Cómo usar el dashboard administrativo
- Flujos de trabajo: Onboarding, Pagos, Facturas
- Reportes y métricas

### Para Clientes

- **API Documentation** - En `https://api.proofpass.co/docs`
- Ejemplos de código
- Guías de inicio rápido

## 🔮 Roadmap

### Fase 1: MVP (Actual)
- ✅ Gestión manual de clientes
- ✅ Registro manual de pagos
- ✅ API Keys y rate limiting
- ✅ Tracking de uso básico
- ⏳ Dashboard administrativo
- ⏳ Portal de cliente

### Fase 2: Automatización
- ⏳ Integración con Stripe
- ⏳ Pagos recurrentes automáticos
- ⏳ Webhooks de pago
- ⏳ Auto-renovación de subscripciones

### Fase 3: Advanced Features
- ⏳ Pagos en criptomonedas
- ⏳ Marketplace de integraciones
- ⏳ Reseller program
- ⏳ White-label solution

## 🆘 Soporte

- **Email:** support@proofpass.co
- **Docs:** https://docs.proofpass.co
- **GitHub:** Issues y PRs bienvenidos

## 📄 Licencia

Ver [LICENSE](LICENSE) para detalles.

---

**🚀 Sistema completo de gestión SaaS listo para implementar!**

Ver documentación detallada en `/docs` para cada componente.
