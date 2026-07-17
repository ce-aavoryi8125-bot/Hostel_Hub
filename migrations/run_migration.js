/**
 * run_migration.js
 * Runs the 001_init.sql migration against Supabase using the pg driver.
 * Usage: node migrations/run_migration.js
 *
 * Requires: npm install pg --save-dev
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase direct PostgreSQL connection
// Connection string format for Supabase:
//   postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
//
// If you have the DB password, set DATABASE_URL in .env:
//   DATABASE_URL=postgresql://postgres:[password]@db.omztddqbphsrgxghfdac.supabase.co:5432/postgres
//
// Alternatively, Supabase pooler (port 6543) also works:
//   DATABASE_URL=postgresql://postgres.[project_ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in .env');
  console.error('   Add: DATABASE_URL=postgresql://postgres:[password]@db.omztddqbphsrgxghfdac.supabase.co:5432/postgres');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    const sql = fs.readFileSync(path.join(__dirname, '001_init.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Migration 001_init.sql applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
