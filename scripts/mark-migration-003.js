#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

async function markMigration() {
  const client = await pool.connect();

  try {
    console.log('\n📝 Marking migration 003 as executed...\n');

    await client.query(`
      INSERT INTO schema_migrations (migration_name, executed_at)
      VALUES ('003_create_saas_tables.sql', NOW())
      ON CONFLICT (migration_name) DO NOTHING;
    `);

    console.log('✅ Migration 003 marked as executed\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

markMigration();
