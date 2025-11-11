#!/bin/bash

# ProofPass - Run Tests Script
# Este script ejecuta los tests del proyecto

set -e

echo "🧪 ProofPass - Run Tests"
echo "========================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
TEST_TYPE="${1:-all}"  # all, api, platform, packages
WITH_COVERAGE="${2:-yes}"

# Function to check if service is running
check_service() {
    local service=$1
    local port=$2

    if nc -z localhost $port 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Check if PostgreSQL is needed and running (for API tests)
if [ "$TEST_TYPE" = "all" ] || [ "$TEST_TYPE" = "api" ]; then
    echo -n "Checking PostgreSQL... "
    if check_service "postgres" 5432; then
        echo -e "${GREEN}✓ Running on port 5432${NC}"
    else
        echo -e "${YELLOW}⚠ Not running${NC}"
        echo "API tests need PostgreSQL. Options:"
        echo "  1. Start with Docker: docker-compose up -d postgres"
        echo "  2. Start locally: brew services start postgresql"
        echo ""
        read -p "Start PostgreSQL with Docker? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose up -d postgres
            echo "Waiting for PostgreSQL to be ready..."
            sleep 5
        else
            echo "Skipping API tests"
            if [ "$TEST_TYPE" = "api" ]; then
                exit 1
            fi
            TEST_TYPE="platform"
        fi
    fi

    echo -n "Checking Redis... "
    if check_service "redis" 6379; then
        echo -e "${GREEN}✓ Running on port 6379${NC}"
    else
        echo -e "${YELLOW}⚠ Not running${NC}"
        echo "Starting Redis with Docker..."
        docker-compose up -d redis
        sleep 3
    fi
fi

echo ""

# Function to run tests
run_tests() {
    local name=$1
    local path=$2
    local cmd=$3

    echo -e "${BLUE}Running $name tests...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    cd "$path"

    if [ "$WITH_COVERAGE" = "yes" ]; then
        if eval "$cmd --coverage"; then
            echo -e "${GREEN}✓ $name tests passed${NC}"
            return 0
        else
            echo -e "${RED}✗ $name tests failed${NC}"
            return 1
        fi
    else
        if eval "$cmd"; then
            echo -e "${GREEN}✓ $name tests passed${NC}"
            return 0
        else
            echo -e "${RED}✗ $name tests failed${NC}"
            return 1
        fi
    fi
}

# Track failures
FAILED=0

# Run tests based on type
case "$TEST_TYPE" in
    "all")
        echo "Running all tests..."
        echo ""

        # API tests
        run_tests "API" "apps/api" "npm test" || FAILED=1
        cd ../..

        # Platform tests
        run_tests "Platform" "apps/platform" "npm test" || FAILED=1
        cd ../..

        # Package tests
        echo ""
        echo -e "${BLUE}Running package tests...${NC}"
        for pkg in packages/*/; do
            if [ -f "${pkg}package.json" ] && grep -q '"test"' "${pkg}package.json"; then
                pkg_name=$(basename "$pkg")
                run_tests "$pkg_name" "$pkg" "npm test" || FAILED=1
                cd ../..
            fi
        done
        ;;

    "api")
        run_tests "API" "apps/api" "npm test"
        FAILED=$?
        ;;

    "platform")
        run_tests "Platform" "apps/platform" "npm test"
        FAILED=$?
        ;;

    "packages")
        for pkg in packages/*/; do
            if [ -f "${pkg}package.json" ] && grep -q '"test"' "${pkg}package.json"; then
                pkg_name=$(basename "$pkg")
                run_tests "$pkg_name" "$pkg" "npm test" || FAILED=1
                cd ../..
            fi
        done
        ;;

    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo "Usage: $0 [all|api|platform|packages] [yes|no]"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
