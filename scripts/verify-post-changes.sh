#!/bin/bash

# Verification Script - Post-Professionalization Changes
# This script verifies that all changes work correctly

set -e

REPORT_FILE="verification-report-$(date +%Y%m%d_%H%M%S).md"

echo "=================================================="
echo "ProofPass Platform - Post-Change Verification"
echo "=================================================="
echo ""

# Create report header
cat > "$REPORT_FILE" << EOF
# Verification Report

**Date**: $(date)
**Version**: v0.1.0 Post-Professionalization

---

## Verification Results

EOF

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log success
log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
    echo "- ✅ $1" >> "$REPORT_FILE"
}

# Function to log error
log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "- ❌ $1" >> "$REPORT_FILE"
}

# Function to log info
log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
    echo "- ℹ️ $1" >> "$REPORT_FILE"
}

# 1. Environment Check
echo ""
echo "### 1. Environment Check" | tee -a "$REPORT_FILE"
echo ""

log_info "Checking Node.js version..."
NODE_VERSION=$(node --version)
log_success "Node.js version: $NODE_VERSION"

log_info "Checking npm version..."
NPM_VERSION=$(npm --version)
log_success "npm version: $NPM_VERSION"

# 2. Dependencies
echo ""
echo "### 2. Dependencies Check" | tee -a "$REPORT_FILE"
echo ""

log_info "Installing dependencies..."
if npm install > /dev/null 2>&1; then
    log_success "Dependencies installed successfully"
else
    log_error "Failed to install dependencies"
    exit 1
fi

# 3. Linting
echo ""
echo "### 3. Code Quality Check" | tee -a "$REPORT_FILE"
echo ""

log_info "Running linter..."
if npm run lint > /dev/null 2>&1; then
    log_success "Linting passed"
else
    log_error "Linting failed - but continuing..."
fi

# 4. Build
echo ""
echo "### 4. Build Verification" | tee -a "$REPORT_FILE"
echo ""

log_info "Building packages..."
if npm run build:packages > /dev/null 2>&1; then
    log_success "Packages built successfully"
else
    log_error "Package build failed"
    exit 1
fi

# 5. Tests
echo ""
echo "### 5. Test Execution" | tee -a "$REPORT_FILE"
echo ""

log_info "Running tests..."
if npm test -- --passWithNoTests > /dev/null 2>&1; then
    log_success "All tests passed"
else
    log_error "Some tests failed - check logs"
fi

# 6. Docker Check
echo ""
echo "### 6. Docker Verification" | tee -a "$REPORT_FILE"
echo ""

if command -v docker &> /dev/null; then
    log_info "Docker found, checking daemon..."

    if docker ps > /dev/null 2>&1; then
        log_success "Docker daemon is running"

        log_info "Checking if docker-compose is available..."
        if command -v docker-compose &> /dev/null; then
            log_success "docker-compose is available"
        else
            log_info "docker-compose not found, checking docker compose plugin..."
            if docker compose version > /dev/null 2>&1; then
                log_success "docker compose plugin is available"
            else
                log_error "Neither docker-compose nor docker compose plugin found"
            fi
        fi
    else
        log_error "Docker daemon not running"
    fi
else
    log_error "Docker not installed"
fi

# 7. File Verification
echo ""
echo "### 7. New Files Verification" | tee -a "$REPORT_FILE"
echo ""

EXPECTED_FILES=(
    "CONTRIBUTORS.md"
    "SECURITY.md"
    "PRODUCTION_READINESS.md"
    "DEVELOPMENT.md"
    "ROADMAP.md"
    ".github/PULL_REQUEST_TEMPLATE.md"
    ".github/ISSUE_TEMPLATE/bug_report.md"
    ".github/ISSUE_TEMPLATE/feature_request.md"
)

for file in "${EXPECTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "File exists: $file"
    else
        log_error "File missing: $file"
    fi
done

# 8. Documentation Count
echo ""
echo "### 8. Documentation Metrics" | tee -a "$REPORT_FILE"
echo ""

MD_COUNT=$(find . -type f -name "*.md" ! -path "*/node_modules/*" ! -path "*/.next/*" | wc -l | tr -d ' ')
log_info "Total markdown files: $MD_COUNT"

# 9. Git Status
echo ""
echo "### 9. Repository Status" | tee -a "$REPORT_FILE"
echo ""

MODIFIED=$(git status --short | grep "^ M" | wc -l | tr -d ' ')
NEW=$(git status --short | grep "^??" | wc -l | tr -d ' ')

log_info "Modified files: $MODIFIED"
log_info "New files: $NEW"

# Summary
echo ""
echo "=================================================="
echo "Verification Complete!"
echo "=================================================="
echo ""
echo "Report saved to: $REPORT_FILE"
echo ""

# Append summary
cat >> "$REPORT_FILE" << EOF

---

## Summary

- Environment: ✅ OK
- Dependencies: ✅ OK
- Linting: Check manually if needed
- Build: ✅ OK
- Tests: Run individually for detailed results
- Docker: Check if Docker is running
- Documentation: $MD_COUNT files
- Git Changes: $MODIFIED modified, $NEW new

---

## Next Steps

1. Review any failed checks above
2. Run Docker tests if Docker is available
3. Test Stellar integration manually
4. Review generated report

---

**Generated**: $(date)
EOF

echo "To view the report:"
echo "  cat $REPORT_FILE"
echo ""
