/**
 * Drops the legacy FK constraint on hostels.manager_id
 * so Supabase Auth UUIDs can be used as manager IDs.
 *
 * This runs the same SQL that is in supabase/auth_migration.sql
 * but executes it immediately against the live database.
 *
 * Run: node fix_hostels_fk.js
 */
require('dotenv').config();

const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract project ref from URL
// https://omztddqbphsrgxghfdac.supabase.co → omztddqbphsrgxghfdac
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

const SQL = `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'hostels'
      AND constraint_name = 'hostels_manager_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE hostels DROP CONSTRAINT hostels_manager_id_fkey;
    RAISE NOTICE 'Dropped hostels_manager_id_fkey';
  ELSE
    RAISE NOTICE 'Constraint hostels_manager_id_fkey does not exist (already clean)';
  END IF;
END $$;
`;

function callSupabaseSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: `${projectRef}.supabase.co`,
      path: '/rest/v1/rpc/exec_sql',  // This won't work without the RPC function
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Use the Supabase Management API instead
function callManagementAPI(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('Attempting to drop hostels_manager_id_fkey via Management API...');
  const result = await callManagementAPI(SQL);
  console.log('Status:', result.status);
  console.log('Response:', result.body.substring(0, 500));
  
  if (result.status !== 200) {
    console.log('\n⚠️  Management API requires a Supabase access token (not the service role key).');
    console.log('\nTo fix manually, run this SQL in the Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/' + projectRef + '/editor');
    console.log('\n' + SQL);
  }
}

run();
