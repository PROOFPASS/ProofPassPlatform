#!/bin/bash

# ProofPass Platform - Stop Integration Script

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping ProofPass Integration Environment...${NC}"
echo ""

# Stop from PID files if they exist
if [ -f "$PROJECT_ROOT/logs/api.pid" ]; then
  API_PID=$(cat "$PROJECT_ROOT/logs/api.pid")
  echo -e "${YELLOW}Stopping API (PID: $API_PID)...${NC}"
  kill $API_PID 2>/dev/null || echo -e "${RED}API process not found${NC}"
  rm "$PROJECT_ROOT/logs/api.pid"
fi

if [ -f "$PROJECT_ROOT/logs/platform.pid" ]; then
  PLATFORM_PID=$(cat "$PROJECT_ROOT/logs/platform.pid")
  echo -e "${YELLOW}Stopping Platform (PID: $PLATFORM_PID)...${NC}"
  kill $PLATFORM_PID 2>/dev/null || echo -e "${RED}Platform process not found${NC}"
  rm "$PROJECT_ROOT/logs/platform.pid"
fi

# Fallback: kill by port
echo -e "${YELLOW}Cleaning up ports...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo ""
echo -e "${GREEN}✓ Integration environment stopped${NC}"
echo ""
