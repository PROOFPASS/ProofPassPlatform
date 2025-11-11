#!/bin/bash

# ================================
# ProofPass Localhost Startup Script
# ================================
# Este script levanta toda la plataforma en localhost

set -e  # Salir si hay algún error

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║   ProofPass Platform - Localhost Setup   ║"
echo "╔═══════════════════════════════════════════╗"
echo -e "${NC}"

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para verificar si un puerto está en uso
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# ================================
# 1. Verificar prerequisitos
# ================================
echo -e "${YELLOW}[1/6] Verificando prerequisitos...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"
echo -e "${GREEN}✓ npm: $(npm --version)${NC}"
echo -e "${GREEN}✓ Docker: $(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)${NC}"
echo ""

# ================================
# 2. Verificar/Iniciar PostgreSQL
# ================================
echo -e "${YELLOW}[2/6] Verificando PostgreSQL...${NC}"

# Verificar si el contenedor existe
if docker ps -a | grep -q "proofpass-postgres"; then
    # Verificar si está corriendo
    if docker ps | grep -q "proofpass-postgres"; then
        echo -e "${GREEN}✓ PostgreSQL ya está corriendo${NC}"
    else
        echo -e "${BLUE}→ Iniciando contenedor PostgreSQL...${NC}"
        docker start proofpass-postgres
        sleep 2
        echo -e "${GREEN}✓ PostgreSQL iniciado${NC}"
    fi
else
    echo -e "${BLUE}→ Creando contenedor PostgreSQL...${NC}"
    docker run --name proofpass-postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=proofpass_dev \
        -p 5432:5432 \
        -d postgres:15-alpine

    echo -e "${BLUE}→ Esperando a que PostgreSQL esté listo...${NC}"
    sleep 5
    echo -e "${GREEN}✓ PostgreSQL creado e iniciado${NC}"
fi
echo ""

# ================================
# 3. Instalar dependencias del API
# ================================
echo -e "${YELLOW}[3/6] Verificando dependencias del API...${NC}"

cd apps/api

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}→ Instalando dependencias...${NC}"
    npm install > /dev/null 2>&1
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✓ Dependencias ya instaladas${NC}"
fi

echo ""

# ================================
# 4. Compilar y Ejecutar Migraciones
# ================================
echo -e "${YELLOW}[4/6] Ejecutando migraciones de base de datos...${NC}"

echo -e "${BLUE}→ Compilando TypeScript...${NC}"
npm run build > /dev/null 2>&1

if [ ! -f "dist/config/migrate.js" ]; then
    echo -e "${RED}❌ Error: No se pudo compilar el proyecto${NC}"
    cd ../..
    exit 1
fi

echo -e "${BLUE}→ Ejecutando migraciones SQL...${NC}"
npm run migrate

echo -e "${GREEN}✓ Migraciones completadas${NC}"

cd ../..
echo ""

# ================================
# 5. Instalar dependencias del Platform
# ================================
echo -e "${YELLOW}[5/6] Verificando dependencias del Platform...${NC}"

cd apps/platform

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}→ Instalando dependencias...${NC}"
    npm install > /dev/null 2>&1
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✓ Dependencias ya instaladas${NC}"
fi

cd ../..
echo ""

# ================================
# 6. Verificar puertos
# ================================
echo -e "${YELLOW}[6/7] Verificando puertos disponibles...${NC}"

if port_in_use 3000; then
    echo -e "${RED}❌ Puerto 3000 (API) ya está en uso${NC}"
    echo -e "${YELLOW}   Ejecuta: lsof -i :3000 para ver qué lo está usando${NC}"
    exit 1
fi

if port_in_use 3001; then
    echo -e "${RED}❌ Puerto 3001 (Platform) ya está en uso${NC}"
    echo -e "${YELLOW}   Ejecuta: lsof -i :3001 para ver qué lo está usando${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Puertos 3000 y 3001 disponibles${NC}"
echo ""

# ================================
# 7. Iniciar servicios
# ================================
echo -e "${YELLOW}[7/7] Iniciando servicios...${NC}"
echo ""

# Crear directorio para logs si no existe
mkdir -p logs

# Función para limpiar procesos al salir
cleanup() {
    echo -e "\n${YELLOW}Deteniendo servicios...${NC}"
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
    fi
    if [ ! -z "$PLATFORM_PID" ]; then
        kill $PLATFORM_PID 2>/dev/null || true
    fi
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

# Verificar que el API está corriendo
if ps -p $API_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend API iniciado (PID: $API_PID)${NC}"
else
    echo -e "${RED}❌ Error al iniciar Backend API${NC}"
    echo -e "${YELLOW}   Ver logs en: logs/api.log${NC}"
    exit 1
fi

# Iniciar Frontend Platform
echo -e "${BLUE}→ Iniciando Frontend Platform (puerto 3001)...${NC}"
cd apps/platform
npm run dev > ../../logs/platform.log 2>&1 &
PLATFORM_PID=$!
cd ../..

sleep 5

# Verificar que el Platform está corriendo
if ps -p $PLATFORM_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend Platform iniciado (PID: $PLATFORM_PID)${NC}"
else
    echo -e "${RED}❌ Error al iniciar Frontend Platform${NC}"
    echo -e "${YELLOW}   Ver logs en: logs/platform.log${NC}"
    kill $API_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✓ ProofPass está corriendo!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}URLs disponibles:${NC}"
echo -e "  • Frontend:  ${GREEN}http://localhost:3001${NC}"
echo -e "  • Backend:   ${GREEN}http://localhost:3000${NC}"
echo -e "  • Prisma:    ${GREEN}npx prisma studio${NC} (en apps/api)"
echo ""
echo -e "${BLUE}Credenciales de acceso:${NC}"
echo -e "  • Email:     ${GREEN}admin@proofpass.local${NC}"
echo -e "  • Password:  ${GREEN}admin123${NC}"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  • API:       tail -f logs/api.log"
echo -e "  • Platform:  tail -f logs/platform.log"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

# Mantener el script corriendo y mostrar logs
tail -f logs/api.log logs/platform.log
