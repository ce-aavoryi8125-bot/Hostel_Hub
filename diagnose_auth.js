require('dotenv').config();
const { supabaseAnon } = require('./config/supabase');
const http = require('http');

function apiGet(path) {
  return new Promise((resolve) => {
    const r = http.request({ hostname: 'localhost', port: 3000, path, method: 'GET' }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', e => resolve({ status: 0, error: e.message }));
    r.end();
  });
}

async function run() {
  console.log('--- Health Check ---');
  const h = await apiGet('/api/health');
  console.log('Health:', h.status, h.body);

  console.log('\n--- Testing Admin Login (supabaseAnon) ---');
  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: 'admin@hostelhub.dev',
      password: 'Admin@HostelHub2024!'
    });
    if (error) {
      console.log('Login error code:', error.status);
      console.log('Login error message:', error.message);
    } else {
      console.log('Login success! Token:', data.session?.access_token?.substring(0, 30) + '...');
    }
  } catch (e) {
    console.log('THROWN error:', e.message);
    console.log('Cause:', e.cause?.message || e.cause);
  }
}

run();
