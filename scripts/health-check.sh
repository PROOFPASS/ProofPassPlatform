#!/bin/bash
# ProofPass Platform - Health Check
# Verifies installation and runtime health
#
# Author: Federico Boiero (fboiero@frvm.utn.edu.ar)
# Date: November 13, 2025

set -e

# Colors (only if output is a terminal)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    NC='\033[0m'
    BOLD='\033[1m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    NC=''
    BOLD=''
fi

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

log_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

log_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

show_header() {
    # Only clear if stdin is a terminal
    [ -t 0 ] && clear
    echo -e "${CYAN}${BOLD}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           ProofPass Platform - Health Check                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    log_info "Checking platform health..."
    echo ""
}

check_dependencies() {
    echo -e "${BOLD}Dependencies${NC}"
    echo "─────────────────────────────────────────────────────────────"

    if [ -d "node_modules" ]; then
        log_success "node_modules directory exists"
    else
        log_error "node_modules not found - run: npm install"
        return
    fi

    # Check critical packages
    CRITICAL_PACKAGES=("@stellar/stellar-sdk" "next" "express" "prisma")

    for package in "${CRITICAL_PACKAGES[@]}"; do
        if [ -d "node_modules/$package" ]; then
            log_success "Package $package installed"
        else
            log_error "Package $package missing"
        fi
    done

    echo ""
}

check_environment_files() {
    echo -e "${BOLD}Environment Files${NC}"
    echo "─────────────────────────────────────────────────────────────"

    # Check API .env
    if [ -f "apps/api/.env" ]; then
        log_success "apps/api/.env exists"

        # Check critical variables
        source apps/api/.env

        if [ -n "$DATABASE_URL" ]; then
            log_success "DATABASE_URL configured"
        else
            log_warning "DATABASE_URL not set"
        fi

        if [ -n "$JWT_SECRET" ]; then
            log_success "JWT_SECRET configured"
        else
            log_error "JWT_SECRET not set"
        fi

        if [ -n "$STELLAR_SECRET_KEY" ]; then
            log_success "STELLAR_SECRET_KEY configured"
        else
            log_warning "STELLAR_SECRET_KEY not set"
        fi
    else
        log_error "apps/api/.env not found"
    fi

    # Check Platform .env
    if [ -f "apps/platform/.env.local" ]; then
        log_success "apps/platform/.env.local exists"
    else
        log_warning "apps/platform/.env.local not found"
    fi

    echo ""
}

check_database() {
    echo -e "${BOLD}Database${NC}"
    echo "─────────────────────────────────────────────────────────────"

    # Check if PostgreSQL is running (Docker)
    if docker ps 2>/dev/null | grep -q proofpass-postgres; then
        log_success "PostgreSQL container running"

        # Check if we can connect
        if docker exec proofpass-postgres pg_isready -U proofpass 2>/dev/null 1>&2; then
            log_success "PostgreSQL accepting connections"
        else
            log_error "PostgreSQL not accepting connections"
        fi
    else
        log_warning "PostgreSQL container not running"
        log_info "Start with: docker start proofpass-postgres"
    fi

    # Check migrations
    if [ -d "apps/api/prisma/migrations" ]; then
        MIGRATION_COUNT=$(find apps/api/prisma/migrations -type d -mindepth 1 | wc -l)
        if [ "$MIGRATION_COUNT" -gt 0 ]; then
            log_success "Database migrations present ($MIGRATION_COUNT migrations)"
        else
            log_warning "No migrations found"
        fi
    else
        log_warning "Migrations directory not found"
    fi

    echo ""
}

check_redis() {
    echo -e "${BOLD}Redis${NC}"
    echo "─────────────────────────────────────────────────────────────"

    if docker ps 2>/dev/null | grep -q proofpass-redis; then
        log_success "Redis container running"

        # Check if we can connect
        if docker exec proofpass-redis redis-cli ping 2>/dev/null 1>&2; then
            log_success "Redis accepting connections"
        else
            log_error "Redis not accepting connections"
        fi
    else
        log_warning "Redis container not running"
        log_info "Start with: docker start proofpass-redis"
    fi

    echo ""
}

check_stellar() {
    echo -e "${BOLD}Stellar Integration${NC}"
    echo "─────────────────────────────────────────────────────────────"

    if [ -f "apps/api/.env" ]; then
        source apps/api/.env

        if [ -n "$STELLAR_PUBLIC_KEY" ]; then
            log_success "Stellar public key configured"

            # Check if account exists on testnet
            HORIZON_URL="https://horizon-testnet.stellar.org"
            if curl -s --max-time 5 "$HORIZON_URL/accounts/$STELLAR_PUBLIC_KEY" &> /dev/null; then
                log_success "Stellar account verified on testnet"

                # Get balance
                BALANCE=$(curl -s "$HORIZON_URL/accounts/$STELLAR_PUBLIC_KEY" | grep -oP '"balance":"\K[^"]+' | head -1)
                if [ -n "$BALANCE" ]; then
                    log_info "Account balance: $BALANCE XLM"
                fi
            else
                log_warning "Cannot verify Stellar account"
            fi
        else
            log_warning "Stellar public key not configured"
        fi
    else
        log_error "Cannot check Stellar - .env not found"
    fi

    echo ""
}

check_build_artifacts() {
    echo -e "${BOLD}Build Artifacts${NC}"
    echo "─────────────────────────────────────────────────────────────"

    # Check packages build
    PACKAGES=("credential-manager" "did-manager" "qr-toolkit" "stellar-sdk" "templates")

    for package in "${PACKAGES[@]}"; do
        if [ -d "packages/$package/dist" ]; then
            log_success "Package $package built"
        else
            log_warning "Package $package not built"
        fi
    done

    echo ""
}

check_services() {
    echo -e "${BOLD}Services${NC}"
    echo "─────────────────────────────────────────────────────────────"

    # Check if API is running
    if curl -s --max-time 5 http://localhost:3000/health &> /dev/null; then
        log_success "API server responding on port 3000"
    else
        log_info "API server not running on port 3000"
        log_info "Start with: cd apps/api && npm run dev"
    fi

    # Check if Platform is running
    if curl -s --max-time 5 http://localhost:3001 &> /dev/null; then
        log_success "Platform responding on port 3001"
    else
        log_info "Platform not running on port 3001"
        log_info "Start with: cd apps/platform && npm run dev"
    fi

    echo ""
}

check_git_status() {
    echo -e "${BOLD}Git Status${NC}"
    echo "─────────────────────────────────────────────────────────────"

    if git rev-parse --git-dir &> /dev/null; then
        log_success "Git repository initialized"

        # Check for uncommitted changes
        if git diff-index --quiet HEAD -- 2> /dev/null; then
            log_success "No uncommitted changes"
        else
            log_info "Uncommitted changes present"
        fi

        # Check remote
        if git remote -v | grep -q origin; then
            log_success "Git remote configured"
        else
            log_warning "Git remote not configured"
        fi
    else
        log_error "Not a git repository"
    fi

    echo ""
}

check_documentation() {
    echo -e "${BOLD}Documentation${NC}"
    echo "─────────────────────────────────────────────────────────────"

    DOCS=("README.md" "START_HERE.md" "QUICK_START_STELLAR.md")

    for doc in "${DOCS[@]}"; do
        if [ -f "$doc" ]; then
            log_success "$doc present"
        else
            log_warning "$doc missing"
        fi
    done

    echo ""
}

show_summary() {
    echo ""
    echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}Summary${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo ""

    echo -e "${GREEN}Passed:   ${BOLD}$CHECKS_PASSED${NC}"
    echo -e "${YELLOW}Warnings: ${BOLD}$CHECKS_WARNING${NC}"
    echo -e "${RED}Failed:   ${BOLD}$CHECKS_FAILED${NC}"
    echo ""

    TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))
    HEALTH_SCORE=$((CHECKS_PASSED * 100 / TOTAL_CHECKS))

    echo -e "${CYAN}Health Score: ${BOLD}${HEALTH_SCORE}%${NC}"
    echo ""

    if [ $CHECKS_FAILED -eq 0 ] && [ $CHECKS_WARNING -le 2 ]; then
        echo -e "${GREEN}${BOLD}✓ Platform is healthy!${NC}"
        EXIT_CODE=0
    elif [ $CHECKS_FAILED -le 2 ]; then
        echo -e "${YELLOW}${BOLD}⚠ Platform has some issues${NC}"
        echo ""
        echo "Some checks failed or produced warnings. Review the output above."
        EXIT_CODE=1
    else
        echo -e "${RED}${BOLD}✗ Platform has serious issues${NC}"
        echo ""
        echo "Multiple checks failed. Please address the errors above."
        EXIT_CODE=2
    fi

    echo ""

    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${BOLD}Next Steps:${NC}"
        echo ""
        echo -e "1. Start API:      ${CYAN}cd apps/api && npm run dev${NC}"
        echo -e "2. Start Platform: ${CYAN}cd apps/platform && npm run dev${NC}"
        echo -e "3. Visit:          ${CYAN}http://localhost:3001${NC}"
        echo ""
    fi
}

# Main execution
main() {
    show_header
    check_dependencies
    check_environment_files
    check_database
    check_redis
    check_stellar
    check_build_artifacts
    check_services
    check_git_status
    check_documentation
    show_summary

    exit $EXIT_CODE
}

main
