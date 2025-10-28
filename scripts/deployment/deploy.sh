#!/bin/bash

# ProofPass Deployment Script
# This script deploys the ProofPass platform to any server with Docker

set -e

echo "🚀 ProofPass Platform Deployment"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    echo "Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Load environment variables
source .env.production

echo "📋 Pre-deployment checks..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose found${NC}"

# Check if required environment variables are set
if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "CHANGE_THIS_SECURE_PASSWORD" ]; then
    echo -e "${RED}❌ Error: POSTGRES_PASSWORD not configured in .env.production${NC}"
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "GENERATE_A_SECURE_64_CHAR_HEX_STRING" ]; then
    echo -e "${RED}❌ Error: JWT_SECRET not configured in .env.production${NC}"
    echo "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    exit 1
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Build and start services
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo ""
echo "🎬 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running${NC}"
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    echo "Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

echo ""
echo "📊 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T api node -e "
const { execSync } = require('child_process');
try {
  execSync('cd /app/apps/api && node dist/config/migrate.js', { stdio: 'inherit' });
  console.log('✅ Migrations completed');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
"

echo ""
echo "🧪 Testing API health..."
sleep 5
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${API_PORT:-3000}/health)

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  API health check returned: $HEALTH_RESPONSE${NC}"
    echo "Check logs with: docker-compose -f docker-compose.prod.yml logs api"
fi

echo ""
echo "═══════════════════════════════════════════"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "═══════════════════════════════════════════"
echo ""
echo "📍 API URL: http://localhost:${API_PORT:-3000}"
echo "📚 API Docs: http://localhost:${API_PORT:-3000}/docs"
echo "💾 Database: PostgreSQL running on port 5432"
echo "🔴 Redis: Running on port 6379"
echo ""
echo "📝 Useful commands:"
echo "  View logs:       docker-compose -f docker-compose.prod.yml logs -f"
echo "  Stop services:   docker-compose -f docker-compose.prod.yml down"
echo "  Restart:         docker-compose -f docker-compose.prod.yml restart"
echo "  Shell access:    docker-compose -f docker-compose.prod.yml exec api sh"
echo ""
echo "🔐 Next steps:"
echo "  1. Configure your domain DNS to point to this server"
echo "  2. Setup SSL certificate with Let's Encrypt (see docs)"
echo "  3. Update CORS_ORIGIN in .env.production"
echo "  4. Setup backups (see scripts/deployment/backup.sh)"
echo ""
