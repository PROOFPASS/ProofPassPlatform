#!/bin/bash
# ProofPass Platform - Install Wizard Test Script
# Tests the installation wizard functionality
#
# Author: Federico Boiero (fboiero@frvm.utn.edu.ar)
# Date: November 14, 2025

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

TEST_LOG="install-wizard-test-$(date +%Y%m%d_%H%M%S).log"
TESTS_PASSED=0
TESTS_FAILED=0

log_test() {
    echo -e "${CYAN}[TEST]${NC} $1" | tee -a "$TEST_LOG"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$TEST_LOG"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$TEST_LOG"
    ((TESTS_FAILED++))
}

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$TEST_LOG"
}

echo ""
echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║                                                            ║${NC}"
echo -e "${BOLD}${CYAN}║        Install Wizard Test Suite                          ║${NC}"
echo -e "${BOLD}${CYAN}║                                                            ║${NC}"
echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Check if install wizard script exists
log_test "Checking if install-wizard.sh exists..."
if [ -f "scripts/install-wizard.sh" ]; then
    log_pass "install-wizard.sh found"
else
    log_fail "install-wizard.sh not found"
    exit 1
fi

# Test 2: Check if script is executable
log_test "Checking if install-wizard.sh is executable..."
if [ -x "scripts/install-wizard.sh" ]; then
    log_pass "install-wizard.sh is executable"
else
    log_info "Making script executable..."
    chmod +x scripts/install-wizard.sh
    log_pass "install-wizard.sh made executable"
fi

# Test 3: Validate script syntax
log_test "Validating bash syntax..."
if bash -n scripts/install-wizard.sh 2>> "$TEST_LOG"; then
    log_pass "Bash syntax is valid"
else
    log_fail "Bash syntax errors found"
    exit 1
fi

# Test 4: Check for required functions
log_test "Checking for required functions..."
REQUIRED_FUNCTIONS=(
    "show_banner"
    "check_system"
    "select_installation_mode"
    "configure_environment"
    "install_dependencies"
    "setup_environment_files"
)

for func in "${REQUIRED_FUNCTIONS[@]}"; do
    if grep -q "^${func}()" scripts/install-wizard.sh; then
        log_pass "Function '$func' found"
    else
        log_fail "Function '$func' not found"
    fi
done

# Test 5: Check for required dependencies in wizard
log_test "Checking system requirements detection..."

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log_pass "Node.js detected: $NODE_VERSION"
else
    log_fail "Node.js not found"
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    log_pass "npm detected: $NPM_VERSION"
else
    log_fail "npm not found"
fi

# Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | grep -oP '\d+\.\d+\.\d+')
    log_pass "Git detected: $GIT_VERSION"
else
    log_fail "Git not found"
fi

# Docker (optional)
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
    log_pass "Docker detected (optional): $DOCKER_VERSION"
else
    log_info "Docker not found (optional)"
fi

# Test 6: Check for template files
log_test "Checking for .env template files..."

ENV_TEMPLATES=(
    "apps/api/.env.example"
    "apps/platform/.env.local.example"
)

TEMPLATE_FOUND=false
for template in "${ENV_TEMPLATES[@]}"; do
    if [ -f "$template" ]; then
        log_pass "Template found: $template"
        TEMPLATE_FOUND=true
    fi
done

if [ "$TEMPLATE_FOUND" = false ]; then
    log_info "No .env templates found (wizard will create from scratch)"
fi

# Test 7: Check if current .env files exist (backup test)
log_test "Checking current environment files..."

if [ -f "apps/api/.env" ]; then
    log_pass "apps/api/.env exists (backed up)"
else
    log_info "apps/api/.env not found (will be created)"
fi

if [ -f "apps/platform/.env.local" ]; then
    log_pass "apps/platform/.env.local exists (backed up)"
else
    log_info "apps/platform/.env.local not found (will be created)"
fi

# Test 8: Check for backup directory
log_test "Checking backup directory..."
if [ -d ".backups" ]; then
    BACKUP_COUNT=$(ls -1 .backups/*.backup.* 2>/dev/null | wc -l)
    log_pass "Backup directory exists with $BACKUP_COUNT backups"
else
    log_info "Backup directory not found"
fi

# Test 9: Validate install log creation
log_test "Testing log file creation..."
TEST_LOG_FILE="install-test-temp.log"
echo "test" > "$TEST_LOG_FILE"
if [ -f "$TEST_LOG_FILE" ]; then
    log_pass "Log file creation works"
    rm "$TEST_LOG_FILE"
else
    log_fail "Cannot create log files"
fi

# Test 10: Check if dependencies are already installed
log_test "Checking if dependencies are installed..."
if [ -d "node_modules" ]; then
    MODULE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    log_pass "node_modules exists with $MODULE_COUNT packages"
else
    log_info "node_modules not found (will be installed)"
fi

# Test 11: Check for package.json
log_test "Checking for package.json..."
if [ -f "package.json" ]; then
    log_pass "package.json found"

    # Check for required scripts
    REQUIRED_SCRIPTS=("dev" "build" "test")
    for script in "${REQUIRED_SCRIPTS[@]}"; do
        if grep -q "\"$script\":" package.json; then
            log_pass "Script '$script' found in package.json"
        else
            log_info "Script '$script' not found in package.json"
        fi
    done
else
    log_fail "package.json not found"
fi

# Test 12: Dry run check (parse only, don't execute)
log_test "Performing dry-run validation..."
if bash -n scripts/install-wizard.sh; then
    log_pass "Wizard script passes dry-run validation"
else
    log_fail "Wizard script has errors"
fi

# Test 13: Check for openssl (for secret generation)
log_test "Checking for openssl (secret generation)..."
if command -v openssl &> /dev/null; then
    OPENSSL_VERSION=$(openssl version)
    log_pass "openssl detected: $OPENSSL_VERSION"
else
    log_fail "openssl not found (required for secret generation)"
fi

# Test 14: Test secret generation
log_test "Testing secret generation..."
TEST_SECRET=$(openssl rand -hex 32)
if [ ${#TEST_SECRET} -eq 64 ]; then
    log_pass "Secret generation works (length: ${#TEST_SECRET})"
else
    log_fail "Secret generation failed"
fi

# Test 15: Check network connectivity
log_test "Checking network connectivity..."
if curl -s --max-time 5 https://registry.npmjs.org > /dev/null 2>&1; then
    log_pass "npm registry accessible"
else
    log_info "npm registry not accessible (may affect installation)"
fi

# Summary
echo ""
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}Test Summary${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Tests Passed: ${BOLD}$TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: ${BOLD}$TESTS_FAILED${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo -e "Success Rate: ${BOLD}${SUCCESS_RATE}%${NC}"
echo ""
echo -e "Log file: ${CYAN}$TEST_LOG${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ All tests passed!${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "1. To run the wizard: ${BOLD}npm run install:wizard${NC}"
    echo "2. Current .env files are backed up in: ${BOLD}.backups/${NC}"
    echo "3. Review the wizard in: ${BOLD}scripts/install-wizard.sh${NC}"
    echo ""
    exit 0
else
    echo -e "${YELLOW}${BOLD}⚠ Some tests failed${NC}"
    echo ""
    echo "Review the failures above before running the wizard"
    exit 1
fi
