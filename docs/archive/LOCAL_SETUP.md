# Configuración Local y Testing

Guía completa para configurar tu entorno local de desarrollo y ejecutar tests.

## Requisitos del Sistema

- **Node.js**: >= 18.0.0
- **PostgreSQL**: >= 14.0
- **npm**: >= 9.0.0
- **Git**: >= 2.30.0

## 1. Setup Inicial

### Clonar e Instalar

```bash
git clone https://github.com/tu-org/ProofPassPlatform.git
cd ProofPassPlatform
npm install
```

Este comando instalará todas las dependencias de los workspaces (apps y packages).

## 2. Variables de Entorno

### API Backend (`apps/api/.env`)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/proofpass"

# JWT & Auth
JWT_SECRET="tu-secret-super-seguro-cambiar-en-produccion"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"

# Blockchain - Optimism Sepolia (testnet)
OPTIMISM_RPC_URL="https://sepolia.optimism.io"
OPTIMISM_PRIVATE_KEY="tu-private-key-testnet"
OPTIMISM_ATTESTATION_ADDRESS="0x..."

# Blockchain - Arbitrum Sepolia (testnet)
ARBITRUM_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
ARBITRUM_PRIVATE_KEY="tu-private-key-testnet"
ARBITRUM_ATTESTATION_ADDRESS="0x..."

# Blockchain - Stellar Testnet
STELLAR_NETWORK="testnet"
STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
STELLAR_SECRET_KEY="S..."
STELLAR_PUBLIC_KEY="G..."

# Stripe (modo test)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_BASIC="price_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_ENTERPRISE="price_..."

# CORS
ALLOWED_ORIGINS="http://localhost:3001,http://localhost:3000"
```

### Platform Dashboard (`apps/platform/.env.local`)

```env
# API
NEXT_PUBLIC_API_URL="http://localhost:3000"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="tu-secret-nextauth-cambiar-en-produccion"

# Providers (opcional para desarrollo)
GITHUB_ID="..."
GITHUB_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Blockchain Packages (`packages/blockchain/.env`)

```env
# Optimism Sepolia
OPTIMISM_RPC_URL="https://sepolia.optimism.io"
OPTIMISM_PRIVATE_KEY="tu-private-key"

# Arbitrum Sepolia
ARBITRUM_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
ARBITRUM_PRIVATE_KEY="tu-private-key"

# Stellar Testnet
STELLAR_NETWORK="testnet"
STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
STELLAR_SECRET_KEY="S..."
```

## 3. Setup de Base de Datos

### Crear Base de Datos PostgreSQL

```bash
# Usando psql
createdb proofpass

# O usando PostgreSQL directamente
psql -U postgres
CREATE DATABASE proofpass;
\q
```

### Ejecutar Migraciones de Prisma

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# (Opcional) Seed de datos de prueba
npm run db:seed
```

### Verificar Base de Datos

```bash
# Abrir Prisma Studio para ver los datos
npm run db:studio
```

## 4. Setup de Blockchain (Testnets)

### Optimism Sepolia

1. **Obtener ETH de testnet**:
   - https://www.alchemy.com/faucets/optimism-sepolia
   - https://app.optimism.io/faucet

2. **Configurar RPC**:
   ```
   OPTIMISM_RPC_URL="https://sepolia.optimism.io"
   ```

3. **Verificar conexión**:
   ```bash
   npm run test:blockchain
   ```

### Arbitrum Sepolia

1. **Obtener ETH de testnet**:
   - https://faucet.quicknode.com/arbitrum/sepolia

2. **Configurar RPC**:
   ```
   ARBITRUM_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
   ```

### Stellar Testnet

1. **Crear cuenta de testnet**:
   ```bash
   npm run setup:stellar
   ```

2. **Verificar cuenta**:
   - https://laboratory.stellar.org/#account-creator?network=test

## 5. Build de Packages

```bash
# Build de todos los packages en orden correcto
npm run build:packages

# Build individual de un package
npm run build -w packages/types
npm run build -w packages/vc-toolkit
npm run build -w packages/blockchain
```

## 6. Ejecutar Tests

### Tests Unitarios (All Packages)

```bash
# Ejecutar todos los tests
npm test

# Tests con watch mode
npm run test:watch

# Tests con coverage
npm run test:coverage
```

### Tests por Package

```bash
# Blockchain tests
cd packages/blockchain
npm test

# VC Toolkit tests
cd packages/vc-toolkit
npm test

# Client SDK tests
cd packages/client
npm test

# Templates tests
cd packages/templates
npm test

# QR Toolkit tests
cd packages/qr-toolkit
npm test
```

### Tests de Integración Blockchain

```bash
# Test con testnets reales
npm run test:blockchain
```

### Coverage Threshold

Todos los packages están configurados con **85% coverage threshold**:
- Branches: 85%
- Functions: 85%
- Lines: 85%
- Statements: 85%

## 7. Ejecutar Aplicaciones en Desarrollo

### API Backend

```bash
# Terminal 1: Iniciar API
npm run dev:api

# La API estará disponible en http://localhost:3000
```

### Platform Dashboard

```bash
# Terminal 2: Iniciar Platform
npm run dev:platform

# El dashboard estará en http://localhost:3001
```

### Ambos simultáneamente

```bash
npm run dev
```

## 8. Debugging

### API Logs

Los logs de la API incluyen:
- Requests HTTP
- Errores de blockchain
- Operaciones de base de datos
- Transacciones de Stripe

```bash
# Ver logs en desarrollo
npm run dev:api
```

### Database Debugging

```bash
# Ver queries de Prisma
DATABASE_URL="..." npx prisma studio

# Ver logs de PostgreSQL
tail -f /usr/local/var/log/postgres.log
```

### Blockchain Debugging

```bash
# Test individual de blockchain
cd packages/blockchain
npx tsx examples/test-local.ts
```

## 9. Linting y Formatting

```bash
# Lint
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## 10. Problemas Comunes

### Error: "Cannot connect to database"

```bash
# Verificar que PostgreSQL esté corriendo
pg_isready

# Reiniciar PostgreSQL
brew services restart postgresql@14
```

### Error: "Module not found" en packages

```bash
# Rebuild packages
npm run build:packages

# Limpiar y reinstalar
npm run clean
npm install
npm run build:packages
```

### Error: "Insufficient funds" en blockchain tests

```bash
# Verificar balance en testnet
# Optimism: https://sepolia-optimism.etherscan.io/
# Arbitrum: https://sepolia.arbiscan.io/
# Stellar: https://horizon-testnet.stellar.org/

# Obtener más ETH/XLM de faucets
```

### Error: Git index.lock

```bash
# Remover archivo de bloqueo
rm -f .git/index.lock
```

## 11. Estructura de Testing

```
ProofPassPlatform/
├── packages/
│   ├── blockchain/
│   │   ├── __tests__/          # Unit tests
│   │   ├── examples/           # Integration tests
│   │   └── jest.config.js
│   ├── vc-toolkit/
│   │   ├── __tests__/
│   │   └── jest.config.js
│   ├── client/
│   │   ├── __tests__/
│   │   └── jest.config.js
│   ├── templates/
│   │   ├── __tests__/
│   │   └── jest.config.js
│   └── qr-toolkit/
│       ├── __tests__/
│       └── jest.config.js
├── apps/
│   ├── api/
│   │   └── __tests__/          # API integration tests
│   └── platform/
│       └── __tests__/          # Frontend tests
└── jest.config.js              # Root config
```

## 12. Scripts Útiles

```bash
# Setup completo desde cero
npm install
npm run build:packages
npm run setup:db
npm run dev

# Reset completo de base de datos
npm run db:reset

# Ver studio de base de datos
npm run db:studio

# Tests CI (como en GitHub Actions)
npm run test:ci

# Limpiar todo
npm run clean
```

## 13. Performance Tips

### Acelerar npm install

```bash
# Usar cache de npm
npm ci --prefer-offline

# O usar pnpm (más rápido)
npm install -g pnpm
pnpm install
```

### Acelerar tests

```bash
# Ejecutar tests en paralelo
npm test -- --maxWorkers=4

# Tests solo de archivos modificados
npm test -- --onlyChanged
```

## 14. Siguiente Paso

Una vez configurado el entorno local, consulta:
- `DEPLOYMENT.md` - Para deployment a producción
- `TESTING_IMPROVEMENT_PLAN.md` - Para estrategia de testing
- `packages/blockchain/TESTING.md` - Para testing de blockchain específico

---

**Listo para Development!** 🚀

Si encuentras problemas, revisa la sección de "Problemas Comunes" o consulta la documentación de cada package.
