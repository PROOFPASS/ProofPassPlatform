# ProofPass Platform - Integration Guide

## Overview

Esta guía explica cómo levantar y verificar la integración completa entre el Backend API y el Platform Dashboard.

## Arquitectura de Integración

```
┌─────────────────────────────────────────────────────────────┐
│                    ProofPass Platform                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────┐                    ┌──────────────────┐
│  Platform Dashboard │                    │   Backend API    │
│   (Next.js 15)      │ ◄──── HTTP ─────► │   (Fastify)      │
│   Port: 3001        │                    │   Port: 3000     │
└─────────────────────┘                    └──────────────────┘
         │                                           │
         │                                           │
         ▼                                           ▼
┌─────────────────────┐                    ┌──────────────────┐
│   NextAuth.js       │                    │   PostgreSQL     │
│   (JWT Auth)        │                    │   (Database)     │
└─────────────────────┘                    └──────────────────┘
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │      Redis       │
                                            │  (Rate Limit)    │
                                            └──────────────────┘
```

## Pre-requisitos

### 1. PostgreSQL

**macOS (Homebrew)**:
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get install postgresql
sudo service postgresql start
```

**Docker**:
```bash
docker run -d \
  --name proofpass-postgres \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=proofpass \
  postgres:15
```

**Verificar**:
```bash
pg_isready -h localhost -p 5432
```

### 2. Redis (Opcional)

**macOS (Homebrew)**:
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get install redis-server
sudo service redis-server start
```

**Docker**:
```bash
docker run -d \
  --name proofpass-redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Verificar**:
```bash
redis-cli ping
# Should return: PONG
```

### 3. Node.js

Asegúrate de tener Node.js 18+ instalado:
```bash
node --version
# Should be v18.0.0 or higher
```

## Configuración de Entorno

### 1. Backend API

**apps/api/.env**:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/proofpass

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=3000
NODE_ENV=development

# Admin Credentials
ADMIN_EMAIL=admin@proofpass.co
ADMIN_PASSWORD=change-me-in-production

# CORS
CORS_ORIGIN=http://localhost:3001

# Stellar (si es necesario)
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

### 2. Platform Dashboard

**apps/platform/.env.local**:
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=generate-a-random-secret-here

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# NextAuth Admin Credentials
ADMIN_EMAIL=admin@proofpass.co
ADMIN_PASSWORD=change-me-in-production
```

**Generar NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

## Database Setup

### 1. Crear Database

```bash
createdb proofpass
```

### 2. Ejecutar Migraciones

```bash
cd apps/api
npm run migrate
```

Esto creará todas las tablas necesarias:
- organizations
- plans
- api_keys
- payments
- usage_records
- usage_aggregates
- users (admin)

## Iniciar Servicios

### Opción 1: Script Automático (Recomendado)

```bash
./scripts/start-integration.sh
```

Este script:
1. ✅ Verifica PostgreSQL y Redis
2. ✅ Verifica archivos .env
3. ✅ Construye el API si es necesario
4. ✅ Limpia puertos 3000 y 3001
5. ✅ Inicia API en background
6. ✅ Inicia Platform en background
7. ✅ Espera a que ambos estén listos
8. ✅ Muestra URLs y comandos útiles

**Salida esperada**:
```
🚀 ProofPass Platform - Starting Integration Environment
========================================================

✓ PostgreSQL is running
✓ Redis is running
✓ API .env found
✓ Platform .env.local found
✓ API built
✓ Ports 3000 and 3001 are free
✓ API started (PID: 12345)
✓ API is ready!
✓ Platform started (PID: 12346)
✓ Platform is ready!

========================================
🎉 Integration Environment Started!
========================================

Services:
  📡 API Backend:      http://localhost:3000
  🎨 Platform UI:      http://localhost:3001
  📚 API Docs:         http://localhost:3000/documentation

Logs:
  API:      tail -f ./logs/api.log
  Platform: tail -f ./logs/platform.log

To stop:
  ./scripts/stop-integration.sh
```

### Opción 2: Manual

**Terminal 1 - API Backend**:
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Platform Dashboard**:
```bash
cd apps/platform
npm run dev
```

## Verificar Integración

### 1. Health Checks

**API Backend**:
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

**Platform Dashboard**:
```bash
curl http://localhost:3001
# Expected: HTML content
```

### 2. API Documentation

Visita:
```
http://localhost:3000/documentation
```

Deberías ver Swagger UI con todos los endpoints documentados.

### 3. Login en Platform

1. Visita: `http://localhost:3001`
2. Deberías ser redirigido a `/login`
3. Ingresa credenciales:
   - Email: `admin@proofpass.co`
   - Password: `change-me-in-production`
4. Deberías ser redirigido al dashboard

### 4. Test de Endpoints

**Crear Organización (desde Platform UI)**:
1. Navega a `/organizations/new`
2. Completa el formulario
3. Click "Crear Organización"
4. Deberías ver la nueva organización en `/organizations`

**Verificar desde API directamente**:
```bash
# Get JWT token
TOKEN=$(curl -X POST http://localhost:3000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@proofpass.co",
    "password": "change-me-in-production"
  }' | jq -r '.token')

# List organizations
curl http://localhost:3000/admin/organizations \
  -H "Authorization: Bearer $TOKEN"
```

## Detener Servicios

### Con Script

```bash
./scripts/stop-integration.sh
```

### Manual

```bash
# Find PIDs
lsof -ti:3000 | xargs kill -9  # API
lsof -ti:3001 | xargs kill -9  # Platform
```

## Logs

Los logs se guardan en:
- **API**: `./logs/api.log`
- **Platform**: `./logs/platform.log`

**Ver logs en tiempo real**:
```bash
# API
tail -f ./logs/api.log

# Platform
tail -f ./logs/platform.log

# Ambos
tail -f ./logs/api.log ./logs/platform.log
```

## Troubleshooting

### PostgreSQL no está corriendo

```bash
# macOS
brew services start postgresql

# Linux
sudo service postgresql start

# Docker
docker start proofpass-postgres
```

### Error: Port 3000 already in use

```bash
lsof -ti:3000 | xargs kill -9
```

### Error: Port 3001 already in use

```bash
lsof -ti:3001 | xargs kill -9
```

### API no conecta con Database

Verifica `DATABASE_URL` en `apps/api/.env`:
```bash
# Test connection
psql postgresql://postgres:postgres@localhost:5432/proofpass -c "SELECT 1"
```

### Platform no conecta con API

1. Verifica que API esté corriendo: `curl http://localhost:3000/health`
2. Verifica `NEXT_PUBLIC_API_URL` en `apps/platform/.env.local`
3. Revisa CORS en `apps/api/.env`: `CORS_ORIGIN=http://localhost:3001`

### NextAuth error

1. Verifica `NEXTAUTH_SECRET` existe en `.env.local`
2. Genera uno nuevo: `openssl rand -base64 32`
3. Verifica `NEXTAUTH_URL=http://localhost:3001`

### Migrations failed

```bash
# Drop and recreate database
dropdb proofpass
createdb proofpass

# Run migrations again
cd apps/api
npm run migrate
```

## Flujos de Integración

### 1. Authentication Flow

```
User → Platform Login Page
  ↓
Platform → NextAuth.js
  ↓
NextAuth → API /auth/admin/login
  ↓
API → PostgreSQL (verify credentials)
  ↓
API → Return JWT token
  ↓
NextAuth → Set session cookie
  ↓
Platform → Redirect to dashboard
```

### 2. API Call Flow

```
Platform Component → Service (e.g., organizationsService)
  ↓
Service → api-client (Axios)
  ↓
api-client → Add JWT from NextAuth
  ↓
api-client → POST/GET to API
  ↓
API → Verify JWT
  ↓
API → Check permissions
  ↓
API → Query PostgreSQL
  ↓
API → Return JSON
  ↓
Platform → Update UI
```

### 3. Rate Limiting Flow

```
API Request → Rate Limit Middleware
  ↓
Middleware → Check Redis (or in-memory)
  ↓
If under limit:
  → Process request
  → Increment counter
  → Return response with headers

If over limit:
  → Return 429 Too Many Requests
  → Include X-RateLimit-* headers
```

## Testing Integration

### Manual Tests

1. **Login**: ✅
2. **Create Organization**: ✅
3. **Generate API Key**: ✅
4. **Register Payment**: ✅
5. **View Analytics**: ✅

### Automated Tests

```bash
# Platform tests
cd apps/platform
npm test

# API tests
cd apps/api
npm test
```

### E2E Tests (Future)

```bash
# With Playwright
npx playwright test
```

## Performance

### Expected Response Times

- **Health check**: < 10ms
- **Auth login**: < 100ms
- **List organizations**: < 200ms
- **Create organization**: < 300ms
- **Complex analytics**: < 500ms

### Monitor Performance

```bash
# API response times in logs
tail -f ./logs/api.log | grep "request completed"

# Check database query performance
psql proofpass -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

## Next Steps

1. ✅ Integration running locally
2. ⏭️ Deploy to production (see DEPLOYMENT.md)
3. ⏭️ Setup CI/CD pipeline
4. ⏭️ Configure monitoring & alerts
5. ⏭️ Setup backups

---

**Status**: ✅ Integration guide complete
**Last updated**: 2025-10-30
**Maintainer**: ProofPass Team
