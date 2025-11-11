#!/bin/bash

# ProofPass Platform - Local Setup Script
# Configura automáticamente el entorno local para testing

set -e

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ProofPass Platform - Local Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${COLOR_RESET}"

# Check Node.js
echo -e "${COLOR_YELLOW}[1/10] Verificando Node.js...${COLOR_RESET}"
if ! command -v node &> /dev/null; then
    echo -e "${COLOR_RED}Error: Node.js no está instalado${COLOR_RESET}"
    echo "Instala Node.js >= 18.0.0 desde https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${COLOR_RED}Error: Node.js debe ser >= 18.0.0${COLOR_RESET}"
    exit 1
fi
echo -e "${COLOR_GREEN}✓ Node.js $(node -v)${COLOR_RESET}"

# Check PostgreSQL
echo -e "${COLOR_YELLOW}[2/10] Verificando PostgreSQL...${COLOR_RESET}"
if ! command -v psql &> /dev/null; then
    echo -e "${COLOR_YELLOW}⚠ PostgreSQL no encontrado${COLOR_RESET}"
    echo "Instala PostgreSQL:"
    echo "  macOS: brew install postgresql@14"
    echo "  Ubuntu: sudo apt install postgresql-14"
    exit 1
fi
echo -e "${COLOR_GREEN}✓ PostgreSQL instalado${COLOR_RESET}"

# Install dependencies
echo -e "${COLOR_YELLOW}[3/10] Instalando dependencias...${COLOR_RESET}"
npm install
echo -e "${COLOR_GREEN}✓ Dependencias instaladas${COLOR_RESET}"

# Build packages
echo -e "${COLOR_YELLOW}[4/10] Building packages...${COLOR_RESET}"
npm run build:packages
echo -e "${COLOR_GREEN}✓ Packages compilados${COLOR_RESET}"

# Setup database
echo -e "${COLOR_YELLOW}[5/10] Configurando base de datos...${COLOR_RESET}"

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw proofpass; then
    echo -e "${COLOR_GREEN}✓ Base de datos 'proofpass' ya existe${COLOR_RESET}"
else
    echo "Creando base de datos 'proofpass'..."
    createdb proofpass 2>/dev/null || psql -c "CREATE DATABASE proofpass;"
    echo -e "${COLOR_GREEN}✓ Base de datos creada${COLOR_RESET}"
fi

# Create .env files if they don't exist
echo -e "${COLOR_YELLOW}[6/10] Configurando variables de entorno...${COLOR_RESET}"

# API .env
if [ ! -f "apps/api/.env" ]; then
    cat > apps/api/.env << 'EOF'
DATABASE_URL="postgresql://postgres@localhost:5432/proofpass"
JWT_SECRET="local-dev-secret-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"

# Blockchain Testnets
OPTIMISM_RPC_URL="https://sepolia.optimism.io"
ARBITRUM_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
STELLAR_NETWORK="testnet"
STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"

# Stripe (test mode)
STRIPE_SECRET_KEY="sk_test_..."

ALLOWED_ORIGINS="http://localhost:3001,http://localhost:3000"
EOF
    echo -e "${COLOR_GREEN}✓ Creado apps/api/.env${COLOR_RESET}"
else
    echo -e "${COLOR_GREEN}✓ apps/api/.env ya existe${COLOR_RESET}"
fi

# Platform .env.local
if [ ! -f "apps/platform/.env.local" ]; then
    cat > apps/platform/.env.local << 'EOF'
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="local-dev-nextauth-secret-change-in-production"
EOF
    echo -e "${COLOR_GREEN}✓ Creado apps/platform/.env.local${COLOR_RESET}"
else
    echo -e "${COLOR_GREEN}✓ apps/platform/.env.local ya existe${COLOR_RESET}"
fi

# Run Prisma migrations
echo -e "${COLOR_YELLOW}[7/10] Ejecutando migraciones de Prisma...${COLOR_RESET}"
npm run db:generate
npm run db:migrate
echo -e "${COLOR_GREEN}✓ Migraciones completadas${COLOR_RESET}"

# Run tests
echo -e "${COLOR_YELLOW}[8/10] Ejecutando tests...${COLOR_RESET}"
npm run test:ci
echo -e "${COLOR_GREEN}✓ Tests pasados${COLOR_RESET}"

# Check test coverage
echo -e "${COLOR_YELLOW}[9/10] Verificando coverage...${COLOR_RESET}"
npm run test:coverage
echo -e "${COLOR_GREEN}✓ Coverage >= 85%${COLOR_RESET}"

# Summary
echo -e "${COLOR_YELLOW}[10/10] Resumen de setup...${COLOR_RESET}"
echo ""
echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
echo -e "${COLOR_GREEN}✓ Setup completado exitosamente!${COLOR_RESET}"
echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
echo ""
echo "Pasos siguientes:"
echo ""
echo -e "  ${COLOR_YELLOW}1. Iniciar API:${COLOR_RESET}"
echo "     npm run dev:api"
echo ""
echo -e "  ${COLOR_YELLOW}2. Iniciar Platform (en otra terminal):${COLOR_RESET}"
echo "     npm run dev:platform"
echo ""
echo -e "  ${COLOR_YELLOW}3. Abrir en browser:${COLOR_RESET}"
echo "     API:      http://localhost:3000"
echo "     Platform: http://localhost:3001"
echo ""
echo -e "  ${COLOR_YELLOW}4. Ver Prisma Studio:${COLOR_RESET}"
echo "     npm run db:studio"
echo ""
echo -e "  ${COLOR_YELLOW}5. Ejecutar tests específicos:${COLOR_RESET}"
echo "     npm test                    # Todos los tests"
echo "     npm run test:coverage       # Con coverage"
echo "     npm run test:blockchain     # Blockchain tests"
echo ""
echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
echo ""
echo "Documentación:"
echo "  - LOCAL_SETUP.md       - Guía completa de setup local"
echo "  - DEPLOYMENT.md        - Guía de deployment a producción"
echo "  - TESTING_IMPROVEMENT_PLAN.md - Plan de testing"
echo ""
echo -e "${COLOR_GREEN}Happy coding! 🚀${COLOR_RESET}"
echo ""
