# Fase 2: Platform Dashboard (Frontend Admin)

**Objetivo**: Crear el dashboard administrativo web para gestionar la plataforma SaaS

**URL**: platform.proofpass.co

**Stack**: Next.js 14 + TypeScript + TailwindCSS

---

## 1. Visión General

### Usuarios del Dashboard
1. **Admin (Mangoste)**: Control total de la plataforma
   - Gestión de organizaciones
   - Registro manual de pagos
   - Generación de API keys
   - Visualización de métricas
   - Gestión de planes

2. **Organizaciones (Futuro)**: Self-service portal
   - Ver su propio dashboard
   - Generar sus API keys
   - Ver su uso y facturación
   - Gestionar su equipo

### Arquitectura
```
platform.proofpass.co (Next.js 14)
    ↓ API calls (JWT Auth)
api.proofpass.co (Fastify Backend)
    ↓
PostgreSQL + Redis
```

---

## 2. Estructura del Proyecto

```
apps/platform/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Dashboard layout con sidebar
│   │   ├── page.tsx             # Home/Overview
│   │   ├── organizations/
│   │   │   ├── page.tsx         # Lista de orgs
│   │   │   ├── [id]/page.tsx   # Detalle org
│   │   │   └── new/page.tsx    # Nueva org
│   │   ├── payments/
│   │   │   ├── page.tsx         # Lista de pagos
│   │   │   ├── [id]/page.tsx   # Detalle pago
│   │   │   └── new/page.tsx    # Registrar pago
│   │   ├── api-keys/
│   │   │   ├── page.tsx         # Lista de keys
│   │   │   └── generate/page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx         # Métricas y gráficos
│   │   └── settings/
│   │       └── page.tsx         # Configuración
│   └── api/
│       └── auth/                # NextAuth.js endpoints
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   ├── StatsCard.tsx
│   │   └── DataTable.tsx
│   ├── organizations/
│   │   ├── OrganizationList.tsx
│   │   ├── OrganizationForm.tsx
│   │   └── OrganizationDetails.tsx
│   ├── payments/
│   │   ├── PaymentList.tsx
│   │   ├── PaymentForm.tsx
│   │   └── PaymentStats.tsx
│   └── api-keys/
│       ├── APIKeyList.tsx
│       ├── APIKeyGenerator.tsx
│       └── APIKeyDisplay.tsx
├── lib/
│   ├── api-client.ts            # API wrapper con JWT
│   ├── auth.ts                  # NextAuth config
│   └── utils.ts
├── hooks/
│   ├── useOrganizations.ts
│   ├── usePayments.ts
│   └── useAPIKeys.ts
└── types/
    └── api.ts                   # Tipos del backend
```

---

## 3. Implementación por Fases

### Fase 2.1: Setup y Autenticación (2-3 horas)

#### Tareas:
1. ✅ Crear proyecto Next.js 14
   ```bash
   npx create-next-app@latest apps/platform \
     --typescript --tailwind --app --src-dir --import-alias "@/*"
   ```

2. ✅ Instalar dependencias
   ```bash
   npm install next-auth @tanstack/react-query axios
   npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
   npm install recharts date-fns lucide-react
   npm install -D @types/node
   ```

3. ✅ Configurar NextAuth.js
   - JWT authentication con backend
   - Session management
   - Protected routes

4. ✅ Crear layout base
   - Sidebar navegación
   - Header con user info
   - Responsive design

5. ✅ Página de login
   - Form con validación
   - Error handling
   - Redirección post-login

**Entregables**:
- ✅ Dashboard skeleton funcional
- ✅ Login/Logout funcionando
- ✅ Protected routes

---

### Fase 2.2: Dashboard de Organizaciones (3-4 horas)

#### Pantallas:

**1. Lista de Organizaciones** (`/organizations`)
- Tabla con paginación
- Búsqueda por nombre/email
- Filtros: status (active/suspended), plan (free/pro/enterprise)
- Acciones: Ver, Editar, Suspender, Eliminar
- Botón "Nueva Organización"

**2. Detalle de Organización** (`/organizations/[id]`)
- Información general
- Plan actual y fecha de vencimiento
- Estadísticas de uso
- API keys asociadas
- Historial de pagos
- Acciones: Cambiar plan, Suspender, Editar

**3. Nueva/Editar Organización** (`/organizations/new` y `/organizations/[id]/edit`)
- Form con validación
- Campos: Nombre, Email, Plan, Billing Email
- Selección de plan con pricing
- Preview de límites del plan

**Componentes a crear**:
```typescript
// components/organizations/OrganizationList.tsx
- DataTable con sort/filter
- Status badges
- Plan badges
- Action buttons

// components/organizations/OrganizationForm.tsx
- Form con react-hook-form + zod
- Plan selector
- Date picker para subscription_end
- Submit con loading state

// components/organizations/OrganizationDetails.tsx
- Stats cards (requests, credits, keys)
- Usage chart (últimos 30 días)
- API keys table
- Payments history
```

**API Integration**:
```typescript
// hooks/useOrganizations.ts
export function useOrganizations(filters) {
  return useQuery({
    queryKey: ['organizations', filters],
    queryFn: () => api.get('/admin/organizations', { params: filters })
  });
}

export function useOrganization(id) {
  return useQuery({
    queryKey: ['organization', id],
    queryFn: () => api.get(`/admin/organizations/${id}`)
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/admin/organizations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    }
  });
}
```

---

### Fase 2.3: Gestión de Pagos (2-3 horas)

#### Pantallas:

**1. Lista de Pagos** (`/payments`)
- Tabla con todos los pagos
- Filtros: status, organization, fecha
- Total revenue stats
- Botón "Registrar Pago"

**2. Registrar Pago** (`/payments/new`)
- Selector de organización
- Monto y moneda
- Método de pago (Transferencia, Efectivo, Crypto)
- Referencia
- Notas
- Preview antes de guardar

**3. Detalle de Pago** (`/payments/[id]`)
- Info del pago
- Organización relacionada
- Cambiar status (pending → confirmed → failed)
- Historial de cambios

**Componentes**:
```typescript
// components/payments/PaymentList.tsx
- DataTable con filtros
- Status badges (pending/confirmed/failed)
- Amount con currency formatting
- Quick filters (pending, este mes, etc.)

// components/payments/PaymentForm.tsx
- Organization autocomplete
- Amount input con currency selector
- Payment method selector
- Reference input
- Notes textarea

// components/payments/PaymentStats.tsx
- Total revenue card
- Payments this month
- Pending payments
- Revenue chart
```

---

### Fase 2.4: Gestión de API Keys (2-3 horas)

#### Pantallas:

**1. Lista de API Keys** (`/api-keys`)
- Tabla con todas las keys
- Filtros: organization, environment (live/test), status
- Info: prefix, created date, last used
- Acciones: View, Deactivate, Rotate, Delete

**2. Generar API Key** (`/api-keys/generate`)
- Selector de organización
- Nombre descriptivo
- Environment (live/test)
- Expiration date (opcional)
- Confirmación
- **IMPORTANTE**: Mostrar key completa una sola vez

**3. Detalle de API Key** (`/api-keys/[id]`)
- Info de la key (sin mostrar el secret)
- Organización
- Usage stats
- Last used timestamp
- Acciones: Deactivate, Reactivate, Rotate, Delete

**Componentes**:
```typescript
// components/api-keys/APIKeyGenerator.tsx
- Multi-step form
- Organization selector
- Name + environment
- Confirmation step
- One-time key display con copy button
- Security warning

// components/api-keys/APIKeyList.tsx
- DataTable
- Environment badges (live/test)
- Status indicators (active/inactive)
- Last used relative time
- Quick actions

// components/api-keys/APIKeyDisplay.tsx
- One-time display modal
- Copy to clipboard
- Download as .env
- Security instructions
```

---

### Fase 2.5: Analytics Dashboard (2-3 horas)

#### Pantallas:

**Dashboard Principal** (`/`)
- Overview de toda la plataforma
- Stats cards:
  * Total organizations
  * Total API requests (today/week/month)
  * Total revenue
  * Active API keys
- Charts:
  * API usage over time
  * Requests by operation type
  * Revenue over time
  * Organizations by plan
- Recent activity feed

**Componentes**:
```typescript
// components/dashboard/StatsCard.tsx
- Valor principal
- Comparación con período anterior (↑5% vs last week)
- Icon
- Color coding

// components/dashboard/UsageChart.tsx
- Recharts LineChart
- Time range selector (7d, 30d, 90d)
- Export to CSV
- Zoom/pan

// components/dashboard/ActivityFeed.tsx
- Recent events (orgs created, keys generated, payments)
- Real-time updates (opcional)
- Filter by type
```

---

## 4. Tecnologías y Librerías

### Core
- **Next.js 14**: App Router, Server Components
- **TypeScript**: Type safety completo
- **TailwindCSS**: Styling utility-first

### UI Components
- **shadcn/ui**: Componentes base (Button, Input, Table, etc.)
- **Radix UI**: Primitives accesibles
- **Lucide React**: Icons
- **class-variance-authority**: Variant styling

### Data Fetching
- **TanStack Query** (React Query): Server state management
- **Axios**: HTTP client con interceptors

### Forms
- **react-hook-form**: Form management
- **zod**: Schema validation

### Charts
- **Recharts**: Gráficos React
- **date-fns**: Date manipulation

### Auth
- **NextAuth.js**: Authentication con JWT backend

---

## 5. API Client Configuration

```typescript
// lib/api-client.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar JWT
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Interceptor para errores
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 6. Features Avanzados (Opcional)

### Fase 2.6: Features Extra
1. **Real-time updates**: WebSocket para stats en vivo
2. **Notificaciones**: Toast notifications para acciones
3. **Export data**: CSV/PDF exports
4. **Bulk actions**: Múltiples organizations/keys
5. **Audit log**: Log de todas las acciones admin
6. **Dark mode**: Theme switcher
7. **Multi-language**: i18n con español/inglés

---

## 7. Testing

### Unit Tests
- Components con Testing Library
- Hooks con renderHook
- API client mock

### Integration Tests
- User flows completos
- API integration mocks

### E2E Tests
- Playwright para critical paths:
  * Login → Create org → Generate key
  * Create org → Register payment
  * View analytics dashboard

---

## 8. Deployment

### Configuración
```typescript
// next.config.js
module.exports = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL,
  },
  images: {
    domains: ['api.proofpass.co'],
  },
};
```

### Variables de Entorno
```env
# .env.production
API_URL=https://api.proofpass.co
NEXTAUTH_URL=https://platform.proofpass.co
NEXTAUTH_SECRET=<generated>
```

### Hosting
- **Vercel** (recomendado): Deploy automático con git push
- **Alternativa**: Docker + Nginx

---

## 9. Cronograma Estimado

| Fase | Descripción | Tiempo | Status |
|------|-------------|--------|--------|
| 2.1 | Setup + Auth | 2-3h | ⏳ Siguiente |
| 2.2 | Organizations Dashboard | 3-4h | ⏳ Pendiente |
| 2.3 | Payments Management | 2-3h | ⏳ Pendiente |
| 2.4 | API Keys Management | 2-3h | ⏳ Pendiente |
| 2.5 | Analytics Dashboard | 2-3h | ⏳ Pendiente |
| 2.6 | Features Extra | 3-4h | 🔵 Opcional |

**Total**: 12-19 horas (sin features extra)

---

## 10. Entregables Fase 2

Al finalizar:
- ✅ Dashboard funcional en platform.proofpass.co
- ✅ Admin puede gestionar toda la plataforma
- ✅ CRUD completo de Organizations, Payments, API Keys
- ✅ Analytics y métricas visuales
- ✅ Responsive design (desktop + mobile)
- ✅ Testing básico
- ✅ Documentación de uso

---

## 11. Próximos Pasos

**Ahora mismo**:
1. ✅ Crear proyecto Next.js
2. ✅ Configurar TailwindCSS + shadcn/ui
3. ✅ Setup NextAuth con backend
4. ✅ Crear layout base con sidebar

**Confirmación requerida**:
- ¿Empezamos con Fase 2.1 (Setup)?
- ¿Alguna modificación al plan?
- ¿Features adicionales prioritarios?

---

**Plan creado por**: Mangoste
**Fecha**: 2025-10-30
**Status**: ⏳ Listo para comenzar
