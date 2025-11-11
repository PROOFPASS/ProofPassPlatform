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

async function checkMigrations() {
  const client = await pool.connect();

  try {
    console.log('\n📊 Checking migration status...\n');

    // Check if migrations table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'schema_migrations'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('⊘ No migrations table found (this is OK for first run)\n');
      return;
    }

    // Get executed migrations
    const result = await client.query(`
      SELECT migration_name, executed_at
      FROM schema_migrations
      ORDER BY executed_at;
    `);

    if (result.rows.length === 0) {
      console.log('⊘ No migrations executed yet\n');
    } else {
      console.log(`✅ Executed migrations (${result.rows.length}):\n`);
      result.rows.forEach(row => {
        console.log(`  - ${row.migration_name} (${row.executed_at})`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkMigrations();
