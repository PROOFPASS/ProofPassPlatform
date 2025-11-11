# Platform Dashboard - Testing Guide

## Overview

Esta guía describe la configuración de testing para el Platform Dashboard.

## Test Stack

- **Jest** - Test runner y framework
- **React Testing Library** - Testing de componentes React
- **jsdom** - Ambiente DOM para tests
- **Next.js Jest** - Configuración específica para Next.js

## Instalación de Dependencias

Para correr los tests, primero instala las dependencias necesarias:

```bash
cd apps/platform
npm install --save-dev \
  jest \
  jest-environment-jsdom \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @types/jest
```

## Estructura de Tests

```
apps/platform/
├── __tests__/
│   ├── lib/
│   │   └── services/
│   │       ├── organizations.test.ts   ✅ 6 tests
│   │       ├── payments.test.ts        ✅ 5 tests
│   │       └── api-keys.test.ts        ✅ 7 tests
│   └── app/
│       ├── organizations/
│       ├── payments/
│       ├── api-keys/
│       └── analytics/
├── jest.config.js                      ✅ Configurado
└── jest.setup.js                       ✅ Mocks globales
```

## Configuración

### jest.config.js

Configuración completa para Next.js con:
- Soporte TypeScript
- Module name mapping (@/...)
- Coverage thresholds (70%)
- Test environment: jsdom

### jest.setup.js

Mocks globales para:
- `next/navigation` (useRouter, useParams, etc.)
- `next-auth/react` (useSession, signIn, etc.)
- Variables de entorno

## Tests Creados

### 1. Organizations Service Tests (6 tests)

**Archivo**: `__tests__/lib/services/organizations.test.ts`

Tests:
- ✅ `getOrganizations()` - Fetch con filtros
- ✅ `getOrganizations()` - Manejo de errores
- ✅ `getOrganization(id)` - Fetch por ID
- ✅ `createOrganization()` - Crear nueva
- ✅ `changeStatus()` - Cambiar estado
- ✅ `changePlan()` - Cambiar plan

### 2. Payments Service Tests (5 tests)

**Archivo**: `__tests__/lib/services/payments.test.ts`

Tests:
- ✅ `getPayments()` - Fetch con filtros
- ✅ `getPayment(id)` - Fetch por ID
- ✅ `createPayment()` - Crear nuevo pago
- ✅ `updatePaymentStatus()` - Actualizar estado
- ✅ `deletePayment()` - Eliminar pago

### 3. API Keys Service Tests (7 tests)

**Archivo**: `__tests__/lib/services/api-keys.test.ts`

Tests:
- ✅ `getApiKeys()` - Fetch con filtros
- ✅ `getApiKey(id)` - Fetch por ID
- ✅ `createApiKey()` - Crear nueva key
- ✅ `revokeApiKey()` - Revocar key
- ✅ `activateApiKey()` - Activar key
- ✅ `getApiKeyUsage()` - Estadísticas de uso
- ✅ `deleteApiKey()` - Eliminar key

## Ejecutar Tests

### Todos los tests

```bash
npm test
```

### Watch mode (desarrollo)

```bash
npm test -- --watch
```

### Con coverage

```bash
npm test -- --coverage
```

### Test específico

```bash
npm test organizations.test.ts
```

## Coverage Targets

Los thresholds configurados son:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

## Scripts de Package.json

Agrega estos scripts a `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

## Mocking API Calls

Todos los servicios mockean `apiClient`:

```typescript
jest.mock('@/lib/api-client');

// En el test
(apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });
```

## Component Tests (Próximos pasos)

Para testear componentes React:

```typescript
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('OrganizationsPage', () => {
  it('renders organizations list', async () => {
    render(<OrganizationsPage />);

    expect(screen.getByText('Organizaciones')).toBeInTheDocument();
  });
});
```

## E2E Tests con Playwright (Futuro)

Para tests end-to-end:

```bash
npm install --save-dev @playwright/test
npx playwright install
```

Ejemplo:

```typescript
// e2e/login.spec.ts
test('admin can login', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.fill('[name="email"]', 'admin@proofpass.co');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});
```

## Integration Tests

Para tests de integración con el backend real:

```typescript
describe('Organizations API Integration', () => {
  beforeAll(async () => {
    // Setup test database
    // Start API server
  });

  it('creates and fetches organization', async () => {
    // Real API calls
    const org = await organizationsService.createOrganization({
      name: 'Test Org',
      email: 'test@example.com',
    });

    expect(org.id).toBeDefined();
  });
});
```

## Troubleshooting

### Error: Cannot find module '@/...'

Verifica que `jest.config.js` tenga:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Error: window is not defined

Asegúrate de usar:

```javascript
testEnvironment: 'jest-environment-jsdom'
```

### Timeouts en tests async

Aumenta el timeout:

```typescript
jest.setTimeout(10000); // 10 segundos
```

## CI/CD

Para GitHub Actions:

```yaml
- name: Run tests
  run: |
    cd apps/platform
    npm test -- --ci --coverage --maxWorkers=2
```

## Resultados Esperados

Al correr `npm test`, deberías ver:

```
PASS  __tests__/lib/services/organizations.test.ts
  Organizations Service
    ✓ should fetch organizations with filters (5ms)
    ✓ should handle errors (3ms)
    ✓ should fetch a single organization by ID (2ms)
    ✓ should create a new organization (3ms)
    ✓ should change organization status (2ms)
    ✓ should change organization plan (2ms)

PASS  __tests__/lib/services/payments.test.ts
  Payments Service
    ✓ should fetch payments with filters (4ms)
    ✓ should fetch a single payment by ID (2ms)
    ✓ should create a new payment (3ms)
    ✓ should update payment status (2ms)
    ✓ should delete a payment (2ms)

PASS  __tests__/lib/services/api-keys.test.ts
  API Keys Service
    ✓ should fetch API keys with filters (4ms)
    ✓ should fetch a single API key by ID (2ms)
    ✓ should create a new API key and return plain key (3ms)
    ✓ should revoke an API key (2ms)
    ✓ should activate an API key (2ms)
    ✓ should fetch API key usage statistics (3ms)
    ✓ should delete an API key (2ms)

Test Suites: 3 passed, 3 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        2.451s
```

## Next Steps

1. **Component Tests** - Testear páginas y componentes UI
2. **Integration Tests** - Tests con backend real
3. **E2E Tests** - Playwright para flujos completos
4. **Visual Regression** - Storybook + Chromatic
5. **Performance Tests** - Lighthouse CI

---

**Total Tests Configurados**: 18
**Coverage Target**: 70%
**Status**: ✅ Configuración completa
