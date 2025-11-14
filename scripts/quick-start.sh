#!/bin/bash

# ProofPass Platform - Quick Start Script
# Este script configura todo para desarrollo local

set -e

echo "[START] ProofPass Platform - Quick Start"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}[ERROR] Error: Se requiere Node.js >= 18${NC}"
  echo "Tu versión: $(node -v)"
  exit 1
fi

echo -e "${GREEN}[OK]${NC} Node.js $(node -v)"

# Step 1: Install dependencies
echo ""
echo "[INFO] Instalando dependencias..."
npm install

# Step 2: Build packages
echo ""
echo "[INFO] Compilando packages..."
npm run build:packages

# Step 3: Check for PostgreSQL
echo ""
echo "[INFO] Verificando PostgreSQL..."

if command -v docker &> /dev/null; then
  echo "   Docker encontrado. ¿Quieres usar PostgreSQL con Docker? (y/n)"
  read -r USE_DOCKER

  if [ "$USE_DOCKER" = "y" ] || [ "$USE_DOCKER" = "Y" ]; then
    echo "   Iniciando PostgreSQL en Docker..."

    # Check if container exists
    if docker ps -a | grep -q proofpass-postgres; then
      echo "   Container ya existe. Iniciándolo..."
      docker start proofpass-postgres
    else
      echo "   Creando nuevo container..."
      docker run --name proofpass-postgres \
        -e POSTGRES_USER=proofpass \
        -e POSTGRES_PASSWORD=dev_password_123 \
        -e POSTGRES_DB=proofpass \
        -p 5432:5432 \
        -d postgres:14-alpine

      echo "   Esperando a que PostgreSQL inicie..."
      sleep 5
    fi

    echo -e "${GREEN}[OK]${NC} PostgreSQL corriendo en Docker"
    DATABASE_URL="postgresql://proofpass:dev_password_123@localhost:5432/proofpass"
  else
    echo "   Asegúrate de que PostgreSQL esté corriendo localmente"
    echo "   DATABASE_URL por defecto: postgresql://localhost:5432/proofpass"
    DATABASE_URL="postgresql://localhost:5432/proofpass"
  fi
else
  echo "   Docker no encontrado. Usando PostgreSQL local..."
  DATABASE_URL="postgresql://localhost:5432/proofpass"
fi

# Step 4: Setup .env files
echo ""
echo "[INFO] Configurando archivos .env..."

# API .env
if [ ! -f "apps/api/.env" ]; then
  echo "   Creando apps/api/.env..."
  cat > apps/api/.env << EOF
# Database
DATABASE_URL="${DATABASE_URL}"

# JWT Secret (cambia esto en producción)
JWT_SECRET="$(openssl rand -hex 32)"

# Server
PORT=3000
NODE_ENV="development"

# Blockchain (opcional - agregar después)
# STELLAR_SECRET_KEY="SXXXXXX..."
# ETH_PRIVATE_KEY="0x..."
EOF
  echo -e "${GREEN}[OK]${NC} apps/api/.env creado"
else
  echo -e "${YELLOW}[WARNING]${NC} apps/api/.env ya existe (no se sobrescribió)"
fi

# Blockchain .env
if [ ! -f "packages/blockchain/.env" ]; then
  echo "   Creando packages/blockchain/.env..."
  cp packages/blockchain/.env.example packages/blockchain/.env
  echo -e "${GREEN}[OK]${NC} packages/blockchain/.env creado"
fi

# Step 5: Setup database
echo ""
echo "[INFO] Configurando base de datos..."
cd apps/api

# Generate Prisma client
echo "   Generando cliente Prisma..."
npx prisma generate

# Run migrations
echo "   Ejecutando migraciones..."
npx prisma migrate dev --name init

echo -e "${GREEN}[OK]${NC} Base de datos configurada"

cd ../..

# Step 6: Summary
echo ""
echo "[SUCCESS] Setup completado!"
echo ""
echo "Para iniciar el proyecto, usa:"
echo ""
echo "  ${GREEN}# Terminal 1 - API${NC}"
echo "  npm run dev:api"
echo ""
echo "  ${GREEN}# Terminal 2 - Platform (si está disponible)${NC}"
echo "  npm run dev:platform"
echo ""
echo "  ${GREEN}# Terminal 3 - Database UI (opcional)${NC}"
echo "  npm run db:studio"
echo ""
echo "URLs:"
echo "  API:      http://localhost:3000"
echo "  Platform: http://localhost:3001"
echo "  DB UI:    http://localhost:5555"
echo ""
echo "Documentación:"
echo "  Setup local completo: LOCAL_DEVELOPMENT.md"
echo "  Testing blockchain:   packages/blockchain/TESTING.md"
echo ""
echo "¡Listo para desarrollar!"
