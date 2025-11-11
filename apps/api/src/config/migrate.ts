import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './database';

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Running database migrations...');

    // Create migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const executedResult = await client.query('SELECT name FROM migrations');
    const executedMigrations = new Set(executedResult.rows.map(row => row.name));

    // Migration files in order
    const migrations = [
      '001_initial_schema.sql',
      '002_seed_templates.sql',
      '003_create_saas_tables.sql',
    ];

    for (const migration of migrations) {
      if (executedMigrations.has(migration)) {
        console.log(`⏭️  Skipping ${migration} (already executed)`);
        continue;
      }

      console.log(`▶️  Running ${migration}...`);

      const migrationPath = join(__dirname, 'migrations', migration);
      const sql = readFileSync(migrationPath, 'utf-8');

      await client.query(sql);
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration]);

      console.log(`✅ Completed ${migration}`);
    }

    console.log('✨ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error(err);
  process.exit(1);
});
