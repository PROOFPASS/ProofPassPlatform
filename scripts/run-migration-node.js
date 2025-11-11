#!/usr/bin/env node

/**
 * Node.js-based Migration Runner
 * Runs database migrations using pg library instead of psql
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

const MIGRATION_FILE = '004_add_user_roles_and_dids.sql';
const MIGRATION_PATH = path.join(__dirname, '../apps/api/src/config/migrations', MIGRATION_FILE);

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log(`\n📊 Connecting to database: ${process.env.DATABASE_NAME}...`);

    // Test connection
    await client.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Create migrations table if it doesn't exist
    console.log('Checking migrations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migrations table ready\n');

    // Check if migration already executed
    const { rows } = await client.query(
      'SELECT COUNT(*) as count FROM schema_migrations WHERE migration_name = $1',
      [MIGRATION_FILE]
    );

    if (parseInt(rows[0].count) > 0) {
      console.log(`⊘ Migration ${MIGRATION_FILE} already executed\n`);
      return;
    }

    // Read migration file
    console.log(`→ Executing migration: ${MIGRATION_FILE}`);
    const migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf8');

    // Execute migration in a transaction
    await client.query('BEGIN');

    try {
      await client.query(migrationSQL);
      await client.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
        [MIGRATION_FILE]
      );
      await client.query('COMMIT');

      console.log(`✅ Migration ${MIGRATION_FILE} completed successfully\n`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
