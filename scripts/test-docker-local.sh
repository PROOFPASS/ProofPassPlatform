#!/bin/bash

# ProofPass Platform - Local Docker Testing Script
# This script helps test the full Docker stack on your local machine

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ProofPass Platform - Docker Testing  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production not found!${NC}"
    echo -e "${YELLOW}Creating .env.production from template...${NC}"
    cp .env.production.example .env.production
    echo -e "${YELLOW}⚠️  Please edit .env.production with your values before continuing${NC}"
    exit 1
fi

echo -e "${GREEN}✓ .env.production found${NC}"

# Check if SSL certificates exist
if [ ! -f "nginx/ssl/api.proofpass.co.crt" ] || [ ! -f "nginx/ssl/platform.proofpass.co.crt" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates not found, creating self-signed certificates...${NC}"
    mkdir -p nginx/ssl

    # Generate API certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/api.proofpass.co.key \
        -out nginx/ssl/api.proofpass.co.crt \
        -subj "/CN=api.proofpass.co/O=ProofPass/C=AR" > /dev/null 2>&1

    # Generate Platform certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/platform.proofpass.co.key \
        -out nginx/ssl/platform.proofpass.co.crt \
        -subj "/CN=platform.proofpass.co/O=ProofPass/C=AR" > /dev/null 2>&1

    echo -e "${GREEN}✓ SSL certificates created${NC}"
else
    echo -e "${GREEN}✓ SSL certificates found${NC}"
fi

echo ""
echo -e "${BLUE}Building Docker images...${NC}"
echo ""

# Build API image
echo -e "${YELLOW}Building API image...${NC}"
docker build -t proofpass-api:local ./apps/api

# Build Platform image
echo -e "${YELLOW}Building Platform image...${NC}"
docker build -t proofpass-platform:local ./apps/platform

echo ""
echo -e "${GREEN}✓ Docker images built successfully${NC}"
echo ""

# Option to start services
read -p "Do you want to start the services now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo -e "${BLUE}Starting services with docker-compose...${NC}"
    echo ""

    docker-compose -f docker-compose.production.yml --env-file .env.production up -d

    echo ""
    echo -e "${GREEN}✓ Services started!${NC}"
    echo ""
    echo -e "${BLUE}Waiting for services to be healthy...${NC}"
    sleep 10

    # Show container status
    echo ""
    echo -e "${BLUE}Container Status:${NC}"
    docker-compose -f docker-compose.production.yml ps

    echo ""
    echo -e "${BLUE}Service URLs (with self-signed SSL):${NC}"
    echo -e "  ${GREEN}API:${NC}      https://localhost/health"
    echo -e "  ${GREEN}Platform:${NC} https://localhost:3001"
    echo ""
    echo -e "${YELLOW}⚠️  Note: You'll see SSL warnings because we're using self-signed certificates.${NC}"
    echo -e "${YELLOW}    This is normal for local testing.${NC}"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "  ${GREEN}View logs:${NC}           docker-compose -f docker-compose.production.yml logs -f"
    echo -e "  ${GREEN}Stop services:${NC}       docker-compose -f docker-compose.production.yml down"
    echo -e "  ${GREEN}Restart service:${NC}     docker-compose -f docker-compose.production.yml restart <service>"
    echo -e "  ${GREEN}View API logs:${NC}       docker-compose -f docker-compose.production.yml logs -f api"
    echo -e "  ${GREEN}View Platform logs:${NC}  docker-compose -f docker-compose.production.yml logs -f platform"
    echo ""
else
    echo ""
    echo -e "${BLUE}To start services later, run:${NC}"
    echo -e "  ${GREEN}docker-compose -f docker-compose.production.yml up -d${NC}"
    echo ""
fi

echo -e "${GREEN}✓ Docker testing setup complete!${NC}"
