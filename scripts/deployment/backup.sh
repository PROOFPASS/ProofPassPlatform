#!/bin/bash

# ProofPass Database Backup Script
# Run this script regularly (e.g., via cron) to backup your database

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="proofpass-db"

# Load environment
if [ -f .env.production ]; then
    source .env.production
fi

POSTGRES_USER=${POSTGRES_USER:-proofpass}
POSTGRES_DB=${POSTGRES_DB:-proofpass}

echo "🔄 Starting backup..."
echo "📅 Timestamp: $TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
BACKUP_FILE="$BACKUP_DIR/proofpass_db_$TIMESTAMP.sql.gz"

echo "📦 Backing up PostgreSQL database..."
docker exec $CONTAINER_NAME pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > $BACKUP_FILE

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"
else
    echo "❌ Backup failed"
    exit 1
fi

# Keep only last 30 days of backups
echo "🧹 Cleaning old backups (keeping last 30 days)..."
find $BACKUP_DIR -name "proofpass_db_*.sql.gz" -type f -mtime +30 -delete

echo "✨ Backup process completed!"
echo ""
echo "📝 To restore from backup:"
echo "gunzip -c $BACKUP_FILE | docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER $POSTGRES_DB"
