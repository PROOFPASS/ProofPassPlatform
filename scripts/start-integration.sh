#!/bin/bash

# ProofPass Platform - Integration Start Script
# Levanta el backend API y el frontend Platform Dashboard

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "🚀 ProofPass Platform - Starting Integration Environment"
echo "========================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo -e "${RED}❌ PostgreSQL is not running on localhost:5432${NC}"
  echo -e "${YELLOW}Please start PostgreSQL first:${NC}"
  echo "  - macOS: brew services start postgresql"
  echo "  - Linux: sudo service postgresql start"
  echo "  - Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres"
  exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# Check if Redis is running
echo -e "${YELLOW}Checking Redis...${NC}"
if ! redis-cli ping > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Redis is not running (optional, rate limiting will use in-memory fallback)${NC}"
else
  echo -e "${GREEN}✓ Redis is running${NC}"
fi
echo ""

# Check environment files
echo -e "${YELLOW}Checking environment files...${NC}"
if [ ! -f "$PROJECT_ROOT/apps/api/.env" ]; then
  echo -e "${RED}❌ apps/api/.env not found${NC}"
  echo "Copy from .env.example: cp apps/api/.env.example apps/api/.env"
  exit 1
fi
echo -e "${GREEN}✓ API .env found${NC}"

if [ ! -f "$PROJECT_ROOT/apps/platform/.env.local" ]; then
  echo -e "${YELLOW}⚠️  apps/platform/.env.local not found, creating from template...${NC}"
  cat > "$PROJECT_ROOT/apps/platform/.env.local" <<EOL
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_API_URL=http://localhost:3000
EOL
  echo -e "${GREEN}✓ Created platform .env.local${NC}"
else
  echo -e "${GREEN}✓ Platform .env.local found${NC}"
fi
echo ""

# Build API if needed
echo -e "${YELLOW}Building API (if needed)...${NC}"
cd "$PROJECT_ROOT/apps/api"
if [ ! -d "dist" ]; then
  echo "Building TypeScript..."
  npm run build
fi
echo -e "${GREEN}✓ API built${NC}"
echo ""

# Kill any existing processes
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✓ Ports 3000 and 3001 are free${NC}"
echo ""

# Start API in background
echo -e "${YELLOW}Starting API server on port 3000...${NC}"
cd "$PROJECT_ROOT/apps/api"
npm run dev > "$PROJECT_ROOT/logs/api.log" 2>&1 &
API_PID=$!
echo -e "${GREEN}✓ API started (PID: $API_PID)${NC}"
echo "  Logs: $PROJECT_ROOT/logs/api.log"
echo ""

# Wait for API to be ready
echo -e "${YELLOW}Waiting for API to be ready...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is ready!${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ API failed to start${NC}"
    echo "Check logs: tail -f $PROJECT_ROOT/logs/api.log"
    kill $API_PID 2>/dev/null || true
    exit 1
  fi
  sleep 1
  echo -n "."
done
echo ""

# Start Platform in background
echo -e "${YELLOW}Starting Platform dashboard on port 3001...${NC}"
cd "$PROJECT_ROOT/apps/platform"
npm run dev > "$PROJECT_ROOT/logs/platform.log" 2>&1 &
PLATFORM_PID=$!
echo -e "${GREEN}✓ Platform started (PID: $PLATFORM_PID)${NC}"
echo "  Logs: $PROJECT_ROOT/logs/platform.log"
echo ""

# Wait for Platform to be ready
echo -e "${YELLOW}Waiting for Platform to be ready...${NC}"
for i in {1..60}; do
  if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Platform is ready!${NC}"
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${YELLOW}⚠️  Platform took longer than expected${NC}"
    echo "It might still be starting. Check: http://localhost:3001"
    break
  fi
  sleep 1
  echo -n "."
done
echo ""

# Save PIDs
mkdir -p "$PROJECT_ROOT/logs"
echo $API_PID > "$PROJECT_ROOT/logs/api.pid"
echo $PLATFORM_PID > "$PROJECT_ROOT/logs/platform.pid"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Integration Environment Started!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Services:${NC}"
echo "  📡 API Backend:      http://localhost:3000"
echo "  🎨 Platform UI:      http://localhost:3001"
echo "  📚 API Docs:         http://localhost:3000/documentation"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  API:      tail -f $PROJECT_ROOT/logs/api.log"
echo "  Platform: tail -f $PROJECT_ROOT/logs/platform.log"
echo ""
echo -e "${YELLOW}To stop:${NC}"
echo "  $SCRIPT_DIR/stop-integration.sh"
echo ""
echo -e "${YELLOW}Quick test:${NC}"
echo "  curl http://localhost:3000/health"
echo "  curl http://localhost:3001"
echo ""
