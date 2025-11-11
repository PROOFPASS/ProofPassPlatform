# Dashboard Administrativo - platform.proofpass.co

Guía completa para gestionar clientes, licencias y pagos desde el panel administrativo.

## 🎯 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│         PLATFORM.PROOFPASS.CO                           │
│         Dashboard Administrativo                        │
│                                                         │
│  ┌──────────────────────────────────────────┐          │
│  │         Gestión de Clientes              │          │
│  │  • Crear/Editar organizaciones           │          │
│  │  • Asignar planes                        │          │
│  │  • Configurar límites personalizados     │          │
│  │  • Suspender/Activar cuentas             │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  ┌──────────────────────────────────────────┐          │
│  │         Gestión de Pagos                 │          │
│  │  • Registrar pagos manualmente           │          │
│  │  • Generar facturas                      │          │
│  │  • Renovar suscripciones                 │          │
│  │  • Ver historial de pagos                │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  ┌──────────────────────────────────────────┐          │
│  │         Monitoreo y Métricas             │          │
│  │  • Ver uso por cliente                   │          │
│  │  • Alertas de límites                    │          │
│  │  • Reportes de consumo                   │          │
│  │  • Logs de actividad                     │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  ┌──────────────────────────────────────────┐          │
│  │         Gestión de Planes                │          │
│  │  • Crear/Modificar planes                │          │
│  │  • Definir límites                       │          │
│  │  • Configurar precios                    │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

## 📊 Modelo de Datos Simplificado

### Organización (Cliente)
```json
{
  "id": "uuid",
  "name": "ACME Corporation",
  "email": "admin@acme.com",
  "domain": "acme.com",
  "plan": "Pro",
  "status": "active",

  "billing": {
    "email": "billing@acme.com",
    "contact": "Juan Pérez",
    "address": "Av. Principal 123, Buenos Aires",
    "tax_id": "30-12345678-9",
    "payment_method": "transferencia"
  },

  "subscription": {
    "start": "2024-01-01",
    "end": "2025-01-01"
  },

  "limits": {
    "requests_per_day": 10000,
    "blockchain_ops_per_month": 1000
  },

  "usage_today": {
    "requests": 2450,
    "blockchain_ops": 45,
    "percentage": 24.5
  }
}
```

### Planes Disponibles

| Plan | Precio/Mes | Requests/Día | Blockchain/Mes | Usuarios | API Keys |
|------|------------|--------------|----------------|----------|----------|
| Free | $0 | 100 | 10 | 1 | 1 |
| Pro | $49 | 10,000 | 1,000 | 5 | 3 |
| Enterprise | $499 | Ilimitado | Ilimitado | Ilimitado | Ilimitado |

## 🔄 Flujos de Trabajo Principales

### 1. Onboarding de Nuevo Cliente

```
1. Cliente se registra en platform.proofpass.co
   ↓
2. Sistema crea organización con plan "Free"
   ↓
3. Admin revisa y aprueba la cuenta
   ↓
4. Cliente puede generar API keys y empezar a usar
   ↓
5. Cuando quiere upgrade, contacta al admin
   ↓
6. Admin cambia plan y registra pago
```

#### Pasos en el Dashboard:

**Ver Nueva Solicitud:**
```
Dashboard → Clientes → Pendientes de Aprobación
- Ver detalles del cliente
- Revisar información
- Aprobar o rechazar
```

**Cambiar Plan:**
```
Dashboard → Clientes → [Seleccionar cliente] → Editar
- Cambiar plan a "Pro" o "Enterprise"
- Establecer fecha de inicio y fin de suscripción
- Configurar límites personalizados (opcional)
- Guardar cambios
```

### 2. Registro de Pago Manual

```
Cliente realiza pago (transferencia/efectivo/etc)
   ↓
Admin recibe comprobante por email
   ↓
Admin registra pago en el sistema
   ↓
Sistema actualiza subscription_end
   ↓
Sistema genera factura (opcional)
   ↓
Email automático al cliente confirmando pago
```

#### Pasos en el Dashboard:

```
Dashboard → Pagos → Registrar Nuevo Pago

Formulario:
- Cliente: [Selector]
- Monto: $49.00
- Moneda: USD
- Fecha de Pago: 2024-10-30
- Método: Transferencia Bancaria
- Referencia: TRF-20241030-12345
- Período: 2024-11-01 al 2025-11-01
- Comprobante: [Subir archivo PDF/Imagen]
- Notas: "Pago plan Pro - Renovación anual"

[Guardar Pago]
```

### 3. Generación de Factura

```
Dashboard → Facturas → Nueva Factura

Datos automáticos del cliente:
- Razón Social: ACME Corporation
- CUIT/Tax ID: 30-12345678-9
- Dirección: Av. Principal 123

Items de factura:
- Plan Pro - Mes de Noviembre 2024: $49.00

Subtotal: $49.00
IVA (21%): $10.29
Total: $59.29

[Generar Factura PDF]
```

### 4. Monitoreo de Uso

**Vista de Cliente Individual:**
```
Dashboard → Clientes → ACME Corp → Métricas

Uso Hoy:
- Requests: 2,450 / 10,000 (24.5%)
- Blockchain Ops: 45 / 1,000 (4.5%)
- Status: ✓ Dentro de límites

Uso Este Mes:
- Total Requests: 85,432 / 300,000 (28.5%)
- Blockchain Ops: 523 / 1,000 (52.3%)

Gráfico de uso últimos 30 días...

Últimas 10 operaciones:
[timestamp] POST /blockchain/anchor - 200 OK
[timestamp] GET /attestations/abc123 - 200 OK
...
```

**Vista Global:**
```
Dashboard → Métricas → Resumen

Clientes Activos: 45
Total Requests Hoy: 125,432
Revenue Mensual: $2,205

Alertas:
⚠️ Cliente XYZ al 95% del límite
⚠️ Cliente ABC subscripción vence en 3 días
```

### 5. Gestión de Límites

**Alertas Automáticas:**
- Cliente al 80% del límite → Email de aviso
- Cliente al 95% del límite → Email urgente + suspensión preventiva
- Cliente alcanza 100% → Rate limit activado

**Acciones del Admin:**
```
Dashboard → Clientes → [Cliente] → Límites

Opciones:
1. Aumentar límite temporalmente
2. Sugerir upgrade de plan
3. Reset del contador (si fue error)
4. Suspender cuenta si no paga
```

## 🎨 Estructura del Dashboard

### Menú Principal

```
┌─────────────────────────────────────┐
│ ProofPass Platform                  │
├─────────────────────────────────────┤
│ 📊 Dashboard                        │
│ 👥 Clientes                         │
│    ├─ Todos los clientes            │
│    ├─ Nuevas solicitudes            │
│    ├─ Por vencer                    │
│    └─ Suspendidos                   │
│ 💳 Pagos                            │
│    ├─ Registrar pago                │
│    ├─ Historial                     │
│    └─ Pagos pendientes              │
│ 📄 Facturas                         │
│    ├─ Generar factura               │
│    ├─ Todas las facturas            │
│    └─ Facturas impagas              │
│ 📈 Métricas                         │
│    ├─ Uso global                    │
│    ├─ Por cliente                   │
│    └─ Reportes                      │
│ ⚙️  Planes                          │
│    ├─ Ver planes                    │
│    └─ Editar planes                 │
│ 📋 Logs                             │
│    └─ Actividad reciente            │
└─────────────────────────────────────┘
```

### Dashboard Principal

```
┌──────────────────────────────────────────────┐
│ Dashboard - Resumen Ejecutivo               │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐        │
│  │   45   │  │  2,205 │  │ 125k   │        │
│  │Clientes│  │$/Mes   │  │Requests│        │
│  └────────┘  └────────┘  └────────┘        │
│                                              │
│  Alertas (3):                                │
│  ⚠️ Cliente ABC - Límite al 95%             │
│  ⚠️ Cliente XYZ - Subscripción vence hoy    │
│  ⚠️ Cliente DEF - Pago pendiente            │
│                                              │
│  Revenue Últimos 6 Meses:                    │
│  [Gráfico de barras]                         │
│                                              │
│  Top Clientes por Uso:                       │
│  1. ACME Corp - 85k requests                 │
│  2. Tech SA - 72k requests                   │
│  3. Startup LLC - 45k requests               │
│                                              │
└──────────────────────────────────────────────┘
```

### Lista de Clientes

```
┌──────────────────────────────────────────────────────────┐
│ Clientes                              [+ Nuevo Cliente]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 🔍 Buscar: [...] │ Plan: [Todos ▼] │ Estado: [Todos ▼]│
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ ACME Corp                        ✓ Pro  │ Active │   │
│ │ admin@acme.com                                    │   │
│ │ Uso hoy: 2,450/10,000 (24%)     Vence: 2025-01-01│   │
│ │ [Ver Métricas] [Editar] [Gestionar Pago]        │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Tech SA                         ✓ Enterprise      │   │
│ │ contact@techsa.com                    │ Active    │   │
│ │ Uso hoy: Ilimitado              Vence: 2024-12-15│   │
│ │ [Ver Métricas] [Editar] [Gestionar Pago]        │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Startup LLC                      ⚠️ Free          │   │
│ │ info@startup.com                      │ Suspended│   │
│ │ Límite alcanzado                Vencido           │   │
│ │ [Reactivar] [Cambiar Plan] [Contactar]          │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ Mostrando 1-10 de 45 clientes       [1][2][3][4][5]    │
└──────────────────────────────────────────────────────────┘
```

### Detalle de Cliente

```
┌──────────────────────────────────────────────────────────┐
│ ← Volver a Clientes                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ACME Corporation                              [Editar]   │
│ admin@acme.com                                           │
│ Status: ✓ Active │ Plan: Pro                            │
│                                                          │
│ ┌─ Información ──────────────────────────────────────┐  │
│ │ Nombre: ACME Corporation                           │  │
│ │ Email: admin@acme.com                              │  │
│ │ Dominio: acme.com                                  │  │
│ │ Contacto Billing: Juan Pérez                       │  │
│ │ CUIT: 30-12345678-9                                │  │
│ │ Registrado: 2024-01-15                             │  │
│ │ Subscripción: 2024-11-01 al 2025-11-01            │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ Uso y Límites ─────────────────────────────────────┐ │
│ │ Requests Hoy: 2,450 / 10,000 (24.5%)              │ │
│ │ [████████░░░░░░░░░░░░░░░░░░] 24.5%               │ │
│ │                                                    │ │
│ │ Blockchain Ops (Mes): 523 / 1,000 (52.3%)        │ │
│ │ [█████████████░░░░░░░░░░░░░] 52.3%               │ │
│ │                                                    │ │
│ │ Usuarios: 3 / 5                                    │ │
│ │ API Keys: 2 / 3                                    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ Pagos Recientes ───────────────────────────────────┐ │
│ │ 2024-10-30  $49.00  Transferencia  ✓ Confirmado   │ │
│ │ 2024-09-30  $49.00  Transferencia  ✓ Confirmado   │ │
│ │ 2024-08-30  $49.00  Efectivo       ✓ Confirmado   │ │
│ │                               [Ver Todos los Pagos]│ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ Acciones Rápidas ──────────────────────────────────┐ │
│ │ [Registrar Pago] [Generar Factura]                 │ │
│ │ [Cambiar Plan] [Suspender Cuenta]                  │ │
│ │ [Ver Métricas Detalladas] [Ver API Keys]           │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 🔐 Portal del Cliente

Los clientes acceden a su propio portal en `platform.proofpass.co/client`

### Dashboard del Cliente

```
┌──────────────────────────────────────────────────────────┐
│ Bienvenido, ACME Corp                        [Mi Cuenta] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Plan Actual: Pro                         [Upgrade Plan]  │
│ Válido hasta: 2025-01-01                                 │
│                                                          │
│ ┌─ Uso Actual ─────────────────────────────────────────┐ │
│ │ Requests Hoy:                                        │ │
│ │ 2,450 / 10,000 (24.5%)                               │ │
│ │ [████████░░░░░░░░░░░░░░░░░░]                       │ │
│ │                                                      │ │
│ │ Blockchain Ops (Este Mes):                           │ │
│ │ 523 / 1,000 (52.3%)                                  │ │
│ │ [█████████████░░░░░░░░░░░░░]                       │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ API Keys ───────────────────────────────────────────┐ │
│ │ Production Key            Activa  [Ver] [Rotar]     │ │
│ │ pk_live_abc123...         2024-10-29                 │ │
│ │                                                      │ │
│ │ Test Key                  Activa  [Ver] [Rotar]     │ │
│ │ pk_test_xyz789...         2024-10-15                 │ │
│ │                                          [+ Nueva]   │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ Últimos Pagos ──────────────────────────────────────┐ │
│ │ 2024-10-30  $49.00  Confirmado  [Ver Factura]       │ │
│ │ 2024-09-30  $49.00  Confirmado  [Ver Factura]       │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ [Documentación API] [Soporte] [Configuración]           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 📧 Notificaciones Automáticas

### Para el Cliente:

1. **Bienvenida**: Al registrarse
2. **API Key generada**: Con instrucciones
3. **80% de límite**: Advertencia temprana
4. **95% de límite**: Advertencia urgente
5. **Límite alcanzado**: Servicio suspendido temporalmente
6. **Pago confirmado**: Con factura adjunta
7. **Subscripción por vencer**: 7 días antes

### Para el Admin:

1. **Nueva solicitud**: Cliente se registró
2. **Cliente al 95%**: Alerta de límite
3. **Pago recibido**: Cliente envió comprobante
4. **Subscripción vencida**: Cliente sin renovar

## 📊 Reportes

### Reporte Mensual de Revenue

```
Mes: Octubre 2024

Total Facturado: $2,205.00
Total Cobrado: $2,050.00
Pendiente de Cobro: $155.00

Por Plan:
- Free: 0 clientes × $0 = $0
- Pro: 35 clientes × $49 = $1,715
- Enterprise: 10 clientes × $49 = $490

Nuevos Clientes: 5
Bajas: 2
Net Growth: +3
```

### Reporte de Uso

```
Período: Últimos 30 días

Total Requests: 2,450,432
Total Blockchain Ops: 12,543
Total Attestations: 8,234

Top Endpoints:
1. POST /blockchain/anchor - 12,543 (50%)
2. POST /attestations - 8,234 (33%)
3. GET /passports/:id - 4,123 (17%)

Promedio Response Time: 245ms
```

## 🔄 Automatizaciones Futuras

Cuando integres Stripe u otros proveedores:

```typescript
// Webhook de Stripe
POST /webhooks/stripe
{
  "type": "payment_intent.succeeded",
  "data": {
    "customer": "cus_ABC123",
    "amount": 4900,
    "currency": "usd"
  }
}

// Auto-actualiza:
// - Status de pago a "confirmed"
// - Extiende subscription_end
// - Genera factura automática
// - Envía email al cliente
```

## 📞 Soporte

Para implementar el dashboard:
- Framework recomendado: Next.js / React
- UI Library: shadcn/ui, Tailwind CSS
- Gráficos: Recharts, Chart.js
- Tablas: TanStack Table

Ver [CLIENT_PORTAL_GUIDE.md](CLIENT_PORTAL_GUIDE.md) para detalles de implementación.
