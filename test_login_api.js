require('dotenv').config();
const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    if (payload) r.write(payload);
    r.end();
  });
}

async function run() {
  console.log('=== Testing /api/login directly ===');
  const loginRes = await req('POST', '/api/login', { email: 'admin@hostelhub.dev', password: 'Admin@HostelHub2024!' });
  console.log('Status:', loginRes.status);
  console.log('Body:', JSON.stringify(loginRes.body).substring(0, 200));

  if (loginRes.status === 200) {
    console.log('\n✅ Login works via API!');
    const AT = loginRes.body.token;
    const statsRes = await req('GET', '/api/admin/stats', null, AT);
    console.log('\n=== Admin Stats ===');
    console.log('Status:', statsRes.status);
    console.log('Body:', JSON.stringify(statsRes.body).substring(0, 300));
  }
}

run();
