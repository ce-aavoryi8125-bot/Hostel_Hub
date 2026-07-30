require('dotenv').config();
const supabase = require('./config/supabase');
const { supabaseAnon } = require('./config/supabase');
const http = require('http');

async function test() {
  const ADMIN_EMAIL   = 'admin@hostelhub.dev';
  const ADMIN_PASS    = 'Admin@HostelHub2024!';

  // Login
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASS
  });
  if (error) {
    console.error('Login error:', error);
    return;
  }
  const token = data.session.access_token;
  console.log('Token acquired. Fetching stats...');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        console.log('Stats Response:', JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.error('Error parsing response:', e.message);
        console.log('Raw response:', rawData);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  req.end();
}

test();
