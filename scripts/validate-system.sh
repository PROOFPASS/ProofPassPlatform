#!/bin/bash
# ProofPass Platform - System Validation
# Validates system requirements before installation
#
# Author: Federico Boiero (fboiero@frvm.utn.edu.ar)
# Date: November 13, 2025

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Minimum versions
MIN_NODE_VERSION="20.0.0"
MIN_NPM_VERSION="9.0.0"
MIN_DOCKER_VERSION="20.0.0"
MIN_GIT_VERSION="2.0.0"

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

log() {
    echo -e "${1}"
}

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

version_compare() {
    [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$1" ]
}

show_header() {
    clear
    echo -e "${CYAN}${BOLD}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           ProofPass Platform - System Validator             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    log_info "Checking system requirements..."
    echo ""
}

check_os() {
    echo -e "${BOLD}Operating System${NC}"
    echo "─────────────────────────────────────────────────────────────"

    OS=$(uname -s)
    ARCH=$(uname -m)

    case "$OS" in
        Linux*)
            log_success "OS: Linux ($ARCH)"
            ;;
        Darwin*)
            log_success "OS: macOS ($ARCH)"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            log_warning "OS: Windows ($ARCH) - Some features may have limited support"
            ;;
        *)
            log_error "OS: $OS - Unsupported operating system"
            ;;
    esac

    echo ""
}

check_node() {
    echo -e "${BOLD}Node.js${NC}"
    echo "─────────────────────────────────────────────────────────────"

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | sed 's/v//')

        if version_compare "$MIN_NODE_VERSION" "$NODE_VERSION"; then
            log_success "Node.js $NODE_VERSION (>= $MIN_NODE_VERSION required)"
        else
            log_error "Node.js $NODE_VERSION (< $MIN_NODE_VERSION required)"
            log_info "Install from: https://nodejs.org"
        fi
    else
        log_error "Node.js not found"
        log_info "Install from: https://nodejs.org"
    fi

    echo ""
}

check_npm() {
    echo -e "${BOLD}npm${NC}"
    echo "─────────────────────────────────────────────────────────────"

    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)

        if version_compare "$MIN_NPM_VERSION" "$NPM_VERSION"; then
            log_success "npm $NPM_VERSION (>= $MIN_NPM_VERSION required)"
        else
            log_warning "npm $NPM_VERSION (< $MIN_NPM_VERSION recommended)"
            log_info "Update with: npm install -g npm@latest"
        fi
    else
        log_error "npm not found"
    fi

    echo ""
}

check_git() {
    echo -e "${BOLD}Git${NC}"
    echo "─────────────────────────────────────────────────────────────"

    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | grep -oP '\d+\.\d+\.\d+')

        if version_compare "$MIN_GIT_VERSION" "$GIT_VERSION"; then
            log_success "Git $GIT_VERSION (>= $MIN_GIT_VERSION required)"
        else
            log_error "Git $GIT_VERSION (< $MIN_GIT_VERSION required)"
        fi

        # Check git config
        if git config --global user.name &> /dev/null && git config --global user.email &> /dev/null; then
            log_success "Git user configured"
        else
            log_warning "Git user not configured"
            log_info "Configure with: git config --global user.name 'Your Name'"
            log_info "                git config --global user.email 'your@email.com'"
        fi
    else
        log_error "Git not found"
        log_info "Install from: https://git-scm.com"
    fi

    echo ""
}

check_docker() {
    echo -e "${BOLD}Docker (Optional)${NC}"
    echo "─────────────────────────────────────────────────────────────"

    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)

        if version_compare "$MIN_DOCKER_VERSION" "$DOCKER_VERSION"; then
            log_success "Docker $DOCKER_VERSION (>= $MIN_DOCKER_VERSION required)"
        else
            log_warning "Docker $DOCKER_VERSION (< $MIN_DOCKER_VERSION recommended)"
        fi

        # Check if Docker daemon is running
        if docker info &> /dev/null; then
            log_success "Docker daemon running"
        else
            log_warning "Docker installed but daemon not running"
            log_info "Start Docker Desktop or run: sudo systemctl start docker"
        fi
    else
        log_warning "Docker not found (recommended for development)"
        log_info "Install from: https://www.docker.com"
    fi

    echo ""
}

check_postgresql() {
    echo -e "${BOLD}PostgreSQL (Optional)${NC}"
    echo "─────────────────────────────────────────────────────────────"

    if command -v psql &> /dev/null; then
        PG_VERSION=$(psql --version | grep -oP '\d+\.\d+' | head -1)
        log_success "PostgreSQL $PG_VERSION detected"
    else
        log_info "PostgreSQL not found (can use Docker instead)"
    fi

    echo ""
}

check_redis() {
    echo -e "${BOLD}Redis (Optional)${NC}"
    echo "─────────────────────────────────────────────────────────────"

    if command -v redis-cli &> /dev/null; then
        REDIS_VERSION=$(redis-cli --version | grep -oP '\d+\.\d+\.\d+')
        log_success "Redis $REDIS_VERSION detected"
    else
        log_info "Redis not found (can use Docker instead)"
    fi

    echo ""
}

check_ports() {
    echo -e "${BOLD}Port Availability${NC}"
    echo "─────────────────────────────────────────────────────────────"

    REQUIRED_PORTS=(3000 3001 5432 6379)
    PORT_NAMES=("API" "Platform" "PostgreSQL" "Redis")

    for i in "${!REQUIRED_PORTS[@]}"; do
        PORT="${REQUIRED_PORTS[$i]}"
        NAME="${PORT_NAMES[$i]}"

        if command -v lsof &> /dev/null; then
            if lsof -Pi :$PORT -sTCP:LISTEN -t &> /dev/null; then
                log_warning "Port $PORT ($NAME) already in use"
            else
                log_success "Port $PORT ($NAME) available"
            fi
        elif command -v netstat &> /dev/null; then
            if netstat -tuln | grep -q ":$PORT "; then
                log_warning "Port $PORT ($NAME) already in use"
            else
                log_success "Port $PORT ($NAME) available"
            fi
        else
            log_info "Cannot check port $PORT (lsof/netstat not available)"
        fi
    done

    echo ""
}

check_disk_space() {
    echo -e "${BOLD}Disk Space${NC}"
    echo "─────────────────────────────────────────────────────────────"

    REQUIRED_SPACE_MB=2000

    if command -v df &> /dev/null; then
        AVAILABLE_SPACE=$(df -m . | awk 'NR==2 {print $4}')

        if [ "$AVAILABLE_SPACE" -gt "$REQUIRED_SPACE_MB" ]; then
            log_success "Available disk space: ${AVAILABLE_SPACE}MB (>= ${REQUIRED_SPACE_MB}MB required)"
        else
            log_warning "Available disk space: ${AVAILABLE_SPACE}MB (< ${REQUIRED_SPACE_MB}MB recommended)"
        fi
    else
        log_info "Cannot check disk space (df not available)"
    fi

    echo ""
}

check_network() {
    echo -e "${BOLD}Network Connectivity${NC}"
    echo "─────────────────────────────────────────────────────────────"

    # Check npm registry
    if curl -s --max-time 5 https://registry.npmjs.org &> /dev/null; then
        log_success "npm registry accessible"
    else
        log_warning "Cannot reach npm registry"
    fi

    # Check Stellar testnet
    if curl -s --max-time 5 https://horizon-testnet.stellar.org &> /dev/null; then
        log_success "Stellar testnet accessible"
    else
        log_warning "Cannot reach Stellar testnet"
    fi

    # Check GitHub
    if curl -s --max-time 5 https://github.com &> /dev/null; then
        log_success "GitHub accessible"
    else
        log_warning "Cannot reach GitHub"
    fi

    echo ""
}

show_summary() {
    echo ""
    echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}Summary${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo ""

    echo -e "${GREEN}Passed:  ${BOLD}$CHECKS_PASSED${NC}"
    echo -e "${YELLOW}Warnings: ${BOLD}$CHECKS_WARNING${NC}"
    echo -e "${RED}Failed:   ${BOLD}$CHECKS_FAILED${NC}"
    echo ""

    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "${GREEN}${BOLD}✓ System is ready for ProofPass Platform installation!${NC}"
        echo ""
        echo -e "Next step: Run ${CYAN}./scripts/install-wizard.sh${NC}"
        EXIT_CODE=0
    elif [ $CHECKS_FAILED -le 2 ] && [ $CHECKS_PASSED -ge 5 ]; then
        echo -e "${YELLOW}${BOLD}⚠ System has some issues but may still work${NC}"
        echo ""
        echo -e "You can try to proceed with installation, but address the failed checks for best results."
        echo -e "Run: ${CYAN}./scripts/install-wizard.sh${NC}"
        EXIT_CODE=1
    else
        echo -e "${RED}${BOLD}✗ System does not meet minimum requirements${NC}"
        echo ""
        echo -e "Please address the failed checks above before installing."
        EXIT_CODE=2
    fi

    echo ""
}

# Main execution
main() {
    show_header
    check_os
    check_node
    check_npm
    check_git
    check_docker
    check_postgresql
    check_redis
    check_ports
    check_disk_space
    check_network
    show_summary

    exit $EXIT_CODE
}

main
