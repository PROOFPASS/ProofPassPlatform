#!/bin/bash
# Deployment script for ProofPass API
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_DIR="$PROJECT_DIR/apps/api"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 ProofPass API Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Project Dir: $PROJECT_DIR"
echo "API Dir: $API_DIR"
echo ""

# Check Node version
NODE_VERSION=$(node -v)
echo "✓ Node.js: $NODE_VERSION"

# Navigate to project root
cd "$PROJECT_DIR"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Installing Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm install --production=false

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏗️  Building Packages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm run build:packages

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Building API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$API_DIR"
npm run build

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Database Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "$API_DIR/.env.$ENVIRONMENT" ]; then
    echo "Loading .env.$ENVIRONMENT"
    export $(cat "$API_DIR/.env.$ENVIRONMENT" | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .env.$ENVIRONMENT not found, using default .env"
fi

# Run migrations (if migration script exists)
if [ -f "$API_DIR/dist/config/migrate.js" ]; then
    node "$API_DIR/dist/config/migrate.js"
else
    echo "⚠️  No migration script found, skipping..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Restarting Service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo "Using PM2..."

    # Check if process exists
    if pm2 describe proofpass-api &> /dev/null; then
        echo "Restarting existing process..."
        pm2 restart proofpass-api
    else
        echo "Starting new process..."
        pm2 start "$API_DIR/dist/main.js" --name proofpass-api
    fi

    pm2 save
    echo "✓ PM2 process updated"
else
    echo "⚠️  PM2 not found. Please install PM2 or use another process manager."
    echo "   npm install -g pm2"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  • Check logs: pm2 logs proofpass-api"
echo "  • Monitor: pm2 monit"
echo "  • Test health: curl http://localhost:3000/health"
echo ""
