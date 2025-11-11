#!/bin/bash

# ================================
# ProofPass Simple Startup Script
# ================================
# Script simplificado que asume que npm install ya fue ejecutado desde la raíz

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ProofPass - Startup Simple          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ================================
# 1. Verificar PostgreSQL
# ================================
echo -e "${YELLOW}[1/4] Verificando PostgreSQL...${NC}"

if docker ps | grep -q "proofpass-postgres"; then
    echo -e "${GREEN}✓ PostgreSQL está corriendo${NC}"
else
    echo -e "${RED}❌ PostgreSQL no está corriendo${NC}"
    echo -e "${BLUE}→ Iniciando PostgreSQL...${NC}"

    if docker ps -a | grep -q "proofpass-postgres"; then
        docker start proofpass-postgres
    else
        docker run --name proofpass-postgres \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=postgres \
            -e POSTGRES_DB=proofpass_dev \
            -p 5432:5432 \
            -d postgres:15-alpine
        sleep 5
    fi
    echo -e "${GREEN}✓ PostgreSQL iniciado${NC}"
fi
echo ""

# ================================
# 2. Compilar y ejecutar migraciones
# ================================
echo -e "${YELLOW}[2/4] Compilando API y ejecutando migraciones...${NC}"

cd apps/api

if [ ! -f "dist/config/migrate.js" ]; then
    echo -e "${BLUE}→ Compilando TypeScript...${NC}"
    npm run build
    echo -e "${GREEN}✓ Compilación completada${NC}"
fi

echo -e "${BLUE}→ Ejecutando migraciones...${NC}"
npm run migrate
echo -e "${GREEN}✓ Migraciones completadas${NC}"

cd ../..
echo ""

# ================================
# 3. Verificar puertos
# ================================
echo -e "${YELLOW}[3/4] Verificando puertos...${NC}"

if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${RED}❌ Puerto 3000 ya está en uso${NC}"
    lsof -i :3000
    exit 1
fi

if lsof -i :3001 >/dev/null 2>&1; then
    echo -e "${RED}❌ Puerto 3001 ya está en uso${NC}"
    lsof -i :3001
    exit 1
fi

echo -e "${GREEN}✓ Puertos 3000 y 3001 disponibles${NC}"
echo ""

# ================================
# 4. Iniciar servicios
# ================================
echo -e "${YELLOW}[4/4] Iniciando servicios...${NC}"
echo ""

mkdir -p logs

# Función de limpieza
cleanup() {
    echo -e "\n${YELLOW}Deteniendo servicios...${NC}"
    [ ! -z "$API_PID" ] && kill $API_PID 2>/dev/null || true
    [ ! -z "$PLATFORM_PID" ] && kill $PLATFORM_PID 2>/dev/null || true
    echo -e "${GREEN}✓ Servicios detenidos${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar Backend API
echo -e "${BLUE}→ Iniciando Backend API (puerto 3000)...${NC}"
cd apps/api
npm run dev > ../../logs/api.log 2>&1 &
API_PID=$!
cd ../..

sleep 3

if ps -p $API_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend API iniciado (PID: $API_PID)${NC}"
else
    echo -e "${RED}❌ Error al iniciar Backend API${NC}"
    echo -e "${YELLOW}   Ver logs: tail -f logs/api.log${NC}"
    exit 1
fi

# Iniciar Frontend Platform
echo -e "${BLUE}→ Iniciando Frontend Platform (puerto 3001)...${NC}"
cd apps/platform
npm run dev > ../../logs/platform.log 2>&1 &
PLATFORM_PID=$!
cd ../..

sleep 5

if ps -p $PLATFORM_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend Platform iniciado (PID: $PLATFORM_PID)${NC}"
else
    echo -e "${RED}❌ Error al iniciar Frontend Platform${NC}"
    echo -e "${YELLOW}   Ver logs: tail -f logs/platform.log${NC}"
    kill $API_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✓ ProofPass está corriendo!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}URLs:${NC}"
echo -e "  • Frontend:  ${GREEN}http://localhost:3001${NC}"
echo -e "  • Backend:   ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}Credenciales:${NC}"
echo -e "  • Email:     ${GREEN}admin@proofpass.local${NC}"
echo -e "  • Password:  ${GREEN}admin123${NC}"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  • API:       tail -f logs/api.log"
echo -e "  • Platform:  tail -f logs/platform.log"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener${NC}"
echo ""

# Mostrar logs
tail -f logs/api.log logs/platform.log
