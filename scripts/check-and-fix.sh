#!/bin/bash

# ProofPass - Check and Fix Script
# Este script verifica y arregla problemas comunes

set -e

echo "[INFO] ProofPass - Check and Fix Script"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}[OK]${NC} $NODE_VERSION"
else
    echo -e "${RED}[ERROR] Node.js not found${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}[OK]${NC} $NPM_VERSION"
else
    echo -e "${RED}[ERROR] npm not found${NC}"
    exit 1
fi

# Check Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        echo -e "${GREEN}[OK] Docker is running${NC}"
    else
        echo -e "${YELLOW}[WARNING] Docker is installed but not running${NC}"
        echo "Please start Docker Desktop"
    fi
else
    echo -e "${YELLOW}[WARNING] Docker not found (optional)${NC}"
fi

echo ""
echo "[INFO] Checking dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo -e "${GREEN}[OK]${NC} Dependencies installed"
fi

# Check if packages are built
echo ""
echo "[INFO] Checking packages build..."

PACKAGES_TO_BUILD=(
    "packages/types"
    "packages/vc-toolkit"
    "packages/blockchain"
    "packages/client"
    "packages/templates"
    "packages/qr-toolkit"
)

NEEDS_BUILD=false

for pkg in "${PACKAGES_TO_BUILD[@]}"; do
    if [ ! -d "$pkg/dist" ]; then
        echo -e "${YELLOW}[WARNING]${NC} $pkg needs to be built"
        NEEDS_BUILD=true
    fi
done

if [ "$NEEDS_BUILD" = true ]; then
    echo ""
    echo "Building packages..."
    npm run build:packages || {
        echo -e "${RED}[ERROR] Build failed${NC}"
        echo "Try building packages individually:"
        for pkg in "${PACKAGES_TO_BUILD[@]}"; do
            echo "  cd $pkg && npm run build"
        done
        exit 1
    }
    echo -e "${GREEN}[OK]${NC} All packages built successfully"
else
    echo -e "${GREEN}[OK]${NC} All packages are built"
fi

# Check environment files
echo ""
echo "[INFO] Checking environment files..."

if [ ! -f ".env.docker" ]; then
    echo "Creating .env.docker..."
    cat > .env.docker << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/proofpass

# JWT & Auth
JWT_SECRET=dev_jwt_secret_change_in_production_min_32_chars
JWT_EXPIRES_IN=7d
API_KEY_SALT=dev_api_key_salt_change_in_production

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3000

# Redis
REDIS_URL=redis://redis:6379

# Stellar (testnet)
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SECRET_KEY=

# Admin
ADMIN_EMAIL=admin@proofpass.local
ADMIN_PASSWORD=admin123
EOF
    echo -e "${GREEN}[OK]${NC} Created .env.docker"
else
    echo -e "${GREEN}[OK]${NC} .env.docker exists"
fi

echo ""
echo "[SUCCESS] All checks passed!"
echo ""
echo "Next steps:"
echo "  1. Run tests:           ./scripts/run-tests.sh"
echo "  2. Start with Docker:   docker-compose up"
echo "  3. Build Docker images: docker build -t proofpass-api ."
echo ""
