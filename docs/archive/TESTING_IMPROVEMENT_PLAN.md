# Plan de Mejora de Testing - ProofPass Platform

Objetivo: Alcanzar 85% de code coverage con tests unitarios, de integración y de seguridad.

## Estado Actual

### Coverage Estimado Actual: ~15-20%

**Tests Existentes:**
- packages/types: Tests básicos
- packages/vc-toolkit: vc-generator, vc-verifier
- packages/stellar-sdk: stellar-client básico
- packages/zk-toolkit: circuits, snark-proofs básicos
- apps/api: Solo setup.ts

**Sin Tests:**
- packages/blockchain (CRÍTICO)
- packages/client
- packages/templates
- packages/qr-toolkit
- packages/vc-toolkit (ed25519, status-list, signer-ed25519)
- apps/api (todos los endpoints)

## Plan de Acción - 3 Fases

### Fase 1: Tests Unitarios Críticos (Coverage objetivo: 50%)

#### 1.1 packages/blockchain (Prioridad ALTA)
**Archivos a testear:**
- `src/blockchain-manager.ts` - Manager principal
- `src/providers/optimism-provider.ts` - Provider Optimism
- `src/providers/arbitrum-provider.ts` - Provider Arbitrum
- `src/providers/stellar-provider.ts` - Provider Stellar

**Tests necesarios:**
- ✅ Configuración de providers
- ✅ Anclaje de datos (con mocks)
- ✅ Batch anchoring
- ✅ Verificación de transacciones
- ✅ Estimación de fees
- ✅ Get balance
- ✅ Manejo de errores
- ✅ Network selection

**Archivos de test:**
```
packages/blockchain/__tests__/
├── blockchain-manager.test.ts
├── optimism-provider.test.ts
├── arbitrum-provider.test.ts
├── stellar-provider.test.ts
└── integration/
    └── multi-chain.test.ts
```

#### 1.2 packages/vc-toolkit - Completar (Prioridad ALTA)
**Archivos sin tests:**
- `src/ed25519-crypto.ts` - Criptografía Ed25519
- `src/status-list.ts` - W3C Status List 2021
- `src/vc-signer-ed25519.ts` - Signer Ed25519

**Tests necesarios:**
- ✅ Generación de key pairs
- ✅ Firma y verificación Ed25519
- ✅ DID creation/parsing
- ✅ Status list creation
- ✅ Status list compression
- ✅ Set/get status
- ✅ VC signing con Ed25519
- ✅ VC verification con Ed25519

**Archivos de test:**
```
packages/vc-toolkit/__tests__/
├── ed25519-crypto.test.ts
├── status-list.test.ts
└── vc-signer-ed25519.test.ts
```

#### 1.3 packages/client (Prioridad MEDIA)
**Archivo principal:**
- `src/index.ts` - SDK completo

**Tests necesarios:**
- ✅ Inicialización del cliente
- ✅ Configuración de headers
- ✅ Attestations API (CRUD)
- ✅ Passports API (CRUD)
- ✅ ZK Proofs API
- ✅ Credentials API
- ✅ Manejo de errores HTTP
- ✅ Retry logic

**Archivos de test:**
```
packages/client/__tests__/
├── client.test.ts
├── attestations.test.ts
├── passports.test.ts
├── zkproofs.test.ts
└── credentials.test.ts
```

#### 1.4 packages/templates (Prioridad MEDIA)
**Archivo principal:**
- `src/index.ts` - Templates y validación

**Tests necesarios:**
- ✅ Validación de cada template (5 templates)
- ✅ Zod schema validation
- ✅ Error messages
- ✅ Edge cases por template

**Archivos de test:**
```
packages/templates/__tests__/
├── identity.test.ts
├── education.test.ts
├── employment.test.ts
├── license.test.ts
└── age-verification.test.ts
```

#### 1.5 packages/qr-toolkit (Prioridad BAJA)
**Archivo principal:**
- `src/index.ts` - QR generation

**Tests necesarios:**
- ✅ URL generation (5 formatos)
- ✅ QR code creation
- ✅ Error handling
- ✅ URL validation

**Archivos de test:**
```
packages/qr-toolkit/__tests__/
└── qr-toolkit.test.ts
```

### Fase 2: Tests de API e Integración (Coverage objetivo: 70%)

#### 2.1 apps/api - Tests completos de endpoints
**Endpoints a testear:**

**Authentication:**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

**Attestations:**
- POST /api/attestations
- GET /api/attestations
- GET /api/attestations/:id
- PUT /api/attestations/:id
- DELETE /api/attestations/:id

**Passports:**
- POST /api/passports
- GET /api/passports
- GET /api/passports/:id
- PUT /api/passports/:id
- DELETE /api/passports/:id

**ZK Proofs:**
- POST /api/zkproofs
- GET /api/zkproofs/:id
- POST /api/zkproofs/:id/verify

**Blockchain:**
- POST /api/blockchain/anchor
- GET /api/blockchain/tx/:hash
- POST /api/blockchain/verify

**Tests necesarios:**
- ✅ Todos los endpoints (happy path)
- ✅ Todos los endpoints (error cases)
- ✅ Authentication/Authorization
- ✅ Validation
- ✅ Rate limiting
- ✅ Database operations
- ✅ Middleware testing

**Archivos de test:**
```
apps/api/__tests__/
├── unit/
│   ├── auth.test.ts
│   ├── attestations.test.ts
│   ├── passports.test.ts
│   ├── zkproofs.test.ts
│   └── blockchain.test.ts
├── integration/
│   ├── auth-flow.test.ts
│   ├── attestation-lifecycle.test.ts
│   ├── passport-lifecycle.test.ts
│   └── e2e-workflow.test.ts
└── middleware/
    ├── auth-middleware.test.ts
    ├── validation-middleware.test.ts
    └── rate-limit.test.ts
```

#### 2.2 Tests de Integración Cross-Package
**Flujos end-to-end:**
- ✅ Create attestation → Create passport → Generate QR
- ✅ Create credential → Sign with Ed25519 → Anchor on blockchain
- ✅ Generate ZK proof → Verify proof
- ✅ Multi-blockchain anchoring → Verification

**Archivos de test:**
```
__tests__/integration/
├── attestation-to-passport.test.ts
├── credential-signing-anchoring.test.ts
├── zkproof-generation-verification.test.ts
└── multi-blockchain.test.ts
```

### Fase 3: Tests de Seguridad (Coverage objetivo: 85%+)

#### 3.1 Security Testing
**Áreas críticas:**
- ✅ SQL Injection prevention
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ JWT security
- ✅ Rate limiting efectivo
- ✅ Input validation
- ✅ Secrets management
- ✅ Authorization bypass attempts

**Archivos de test:**
```
__tests__/security/
├── sql-injection.test.ts
├── xss-prevention.test.ts
├── csrf-protection.test.ts
├── jwt-security.test.ts
├── rate-limiting.test.ts
├── input-validation.test.ts
├── authorization.test.ts
└── secrets-management.test.ts
```

#### 3.2 Performance Testing
**Métricas:**
- ✅ Response time bajo carga
- ✅ Database query performance
- ✅ Blockchain operations timeout
- ✅ Memory leaks
- ✅ Concurrent requests

**Archivos de test:**
```
__tests__/performance/
├── api-load.test.ts
├── database-queries.test.ts
├── blockchain-timeout.test.ts
└── memory-leaks.test.ts
```

#### 3.3 Error Handling & Edge Cases
**Scenarios:**
- ✅ Network failures
- ✅ Database connection lost
- ✅ Invalid blockchain responses
- ✅ Malformed input
- ✅ Race conditions
- ✅ Resource exhaustion

**Archivos de test:**
```
__tests__/edge-cases/
├── network-failures.test.ts
├── database-failures.test.ts
├── blockchain-errors.test.ts
├── malformed-input.test.ts
└── race-conditions.test.ts
```

## Herramientas y Configuración

### Jest Configuration
```json
{
  "collectCoverage": true,
  "coverageThreshold": {
    "global": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  },
  "coverageReporters": ["text", "lcov", "html"],
  "testMatch": ["**/__tests__/**/*.test.ts"],
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"]
}
```

### Mocking Strategy
- **Blockchain**: Mock ethers.js y stellar-sdk
- **Database**: Use in-memory SQLite o mocks
- **HTTP**: Use nock o msw
- **Crypto**: Mock solo external calls

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm run test:ci
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Cronograma Estimado

**Fase 1 (Tests Unitarios):**
- Blockchain: 1 día
- VC-Toolkit completar: 0.5 días
- Client: 0.5 días
- Templates: 0.5 días
- QR-Toolkit: 0.25 días
**Total Fase 1: 3 días**

**Fase 2 (API e Integración):**
- API endpoints: 2 días
- Integration tests: 1 día
**Total Fase 2: 3 días**

**Fase 3 (Seguridad):**
- Security tests: 1 día
- Performance tests: 0.5 días
- Edge cases: 0.5 días
**Total Fase 3: 2 días**

**TOTAL ESTIMADO: 8 días de trabajo**

## Métricas de Éxito

- ✅ Coverage global >= 85%
- ✅ Todos los endpoints de API cubiertos
- ✅ Todos los packages con tests
- ✅ Tests de seguridad passing
- ✅ Performance tests dentro de límites
- ✅ CI/CD pasando sin fallos
- ✅ Zero critical vulnerabilities

## Próximos Pasos Inmediatos

1. Configurar Jest con coverage
2. Crear estructura de directorios de tests
3. Implementar tests de `packages/blockchain` (CRÍTICO)
4. Implementar tests faltantes de `packages/vc-toolkit`
5. Continuar con resto de packages
6. API testing completo
7. Security testing
8. Documentation de cada test

## Documentación

Cada test file debe incluir:
- Descripción del módulo bajo test
- Setup/teardown explicado
- Casos de test documentados
- Mocks explicados
- Edge cases cubiertos

## Comandos

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific package
npm test packages/blockchain

# Run integration tests
npm test -- --testPathPattern=integration

# Run security tests
npm test -- --testPathPattern=security

# Watch mode
npm run test:watch
```
