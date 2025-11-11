#!/usr/bin/env node

/**
 * Database Creation Script
 * Creates the proofpass_dev database if it doesn't exist
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

async function createDatabase() {
  // Connect to the default 'postgres' database to create our database
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 5432,
    database: 'postgres', // Connect to default database first
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD || '',
  });

  try {
    await client.connect();
    console.log(`\n📊 Connected to PostgreSQL server...\n`);

    // Check if database exists
    const dbName = process.env.DATABASE_NAME;
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (result.rows.length > 0) {
      console.log(`⊘ Database "${dbName}" already exists\n`);
    } else {
      // Create the database
      console.log(`→ Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created successfully\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
