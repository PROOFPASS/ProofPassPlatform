#!/bin/bash
set -e

# Database Migration Runner for ProofPass Platform
# Executes SQL migration files in order

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}ProofPass Platform - Database Migration Runner${NC}"
echo ""

# Check if .env exists
if [ ! -f "apps/api/.env" ]; then
  echo -e "${RED}Error: apps/api/.env file not found${NC}"
  echo "Please create it from apps/api/.env.example and configure your database connection"
  exit 1
fi

# Load environment variables
source apps/api/.env

# Build database connection string
DB_URL="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"

# Migration directory
MIGRATION_DIR="apps/api/src/config/migrations"

echo -e "${YELLOW}Database: ${DATABASE_NAME}${NC}"
echo -e "${YELLOW}Host: ${DATABASE_HOST}:${DATABASE_PORT}${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo -e "${RED}Error: psql command not found${NC}"
  echo "Please install PostgreSQL client tools"
  exit 1
fi

# Test database connection
echo "Testing database connection..."
if ! psql "$DB_URL" -c "SELECT 1" &> /dev/null; then
  echo -e "${RED}Error: Cannot connect to database${NC}"
  echo "Please check your database configuration in apps/api/.env"
  exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Create migrations table if it doesn't exist
echo "Checking migrations table..."
psql "$DB_URL" <<EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
EOF
echo -e "${GREEN}✓ Migrations table ready${NC}"
echo ""

# Get list of migration files
migration_files=($(ls -1 $MIGRATION_DIR/*.sql | sort))

if [ ${#migration_files[@]} -eq 0 ]; then
  echo -e "${YELLOW}No migration files found in $MIGRATION_DIR${NC}"
  exit 0
fi

echo "Found ${#migration_files[@]} migration file(s)"
echo ""

# Execute each migration
executed_count=0
skipped_count=0

for migration_file in "${migration_files[@]}"; do
  migration_name=$(basename "$migration_file")

  # Check if migration already executed
  already_executed=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$migration_name'")

  if [ "$already_executed" -gt 0 ]; then
    echo -e "${YELLOW}⊘ Skipping: $migration_name (already executed)${NC}"
    ((skipped_count++))
    continue
  fi

  echo -e "${YELLOW}→ Executing: $migration_name${NC}"

  # Execute migration in a transaction
  if psql "$DB_URL" <<EOF
BEGIN;
\i $migration_file
INSERT INTO schema_migrations (migration_name) VALUES ('$migration_name');
COMMIT;
EOF
  then
    echo -e "${GREEN}✓ Success: $migration_name${NC}"
    ((executed_count++))
  else
    echo -e "${RED}✗ Failed: $migration_name${NC}"
    echo "Migration rolled back"
    exit 1
  fi

  echo ""
done

echo ""
echo -e "${GREEN}=== Migration Summary ===${NC}"
echo -e "Executed: ${executed_count}"
echo -e "Skipped: ${skipped_count}"
echo -e "Total: ${#migration_files[@]}"
echo ""
echo -e "${GREEN}✓ All migrations completed successfully${NC}"
