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

async function fixRoleColumn() {
  const client = await pool.connect();

  try {
    console.log('\n🔧 Fixing role column conflict...\n');

    // Check if 'role' column exists
    const checkRole = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role';
    `);

    if (checkRole.rows.length > 0) {
      console.log('→ Found existing "role" column, renaming to "org_role"');

      // Drop the check constraint first (it might have a generated name)
      const constraints = await client.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'users' AND constraint_type = 'CHECK';
      `);

      for (const row of constraints.rows) {
        try {
          await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS ${row.constraint_name};`);
          console.log(`  Dropped constraint: ${row.constraint_name}`);
        } catch (err) {
          // Ignore errors, some constraints might be needed
        }
      }

      // Rename the column
      await client.query(`ALTER TABLE users RENAME COLUMN role TO org_role;`);
      console.log('✅ Column renamed: role -> org_role\n');

      // Add the constraint back
      await client.query(`
        ALTER TABLE users ADD CONSTRAINT check_org_role
        CHECK (org_role IN ('owner', 'admin', 'member'));
      `);
      console.log('✅ Added check constraint for org_role\n');

      // Update migration 003 record to mark it as needing re-execution
      await client.query(`DELETE FROM schema_migrations WHERE migration_name = '003_create_saas_tables.sql';`);
      console.log('✅ Reset migration 003 status\n');

    } else {
      console.log('⊘ No "role" column found, nothing to fix\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixRoleColumn();
