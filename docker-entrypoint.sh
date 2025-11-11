#!/bin/sh
set -e

echo "🚀 ProofPass Platform - Starting..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until node -e "const { Client } = require('pg'); const client = new Client(process.env.DATABASE_URL); client.connect().then(() => { console.log('✅ PostgreSQL is ready'); client.end(); }).catch(() => process.exit(1));" 2>/dev/null; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
until node -e "const redis = require('redis'); const client = redis.createClient({ url: process.env.REDIS_URL }); client.connect().then(() => { console.log('✅ Redis is ready'); client.quit(); }).catch(() => process.exit(1));" 2>/dev/null; do
  echo "   Redis is unavailable - sleeping"
  sleep 2
done

# Run database migrations
echo "🔄 Running database migrations..."
cd apps/api

# Check if migrations table exists and create if not
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    \`);

    console.log('✅ Migrations table ready');
    await pool.end();
  } catch (error) {
    console.error('❌ Migration table creation failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
"

# Run migration files
for migration in dist/config/migrations/*.sql; do
  if [ -f "\$migration" ]; then
    migration_name=\$(basename "\$migration")
    echo "   Applying \$migration_name..."

    # Check if migration already applied
    node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function applyMigration() {
  try {
    const result = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE migration_name = \$1',
      ['\$migration_name']
    );

    if (result.rows.length > 0) {
      console.log('   ⏭️  Already applied, skipping');
      await pool.end();
      return;
    }

    // Read and execute migration
    const sql = fs.readFileSync('\$migration', 'utf8');
    await pool.query(sql);

    // Record migration
    await pool.query(
      'INSERT INTO schema_migrations (migration_name) VALUES (\$1)',
      ['\$migration_name']
    );

    console.log('   ✅ Applied successfully');
    await pool.end();
  } catch (error) {
    console.error('   ❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

applyMigration();
"
  fi
done

echo "✅ All migrations completed"

# Start the application
echo "🎉 Starting ProofPass API..."
cd /app
exec node apps/api/dist/main.js
