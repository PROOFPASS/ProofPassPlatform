#!/bin/bash

# ProofPass - Docker Test Script
# Este script construye y prueba las imágenes Docker

set -e

echo "🐳 ProofPass - Docker Test Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Parse arguments
BUILD_TYPE="${1:-all}"  # all, api, platform

# Function to build image
build_image() {
    local name=$1
    local context=$2
    local dockerfile=$3
    local tag=$4

    echo -e "${BLUE}Building $name image...${NC}"
    echo "Context: $context"
    echo "Dockerfile: $dockerfile"
    echo "Tag: $tag"
    echo ""

    if docker build -t "$tag" -f "$dockerfile" "$context"; then
        echo -e "${GREEN}✓ $name image built successfully${NC}"
        echo "Image size: $(docker images $tag --format "{{.Size}}")"
        return 0
    else
        echo -e "${RED}✗ Failed to build $name image${NC}"
        return 1
    fi
}

# Function to test image
test_image() {
    local name=$1
    local tag=$2
    local port=$3

    echo ""
    echo -e "${BLUE}Testing $name image...${NC}"

    # Run container
    echo "Starting container..."
    CONTAINER_ID=$(docker run -d -p $port:$port \
        -e NODE_ENV=production \
        -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/proofpass \
        -e JWT_SECRET=test_secret_min_32_characters_long \
        -e REDIS_URL=redis://localhost:6379 \
        "$tag")

    echo "Container ID: $CONTAINER_ID"
    echo "Waiting for container to be ready..."
    sleep 10

    # Check if container is running
    if docker ps | grep -q $CONTAINER_ID; then
        echo -e "${GREEN}✓ Container is running${NC}"

        # Show logs
        echo ""
        echo "Container logs:"
        docker logs $CONTAINER_ID | tail -20

        # Cleanup
        echo ""
        echo "Stopping container..."
        docker stop $CONTAINER_ID > /dev/null
        docker rm $CONTAINER_ID > /dev/null
        echo -e "${GREEN}✓ Container stopped and removed${NC}"

        return 0
    else
        echo -e "${RED}✗ Container failed to start${NC}"
        docker logs $CONTAINER_ID
        docker rm $CONTAINER_ID > /dev/null 2>&1 || true
        return 1
    fi
}

FAILED=0

case "$BUILD_TYPE" in
    "all")
        echo "Building all images..."
        echo ""

        # Build API
        build_image "API" "." "./Dockerfile" "proofpass-api:test" || FAILED=1

        # Build Platform
        build_image "Platform" "./apps/platform" "./apps/platform/Dockerfile" "proofpass-platform:test" || FAILED=1

        ;;

    "api")
        build_image "API" "." "./Dockerfile" "proofpass-api:test" || FAILED=1
        # test_image "API" "proofpass-api:test" "3000" || FAILED=1
        ;;

    "platform")
        build_image "Platform" "./apps/platform" "./apps/platform/Dockerfile" "proofpass-platform:test" || FAILED=1
        # test_image "Platform" "proofpass-platform:test" "3001" || FAILED=1
        ;;

    *)
        echo -e "${RED}Unknown build type: $BUILD_TYPE${NC}"
        echo "Usage: $0 [all|api|platform]"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All Docker builds successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "  • Test with docker-compose: docker-compose up"
    echo "  • Push to registry: docker push <image>"
    echo "  • Run locally: docker run -p 3000:3000 proofpass-api:test"
    exit 0
else
    echo -e "${RED}❌ Some Docker builds failed${NC}"
    exit 1
fi
