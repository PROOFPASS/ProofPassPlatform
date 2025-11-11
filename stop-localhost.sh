#!/bin/bash

# ================================
# ProofPass Localhost Stop Script
# ================================
# Este script detiene todos los servicios de ProofPass

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deteniendo servicios de ProofPass...${NC}"
echo ""

# Detener procesos Node.js en los puertos 3000 y 3001
echo -e "${YELLOW}→ Buscando procesos en puertos 3000 y 3001...${NC}"

# Puerto 3000 (API)
API_PID=$(lsof -ti:3000)
if [ ! -z "$API_PID" ]; then
    kill -9 $API_PID 2>/dev/null
    echo -e "${GREEN}✓ Backend API detenido (PID: $API_PID)${NC}"
else
    echo -e "${YELLOW}  No hay procesos en puerto 3000${NC}"
fi

# Puerto 3001 (Platform)
PLATFORM_PID=$(lsof -ti:3001)
if [ ! -z "$PLATFORM_PID" ]; then
    kill -9 $PLATFORM_PID 2>/dev/null
    echo -e "${GREEN}✓ Frontend Platform detenido (PID: $PLATFORM_PID)${NC}"
else
    echo -e "${YELLOW}  No hay procesos en puerto 3001${NC}"
fi

echo ""

# Opcional: Detener PostgreSQL
read -p "¿Deseas detener también PostgreSQL? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if docker ps | grep -q "proofpass-postgres"; then
        docker stop proofpass-postgres >/dev/null 2>&1
        echo -e "${GREEN}✓ PostgreSQL detenido${NC}"
    else
        echo -e "${YELLOW}  PostgreSQL no está corriendo${NC}"
    fi
else
    echo -e "${YELLOW}  PostgreSQL sigue corriendo${NC}"
fi

echo ""
echo -e "${GREEN}✓ Servicios detenidos${NC}"
