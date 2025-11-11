# Desarrollo Local - ProofPass Platform

Guía completa para correr todo el stack de ProofPass localmente.

## Stack Completo

```
┌─────────────────────────────────────┐
│  Frontend (Next.js) - Port 3001     │
│  Dashboard administrativo           │
└──────────────┬──────────────────────┘
               │
               │ HTTP
               ▼
┌─────────────────────────────────────┐
│  API (Express) - Port 3000          │
│  REST API + Authentication          │
└──────────────┬──────────────────────┘
               │
               │ PostgreSQL
               ▼
┌─────────────────────────────────────┐
│  Database (PostgreSQL) - Port 5432  │
│  Prisma ORM                         │
└─────────────────────────────────────┘
               │
               │ Blockchain
               ▼
┌─────────────────────────────────────┐
│  Optimism / Arbitrum / Stellar      │
│  Testnet networks                   │
└─────────────────────────────────────┘
```

## Requisitos Previos

- **Node.js**: v18 o superior
- **npm**: v9 o superior
- **PostgreSQL**: v14 o superior (o Docker)
- **Git**: Para clonar el repo

Verifica las versiones:

```bash
node --version  # v18+
npm --version   # v9+
psql --version  # v14+ (o usa Docker)
```

## Paso 1: Clonar e instalar

```bash
# Clonar
git clone https://github.com/fboiero/ProofPassPlatform.git
cd ProofPassPlatform

# Instalar todas las dependencias
npm install
```

## Paso 2: Base de datos

### Opción A: PostgreSQL con Docker (Recomendado)

```bash
# Crear y correr PostgreSQL en Docker
docker run --name proofpass-postgres \
  -e POSTGRES_USER=proofpass \
  -e POSTGRES_PASSWORD=dev_password_123 \
  -e POSTGRES_DB=proofpass \
  -p 5432:5432 \
  -d postgres:14-alpine

# Verificar que esté corriendo
docker ps | grep proofpass-postgres
```

### Opción B: PostgreSQL instalado localmente

```bash
# macOS con Homebrew
brew install postgresql@14
brew services start postgresql@14

# Crear la base de datos
createdb proofpass

# Crear usuario (opcional)
psql postgres
CREATE USER proofpass WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE proofpass TO proofpass;
\q
```

## Paso 3: Configurar variables de entorno

### API (.env en apps/api)

```bash
cd apps/api
cp .env.example .env
```

Edita `apps/api/.env`:

```bash
# Database
DATABASE_URL="postgresql://proofpass:dev_password_123@localhost:5432/proofpass"

# JWT Secret (genera uno nuevo)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Stellar (opcional - para testing blockchain)
STELLAR_SECRET_KEY="SXXXXXX..."
STELLAR_NETWORK="testnet"

# Ethereum L2s (opcional - para testing blockchain)
ETH_PRIVATE_KEY="0x..."
OPTIMISM_RPC_URL="https://sepolia.optimism.io"
ARBITRUM_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Server
PORT=3000
NODE_ENV="development"
```

### Platform (.env.local en apps/platform - si existe)

```bash
cd apps/platform
cp .env.example .env.local  # Si existe
```

Edita `apps/platform/.env.local`:

```bash
# API URL
NEXT_PUBLIC_API_URL="http://localhost:3000"

# NextAuth (si lo usas)
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-nextauth-secret-change-this"
```

## Paso 4: Ejecutar migraciones

```bash
# Desde apps/api
cd apps/api

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# Opcional: Ver la base de datos
npx prisma studio
# Abre en http://localhost:5555
```

## Paso 5: Compilar packages

```bash
# Desde la raíz del proyecto
cd ../..

# Compilar todos los packages
npm run build:packages

# O compilar individualmente
cd packages/types && npm run build
cd ../vc-toolkit && npm run build
cd ../blockchain && npm run build
cd ../client && npm run build
```

## Paso 6: Correr servicios

### Método 1: Modo desarrollo (recomendado)

Abre **3 terminales** diferentes:

**Terminal 1 - API:**

```bash
cd apps/api
npm run dev

# Deberías ver:
# ✓ Server running on http://localhost:3000
# ✓ Database connected
```

**Terminal 2 - Platform (si está implementado):**

```bash
cd apps/platform
npm run dev

# Deberías ver:
# ▲ Next.js ready on http://localhost:3001
```

**Terminal 3 - Database UI (opcional):**

```bash
cd apps/api
npx prisma studio

# Abre en http://localhost:5555
```

### Método 2: Script todo-en-uno

```bash
# Desde la raíz
npm run dev:all

# Esto correrá:
# - API en puerto 3000
# - Platform en puerto 3001
# - Prisma Studio en puerto 5555
```

## Paso 7: Verificar que funciona

### Test de la API

```bash
# Health check
curl http://localhost:3000/health

# Crear usuario de prueba
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Guarda el token que recibes
```

### Test del Platform

Abre en el navegador:

```
http://localhost:3001
```

Deberías ver el dashboard de ProofPass.

## Puertos utilizados

| Servicio       | Puerto | URL                      |
| -------------- | ------ | ------------------------ |
| API            | 3000   | http://localhost:3000    |
| Platform       | 3001   | http://localhost:3001    |
| PostgreSQL     | 5432   | localhost:5432           |
| Prisma Studio  | 5555   | http://localhost:5555    |

## Estructura del Proyecto

```
ProofPassPlatform/
├── apps/
│   ├── api/              # Express API
│   │   ├── src/
│   │   ├── prisma/       # Database schema
│   │   └── package.json
│   └── platform/         # Next.js Dashboard
│       ├── src/
│       └── package.json
├── packages/
│   ├── blockchain/       # Multi-blockchain
│   ├── client/           # SDK de JavaScript
│   ├── templates/        # Templates de VC
│   ├── types/            # TypeScript types
│   ├── vc-toolkit/       # VC generation/verification
│   └── qr-toolkit/       # QR code generation
└── package.json
```

## Testing End-to-End

### 1. Crear una Attestation

```bash
# Con el token del login anterior
curl -X POST http://localhost:3000/api/attestations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "identity",
    "subject": "did:key:z6Mkf...",
    "claims": {
      "firstName": "Alice",
      "lastName": "Smith",
      "dateOfBirth": "1990-01-01"
    }
  }'
```

### 2. Crear un Passport

```bash
curl -X POST http://localhost:3000/api/passports \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "holder": "did:key:z6Mkf...",
    "attestationIds": ["attestation-id-from-step-1"]
  }'
```

### 3. Anclar en Blockchain (opcional)

```bash
curl -X POST http://localhost:3000/api/blockchain/anchor \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "dataHash": "abc123...",
    "network": "optimism-sepolia",
    "metadata": {
      "type": "credential",
      "id": "credential-123"
    }
  }'
```

## Scripts útiles

```bash
# Desde la raíz del proyecto

# Compilar todo
npm run build

# Compilar solo packages
npm run build:packages

# Tests
npm test

# Tests de la API
cd apps/api && npm test

# Limpiar y reinstalar todo
npm run clean
npm install

# Formatear código
npm run format

# Lint
npm run lint

# Generar cliente Prisma
cd apps/api && npx prisma generate

# Resetear base de datos
cd apps/api && npx prisma migrate reset

# Ver logs de la API
cd apps/api && npm run dev 2>&1 | tee api.log
```

## Troubleshooting

### Error: "Port 3000 already in use"

```bash
# Encontrar el proceso
lsof -i :3000

# Matar el proceso
kill -9 <PID>

# O usa otro puerto
PORT=3001 npm run dev
```

### Error: "Database connection failed"

```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep postgres

# O si es local
brew services list | grep postgresql

# Reiniciar la base de datos
docker restart proofpass-postgres
```

### Error: "Prisma client not generated"

```bash
cd apps/api
npx prisma generate
```

### Error: "Module not found @proofpass/types"

```bash
# Compilar los packages
npm run build:packages
```

### La API no responde

```bash
# Verificar logs
cd apps/api
cat api.log

# Reiniciar en modo verbose
DEBUG=* npm run dev
```

## Testing con cURL

He aquí un flujo completo:

```bash
#!/bin/bash

# 1. Register
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. Create attestation
ATTESTATION=$(curl -s -X POST http://localhost:3000/api/attestations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"identity","subject":"did:key:z6Mkf","claims":{"name":"Alice"}}' \
  | jq -r '.id')

echo "Attestation ID: $ATTESTATION"

# 3. Create passport
PASSPORT=$(curl -s -X POST http://localhost:3000/api/passports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"holder\":\"did:key:z6Mkf\",\"attestationIds\":[\"$ATTESTATION\"]}" \
  | jq -r '.id')

echo "Passport ID: $PASSPORT"

# 4. Get passport
curl -s http://localhost:3000/api/passports/$PASSPORT \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

## Base de datos de prueba

Para poblar la base de datos con datos de prueba:

```bash
cd apps/api
npx prisma db seed
```

## Siguiente paso

Una vez que todo funcione localmente, puedes:

1. Configurar blockchain testnet (ver `packages/blockchain/TESTING.md`)
2. Testear con QR codes
3. Probar integración con el SDK de JavaScript
4. Deploy a producción

## Producción Local (Docker)

Para testear el setup de producción localmente:

```bash
# Build de Docker
docker-compose build

# Correr todo el stack
docker-compose up

# Parar
docker-compose down
```

Esto correrá:
- API en puerto 3000
- Platform en puerto 3001
- PostgreSQL en puerto 5432
- Nginx en puerto 80

## Contacto

Si tienes problemas:

1. Revisa los logs: `apps/api/api.log`
2. Verifica la base de datos: `npx prisma studio`
3. Abre un issue en GitHub
