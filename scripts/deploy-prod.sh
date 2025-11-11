#!/bin/bash
# ==============================================================================
# ProofPass Platform - Production Deployment Script
# ==============================================================================
#
# This script automates the production deployment of ProofPass Platform
# including pre-flight checks, Docker deployment, health verification,
# and automatic rollback on failure.
#
# Usage:
#   ./scripts/deploy-prod.sh [options]
#
# Options:
#   --skip-checks     Skip pre-flight checks
#   --skip-backup     Skip database backup
#   --skip-build      Skip Docker image rebuild
#   --dry-run         Show what would be done without executing
#   --rollback        Rollback to previous version
#   --help            Show this help message
#
# Requirements:
#   - Docker & Docker Compose installed
#   - .env.production configured
#   - Root or sudo access
#
# Last Updated: 2025-11-03
# Version: 2.0.0
# ==============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/deployment.log"
HEALTH_CHECK_URL="http://localhost:3000/health"
HEALTH_CHECK_TIMEOUT=60
MAX_RETRY_ATTEMPTS=3

# Flags
SKIP_CHECKS=false
SKIP_BACKUP=false
SKIP_BUILD=false
DRY_RUN=false
ROLLBACK=false

# ==============================================================================
# Utility Functions
# ==============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $*" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $*" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $*" | tee -a "$LOG_FILE"
}

print_header() {
    echo ""
    echo "================================================================================"
    echo "  $1"
    echo "================================================================================"
    echo ""
}

confirm() {
    local prompt="$1"
    read -r -p "$prompt [y/N] " response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# ==============================================================================
# Parse Command Line Arguments
# ==============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-checks)
                SKIP_CHECKS=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    sed -n '2,27p' "$0" | sed 's/^# //; s/^#//'
}

# ==============================================================================
# Pre-flight Checks
# ==============================================================================

check_requirements() {
    print_header "Pre-flight Checks"

    # Check if running from correct directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json not found. Are you in the ProofPass project root?"
        exit 1
    fi
    log_success "Running from project root"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_success "Docker is installed ($(docker --version))"

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    log_success "Docker daemon is running"

    # Check Docker Compose
    if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    log_success "Docker Compose is installed"

    # Check compose file
    if [[ ! -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then
        log_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    log_success "Compose file found: $COMPOSE_FILE"

    # Check environment file
    if [[ ! -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
        log_error "Environment file not found: $ENV_FILE"
        log "Please create $ENV_FILE with production configuration"
        exit 1
    fi
    log_success "Environment file found: $ENV_FILE"

    # Validate environment variables
    source "$PROJECT_ROOT/$ENV_FILE"
    local required_vars=(
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "API_KEY_SALT"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable not set: $var"
            exit 1
        fi

        # Check minimum length for secrets
        if [[ ${#!var} -lt 32 ]]; then
            log_error "$var must be at least 32 characters long"
            exit 1
        fi
    done
    log_success "All required environment variables are set"

    # Check disk space (require at least 5GB)
    local available_space=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $available_space -lt 5 ]]; then
        log_error "Insufficient disk space. Available: ${available_space}GB, Required: 5GB"
        exit 1
    fi
    log_success "Sufficient disk space available: ${available_space}GB"

    # Check memory (require at least 2GB)
    local total_mem=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $total_mem -lt 2 ]]; then
        log_warning "Low memory detected. Recommended: 4GB+, Available: ${total_mem}GB"
    else
        log_success "Sufficient memory available: ${total_mem}GB"
    fi

    log_success "All pre-flight checks passed"
}

# ==============================================================================
# Backup Functions
# ==============================================================================

backup_database() {
    print_header "Database Backup"

    mkdir -p "$BACKUP_DIR"

    local backup_file="$BACKUP_DIR/proofpass_$(date +%Y%m%d_%H%M%S).sql"

    log "Creating database backup: $backup_file"

    if $DRY_RUN; then
        log "[DRY RUN] Would backup database to: $backup_file"
        return 0
    fi

    if docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T postgres pg_dump -U proofpass proofpass > "$backup_file" 2>/dev/null; then
        log_success "Database backup created: $backup_file"
        log "Backup size: $(du -h "$backup_file" | cut -f1)"

        # Keep only last 7 backups
        local backup_count=$(ls -1 "$BACKUP_DIR"/proofpass_*.sql 2>/dev/null | wc -l)
        if [[ $backup_count -gt 7 ]]; then
            log "Cleaning old backups (keeping last 7)"
            ls -1t "$BACKUP_DIR"/proofpass_*.sql | tail -n +8 | xargs rm -f
        fi
    else
        log_warning "Database backup failed (database may not be running yet)"
    fi
}

# ==============================================================================
# Deployment Functions
# ==============================================================================

pull_latest_code() {
    print_header "Pulling Latest Code"

    cd "$PROJECT_ROOT"

    # Check if git repo
    if [[ ! -d ".git" ]]; then
        log_warning "Not a git repository, skipping git pull"
        return 0
    fi

    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "Uncommitted changes detected"
        if ! confirm "Continue with deployment?"; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi

    log "Pulling latest code from git..."

    if $DRY_RUN; then
        log "[DRY RUN] Would execute: git pull origin main"
        return 0
    fi

    if git pull origin main; then
        log_success "Code updated successfully"
    else
        log_error "Failed to pull latest code"
        exit 1
    fi
}

build_images() {
    print_header "Building Docker Images"

    if $SKIP_BUILD; then
        log "Skipping image build (--skip-build flag)"
        return 0
    fi

    cd "$PROJECT_ROOT"

    log "Building Docker images..."

    if $DRY_RUN; then
        log "[DRY RUN] Would execute: docker compose -f $COMPOSE_FILE build --no-cache"
        return 0
    fi

    if docker compose -f "$COMPOSE_FILE" build --no-cache; then
        log_success "Docker images built successfully"
    else
        log_error "Failed to build Docker images"
        exit 1
    fi
}

deploy_services() {
    print_header "Deploying Services"

    cd "$PROJECT_ROOT"

    # Load environment variables
    export $(grep -v '^#' "$ENV_FILE" | xargs)

    log "Starting services with Docker Compose..."

    if $DRY_RUN; then
        log "[DRY RUN] Would execute: docker compose -f $COMPOSE_FILE up -d"
        return 0
    fi

    # Save current running containers for potential rollback
    docker compose -f "$COMPOSE_FILE" ps -q > "/tmp/proofpass_containers_backup.txt" 2>/dev/null || true

    # Deploy
    if docker compose -f "$COMPOSE_FILE" up -d; then
        log_success "Services started successfully"
    else
        log_error "Failed to start services"
        exit 1
    fi

    log "Waiting for services to stabilize (30 seconds)..."
    sleep 30
}

verify_health() {
    print_header "Health Check Verification"

    log "Checking service health..."

    if $DRY_RUN; then
        log "[DRY RUN] Would check health at: $HEALTH_CHECK_URL"
        return 0
    fi

    local attempt=0
    while [[ $attempt -lt $HEALTH_CHECK_TIMEOUT ]]; do
        if curl -sf "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log_success "Health check passed!"

            # Get full response
            local health_response=$(curl -s "$HEALTH_CHECK_URL")
            log "Health response: $health_response"

            # Verify readiness
            log "Checking readiness endpoint..."
            if curl -sf "http://localhost:3000/ready" > /dev/null 2>&1; then
                log_success "Readiness check passed!"
            else
                log_warning "Readiness check failed (this may be normal during startup)"
            fi

            return 0
        fi

        ((attempt++))
        if [[ $((attempt % 10)) -eq 0 ]]; then
            log "Still waiting for health check... ($attempt/$HEALTH_CHECK_TIMEOUT seconds)"
        fi
        sleep 1
    done

    log_error "Health check failed after $HEALTH_CHECK_TIMEOUT seconds"
    return 1
}

verify_services() {
    print_header "Service Verification"

    log "Checking container status..."

    if $DRY_RUN; then
        log "[DRY RUN] Would verify services"
        return 0
    fi

    # Check all containers are running
    local containers=$(docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" ps -q)
    local unhealthy=0

    for container in $containers; do
        local name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/^\///')
        local status=$(docker inspect --format='{{.State.Status}}' "$container")
        local health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no healthcheck{{end}}' "$container")

        if [[ "$status" != "running" ]]; then
            log_error "Container $name is not running (status: $status)"
            ((unhealthy++))
        elif [[ "$health" == "unhealthy" ]]; then
            log_error "Container $name is unhealthy"
            ((unhealthy++))
        else
            log_success "Container $name is healthy ($status, health: $health)"
        fi
    done

    if [[ $unhealthy -gt 0 ]]; then
        log_error "$unhealthy unhealthy container(s) detected"
        return 1
    fi

    log_success "All containers are healthy"
    return 0
}

# ==============================================================================
# Rollback Functions
# ==============================================================================

rollback_deployment() {
    print_header "Rolling Back Deployment"

    log_warning "Initiating rollback to previous version..."

    cd "$PROJECT_ROOT"

    if $DRY_RUN; then
        log "[DRY RUN] Would rollback deployment"
        return 0
    fi

    # Stop current containers
    log "Stopping current containers..."
    docker compose -f "$COMPOSE_FILE" down

    # Rollback to previous git commit
    if [[ -d ".git" ]]; then
        log "Rolling back to previous commit..."
        git reset --hard HEAD~1
    fi

    # Restart services
    log "Restarting services with previous version..."
    docker compose -f "$COMPOSE_FILE" up -d

    log_success "Rollback complete"
}

handle_deployment_failure() {
    log_error "Deployment failed!"

    # Show recent logs
    print_header "Recent Container Logs"
    docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" logs --tail=50 api

    if confirm "Do you want to rollback to the previous version?"; then
        rollback_deployment
    else
        log "Keeping current state. Check logs for troubleshooting:"
        log "  docker compose -f $COMPOSE_FILE logs -f"
    fi

    exit 1
}

# ==============================================================================
# Main Deployment Flow
# ==============================================================================

main() {
    # Parse arguments
    parse_args "$@"

    # Print banner
    clear
    echo "================================================================================"
    echo "  ProofPass Platform - Production Deployment"
    echo "================================================================================"
    echo "  Version: 2.0.0"
    echo "  Date: $(date +'%Y-%m-%d %H:%M:%S')"
    if $DRY_RUN; then
        echo "  Mode: DRY RUN (no changes will be made)"
    else
        echo "  Mode: PRODUCTION"
    fi
    echo "================================================================================"
    echo ""

    # Handle rollback request
    if $ROLLBACK; then
        rollback_deployment
        exit 0
    fi

    # Confirm production deployment
    if ! $DRY_RUN; then
        log_warning "You are about to deploy to PRODUCTION"
        if ! confirm "Are you sure you want to continue?"; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi

    # Start deployment log
    log "Starting ProofPass Platform deployment"
    log "Project root: $PROJECT_ROOT"
    log "Compose file: $COMPOSE_FILE"
    log "Environment: $ENV_FILE"

    # Pre-flight checks
    if ! $SKIP_CHECKS; then
        check_requirements
    else
        log_warning "Skipping pre-flight checks (--skip-checks flag)"
    fi

    # Backup database
    if ! $SKIP_BACKUP; then
        backup_database
    else
        log_warning "Skipping database backup (--skip-backup flag)"
    fi

    # Pull latest code
    pull_latest_code

    # Build images
    build_images

    # Deploy services
    deploy_services

    # Verify health
    if ! verify_health; then
        handle_deployment_failure
    fi

    # Verify services
    if ! verify_services; then
        handle_deployment_failure
    fi

    # Success!
    print_header "Deployment Successful!"

    log_success "ProofPass Platform deployed successfully!"
    log ""
    log "📊 Service Status:"
    docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" ps
    log ""
    log "🔗 Access Points:"
    log "   • API: http://localhost:3000"
    log "   • Health: http://localhost:3000/health"
    log "   • Docs: http://localhost:3000/docs"
    log ""
    log "📝 View logs:"
    log "   docker compose -f $COMPOSE_FILE logs -f"
    log ""
    log "🔄 Rollback if needed:"
    log "   $0 --rollback"
    log ""

    log_success "Deployment completed at $(date +'%Y-%m-%d %H:%M:%S')"
}

# ==============================================================================
# Script Entry Point
# ==============================================================================

# Ensure we're in the project root
cd "$PROJECT_ROOT"

# Run main deployment
main "$@"
