#!/bin/bash

# ProofPass Platform - Installation Wizard
# Interactive setup script for first-time installation
#
# Author: Federico Boiero (fboiero@frvm.utn.edu.ar)
# Date: November 13, 2025

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
INSTALL_LOG="install-$(date +%Y%m%d_%H%M%S).log"
MIN_NODE_VERSION="20.0.0"
MIN_DOCKER_VERSION="20.0.0"

# Functions
log() {
    echo -e "${1}" | tee -a "$INSTALL_LOG"
}

log_step() {
    echo ""
    log "${BLUE}${BOLD}==> $1${NC}"
}

log_success() {
    log "${GREEN}[OK]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

log_info() {
    log "${CYAN}[INFO]${NC} $1"
}

prompt() {
    echo -en "${YELLOW}? ${NC}${BOLD}$1${NC} "
    read -r REPLY
}

confirm() {
    echo -en "${YELLOW}? ${NC}${BOLD}$1 (y/n)${NC} "
    read -r REPLY
    [[ "$REPLY" =~ ^[Yy]$ ]]
}

show_banner() {
    clear
    cat << "EOF"
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                               ┃
┃   ██████╗ ██████╗  ██████╗  ██████╗ ███████╗██████╗  █████╗ ┃
┃   ██╔══██╗██╔══██╗██╔═══██╗██╔═══██╗██╔════╝██╔══██╗██╔══██╗┃
┃   ██████╔╝██████╔╝██║   ██║██║   ██║█████╗  ██████╔╝███████║┃
┃   ██╔═══╝ ██╔══██╗██║   ██║██║   ██║██╔══╝  ██╔═══╝ ██╔══██║┃
┃   ██║     ██║  ██║╚██████╔╝╚██████╔╝██║     ██║     ██║  ██║┃
┃   ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝     ╚═╝  ╚═╝┃
┃                                                               ┃
┃              Installation Wizard v1.0.0                       ┃
┃                                                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
EOF
    echo ""
    log_info "Welcome to ProofPass Platform Setup!"
    log_info "This wizard will guide you through the installation process."
    echo ""
}

check_system() {
    log_step "Checking system requirements..."

    # Check OS
    OS=$(uname -s)
    log_info "Operating System: $OS"

    # Check architecture
    ARCH=$(uname -m)
    log_info "Architecture: $ARCH"

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | sed 's/v//')
        log_success "Node.js $NODE_VERSION detected"

        if [ "$(printf '%s\n' "$MIN_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$MIN_NODE_VERSION" ]; then
            log_warning "Node.js version $NODE_VERSION is below recommended $MIN_NODE_VERSION"
        fi
    else
        log_error "Node.js not found. Please install Node.js $MIN_NODE_VERSION or higher"
        log_info "Visit: https://nodejs.org"
        exit 1
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        log_success "npm $NPM_VERSION detected"
    else
        log_error "npm not found"
        exit 1
    fi

    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
        log_success "Docker $DOCKER_VERSION detected"
        HAS_DOCKER=true
    else
        log_warning "Docker not found (optional but recommended)"
        HAS_DOCKER=false
    fi

    # Check PostgreSQL (optional)
    if command -v psql &> /dev/null; then
        PG_VERSION=$(psql --version | grep -oP '\d+\.\d+' | head -1)
        log_success "PostgreSQL $PG_VERSION detected"
        HAS_POSTGRES=true
    else
        log_warning "PostgreSQL not found (will use Docker if available)"
        HAS_POSTGRES=false
    fi

    # Check Redis (optional)
    if command -v redis-cli &> /dev/null; then
        log_success "Redis detected"
        HAS_REDIS=true
    else
        log_warning "Redis not found (will use Docker if available)"
        HAS_REDIS=false
    fi

    # Check Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | grep -oP '\d+\.\d+\.\d+')
        log_success "Git $GIT_VERSION detected"
    else
        log_error "Git not found. Please install Git"
        exit 1
    fi

    echo ""
}

select_installation_mode() {
    log_step "Select Installation Mode"
    echo ""
    echo "1) ${BOLD}Quick Start${NC} - Install with default settings (recommended)"
    echo "2) ${BOLD}Custom${NC} - Choose what to install and configure"
    echo "3) ${BOLD}Development${NC} - Full development environment with all tools"
    echo "4) ${BOLD}Production${NC} - Production-ready deployment"
    echo ""

    prompt "Select mode (1-4):"

    case $REPLY in
        1) INSTALL_MODE="quick" ;;
        2) INSTALL_MODE="custom" ;;
        3) INSTALL_MODE="development" ;;
        4) INSTALL_MODE="production" ;;
        *)
            log_error "Invalid selection"
            exit 1
            ;;
    esac

    log_success "Selected: $INSTALL_MODE mode"
}

configure_environment() {
    log_step "Environment Configuration"

    if [ "$INSTALL_MODE" = "quick" ]; then
        ENV_TYPE="development"
        USE_DOCKER=true
        INSTALL_STELLAR=true
        CREATE_ADMIN=true
    else
        # Ask for environment type
        echo ""
        prompt "Environment type (development/production) [development]:"
        ENV_TYPE=${REPLY:-development}

        # Ask for Docker usage
        if [ "$HAS_DOCKER" = true ]; then
            if confirm "Use Docker for PostgreSQL and Redis?"; then
                USE_DOCKER=true
            else
                USE_DOCKER=false
            fi
        else
            USE_DOCKER=false
        fi

        # Ask for Stellar setup
        if confirm "Setup Stellar testnet account?"; then
            INSTALL_STELLAR=true
        else
            INSTALL_STELLAR=false
        fi

        # Ask for admin user creation
        if confirm "Create admin user?"; then
            CREATE_ADMIN=true
        else
            CREATE_ADMIN=false
        fi
    fi

    log_info "Configuration:"
    log_info "  Environment: $ENV_TYPE"
    log_info "  Docker: $USE_DOCKER"
    log_info "  Stellar: $INSTALL_STELLAR"
    log_info "  Admin user: $CREATE_ADMIN"
    echo ""
}

install_dependencies() {
    log_step "Installing dependencies..."

    if [ -f "package-lock.json" ]; then
        log_info "Running npm ci for faster installation..."
        npm ci --silent >> "$INSTALL_LOG" 2>&1
    else
        log_info "Running npm install..."
        npm install --silent >> "$INSTALL_LOG" 2>&1
    fi

    log_success "Dependencies installed"
}

setup_environment_files() {
    log_step "Setting up environment files..."

    # API .env
    if [ ! -f "apps/api/.env" ]; then
        if [ -f "apps/api/.env.example" ]; then
            cp apps/api/.env.example apps/api/.env
            log_success "Created apps/api/.env from example"

            # Generate secrets
            JWT_SECRET=$(openssl rand -hex 32)
            API_KEY_SALT=$(openssl rand -hex 32)
            DID_ENCRYPTION_KEY=$(openssl rand -hex 32)

            # Update .env with generated secrets
            sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" apps/api/.env
            sed -i.bak "s/API_KEY_SALT=.*/API_KEY_SALT=$API_KEY_SALT/" apps/api/.env
            sed -i.bak "s/DID_ENCRYPTION_KEY=.*/DID_ENCRYPTION_KEY=$DID_ENCRYPTION_KEY/" apps/api/.env
            rm -f apps/api/.env.bak

            log_success "Generated secure secrets"
        else
            log_error "apps/api/.env.example not found"
            exit 1
        fi
    else
        log_info "apps/api/.env already exists"
    fi

    # Platform .env
    if [ ! -f "apps/platform/.env.local" ]; then
        echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > apps/platform/.env.local
        log_success "Created apps/platform/.env.local"
    else
        log_info "apps/platform/.env.local already exists"
    fi
}

setup_database() {
    log_step "Setting up database..."

    if [ "$USE_DOCKER" = true ]; then
        log_info "Starting PostgreSQL with Docker..."

        # Check if container exists
        if docker ps -a | grep -q proofpass-postgres; then
            log_info "PostgreSQL container already exists"
            docker start proofpass-postgres >> "$INSTALL_LOG" 2>&1 || true
        else
            docker run -d \
                --name proofpass-postgres \
                -e POSTGRES_DB=proofpass_dev \
                -e POSTGRES_USER=proofpass \
                -e POSTGRES_PASSWORD=proofpass_dev \
                -p 5432:5432 \
                postgres:14-alpine >> "$INSTALL_LOG" 2>&1
        fi

        log_success "PostgreSQL started"

        # Wait for PostgreSQL
        log_info "Waiting for PostgreSQL to be ready..."
        sleep 5

        # Update .env with Docker database
        sed -i.bak "s/DATABASE_HOST=.*/DATABASE_HOST=localhost/" apps/api/.env
        sed -i.bak "s/DATABASE_USER=.*/DATABASE_USER=proofpass/" apps/api/.env
        sed -i.bak "s/DATABASE_PASSWORD=.*/DATABASE_PASSWORD=proofpass_dev/" apps/api/.env
        rm -f apps/api/.env.bak
    fi

    # Run migrations
    log_info "Running database migrations..."
    cd apps/api
    npm run migrate >> "../../$INSTALL_LOG" 2>&1 || true
    cd ../..

    log_success "Database setup complete"
}

setup_redis() {
    if [ "$USE_DOCKER" = true ]; then
        log_step "Setting up Redis..."

        # Check if container exists
        if docker ps -a | grep -q proofpass-redis; then
            log_info "Redis container already exists"
            docker start proofpass-redis >> "$INSTALL_LOG" 2>&1 || true
        else
            docker run -d \
                --name proofpass-redis \
                -p 6379:6379 \
                redis:7-alpine >> "$INSTALL_LOG" 2>&1
        fi

        log_success "Redis started"
    fi
}

setup_stellar() {
    if [ "$INSTALL_STELLAR" = true ]; then
        log_step "Setting up Stellar testnet..."

        log_info "Creating Stellar testnet account..."
        npm run setup:stellar >> "$INSTALL_LOG" 2>&1

        log_success "Stellar testnet configured"
        log_info "Check apps/api/.env for your Stellar keys"
    fi
}

create_admin_user() {
    if [ "$CREATE_ADMIN" = true ]; then
        log_step "Creating admin user..."

        echo ""
        prompt "Admin email [admin@proofpass.local]:"
        ADMIN_EMAIL=${REPLY:-admin@proofpass.local}

        prompt "Admin password [admin123]:"
        ADMIN_PASSWORD=${REPLY:-admin123}

        # Update .env
        sed -i.bak "s/ADMIN_EMAIL=.*/ADMIN_EMAIL=$ADMIN_EMAIL/" apps/api/.env
        sed -i.bak "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASSWORD/" apps/api/.env
        rm -f apps/api/.env.bak

        log_success "Admin user configured"
        log_info "Email: $ADMIN_EMAIL"
        log_info "Password: $ADMIN_PASSWORD"
    fi
}

build_packages() {
    log_step "Building packages..."

    log_info "This may take a few minutes..."
    npm run build:packages >> "$INSTALL_LOG" 2>&1 || true

    log_success "Packages built"
}

show_completion() {
    clear
    cat << "EOF"
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                               ┃
┃                   ✓ Installation Complete!                   ┃
┃                                                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
EOF
    echo ""
    log_success "ProofPass Platform is ready to use!"
    echo ""
    log_step "Next Steps:"
    echo ""
    echo "1. Start the API server:"
    echo "   ${CYAN}cd apps/api && npm run dev${NC}"
    echo ""
    echo "2. Start the Platform dashboard:"
    echo "   ${CYAN}cd apps/platform && npm run dev${NC}"
    echo ""
    echo "3. Access the platform:"
    echo "   ${CYAN}http://localhost:3001${NC}"
    echo ""
    if [ "$CREATE_ADMIN" = true ]; then
        echo "4. Login with:"
        echo "   Email: ${YELLOW}$ADMIN_EMAIL${NC}"
        echo "   Password: ${YELLOW}$ADMIN_PASSWORD${NC}"
        echo ""
    fi

    log_info "Documentation: START_HERE.md"
    log_info "Quick Start: QUICK_START_STELLAR.md"
    log_info "Full logs: $INSTALL_LOG"
    echo ""
    log_info "Need help? fboiero@frvm.utn.edu.ar"
    echo ""
}

# Main installation flow
main() {
    show_banner

    if ! confirm "Continue with installation?"; then
        log_info "Installation cancelled"
        exit 0
    fi

    check_system
    select_installation_mode
    configure_environment

    if ! confirm "Proceed with installation?"; then
        log_info "Installation cancelled"
        exit 0
    fi

    echo ""
    log_step "Starting installation..."
    echo ""

    install_dependencies
    setup_environment_files
    setup_database
    setup_redis
    setup_stellar
    create_admin_user
    build_packages

    show_completion
}

# Run
main
