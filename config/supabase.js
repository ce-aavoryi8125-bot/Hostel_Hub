const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey     = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Service role client — bypasses RLS, used for all backend DB operations
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Anon client — used only for signInWithPassword and signUp
// (respects RLS; safe to use with user credentials)
const supabaseAnon = anonKey
  ? createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : supabase; // fallback to service client if anon key not set

module.exports = supabase;
module.exports.supabaseAnon = supabaseAnon;
module.exports.supabaseUrl  = supabaseUrl;
module.exports.anonKey      = anonKey;
