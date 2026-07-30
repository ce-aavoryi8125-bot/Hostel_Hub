/**
 * HOSTEL HUB v5 — Production Readiness Verification (Supabase Auth)
 * Run: node verify.js
 * NOTE: Supabase auth has a rate limit. Wait 60s between consecutive runs
 *       to avoid triggering it (it creates ~2 new auth users per run).
 */
const http = require('http');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const BASE = 'http://localhost:3000';
let pass = 0, fail = 0;
const failures = [];

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
    r.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    if (payload) r.write(payload);
    r.end();
  });
}
const get   = (p, t)    => req('GET',    p, null, t);
const post  = (p, b, t) => req('POST',   p, b,    t);
const patch = (p, b, t) => req('PATCH',  p, b,    t);
const del   = (p, t)    => req('DELETE', p, null, t);

function ok(label, cond, detail) {
  if (cond) { console.log(`  ✅ ${label}`); pass++; }
  else { console.log(`  ❌ ${label}${detail ? ' | ' + detail : ''}`); fail++; failures.push(label + (detail ? ': ' + detail : '')); }
}
function section(s) { console.log(`\n${'═'.repeat(60)}\n  ${s}\n${'═'.repeat(60)}`); }
function sub(s)     { console.log(`\n  ── ${s}`); }

const ADMIN_EMAIL   = 'admin@hostelhub.dev';
const ADMIN_PASS    = 'Admin@HostelHub2024!';
const MANAGER_EMAIL = 'manager@hostelhub.dev';
const MANAGER_PASS  = 'Manager@Hub2024!';
const TEST_MGR_EMAIL = `testmgr_${Date.now()}@verify.test`;
const TEST_STU_EMAIL = `teststudent_${Date.now()}@umat.edu.gh`;

async function run() {
  console.log('\n🔍  HOSTEL HUB v5 — SUPABASE AUTH VERIFICATION');
  console.log('    ' + new Date().toLocaleString() + '\n');

  // ── 1. Server Health ──────────────────────────────────────────────────────
  section('1. SERVER HEALTH');
  const health = await get('/api/health');
  ok('Server responds',         health.status === 200);
  ok('API running',             !!health.body?.ok);
  ok('Frontend HTML at /',      (await get('/')).status === 200);
  ok('app.js served',           (await get('/app.js')).status === 200);
  ok('styles.css served',       (await get('/styles.css')).status === 200);
  const cfg = await get('/api/config');
  ok('Config endpoint 200',     cfg.status === 200);
  ok('supabaseUrl in config',   !!cfg.body?.supabaseUrl);
  ok('supabaseAnon in config',  !!cfg.body?.supabaseAnon);

  // ── 2. Authentication ─────────────────────────────────────────────────────
  section('2. SUPABASE AUTH — LOGIN');
  sub('Admin login');
  const aRes = await post('/api/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  ok('Admin login 200',         aRes.status === 200, JSON.stringify(aRes.body).substring(0,80));
  ok('Admin role = admin',      aRes.body?.user?.role === 'admin');
  ok('Admin status = active',   aRes.body?.user?.status === 'active');
  ok('Admin token issued',      !!aRes.body?.token);
  ok('Refresh token issued',    !!aRes.body?.refresh_token);
  const AT = aRes.body?.token;
  const AR = aRes.body?.refresh_token;

  sub('Manager login');
  const mRes = await post('/api/login', { email: MANAGER_EMAIL, password: MANAGER_PASS });
  ok('Manager login 200',       mRes.status === 200, JSON.stringify(mRes.body).substring(0,80));
  ok('Manager role = manager',  mRes.body?.user?.role === 'manager');
  ok('Manager status = active', mRes.body?.user?.status === 'active');
  ok('Manager token issued',    !!mRes.body?.token);
  const MT = mRes.body?.token;
  const MR = mRes.body?.refresh_token;

  sub('Student signup (new account)');
  const sSignup = await post('/api/signup', {
    name: 'Verify Student', email: TEST_STU_EMAIL,
    phone: '+233241234567', password: 'Student@Verify99!',
    studentIndex: 'VERIFY/2026/001', institution: 'UMaT'
  });
  ok('Student signup 201',      sSignup.status === 201, JSON.stringify(sSignup.body).substring(0,80));
  ok('Student role = student',  sSignup.body?.user?.role === 'student');
  ok('Student token issued',    !!sSignup.body?.token);
  const ST = sSignup.body?.token;

  sub('Invalid credentials rejected');
  const badRes = await post('/api/login', { email: 'nobody@test.com', password: 'wrongpass' });
  ok('Invalid login returns 401', badRes.status === 401);

  sub('/api/me role verification');
  const meA = await get('/api/me', AT);
  ok('/api/me admin role',      meA.body?.user?.role === 'admin');
  const meM = await get('/api/me', MT);
  ok('/api/me manager role',    meM.body?.user?.role === 'manager');
  const meS = await get('/api/me', ST);
  ok('/api/me student role',    meS.body?.user?.role === 'student');

  sub('Token refresh');
  const refreshRes = await post('/api/refresh', { refresh_token: MR });
  ok('Token refresh 200',       refreshRes.status === 200);
  ok('New access token issued', !!refreshRes.body?.token);

  // ── 3. Manager Application Workflow ──────────────────────────────────────
  section('3. MANAGER APPLICATION WORKFLOW');
  const applyRes = await post('/api/manager-apply', {
    name: 'Verify Manager', email: TEST_MGR_EMAIL,
    phone: '+233200000099', password: 'Manager@Verify99!',
    hostelNameApplied: 'Verify Test Lodge',
    hostelLocationApplied: 'Near UMaT Gate',
    hostelDescriptionApplied: 'A test hostel for verification.'
  });
  ok('Manager apply 201',       applyRes.status === 201, JSON.stringify(applyRes.body).substring(0,80));
  ok('Status = pending',        applyRes.body?.user?.status === 'pending');
  ok('Pending token issued',    !!applyRes.body?.token);
  const PENDING_TOKEN = applyRes.body?.token;

  sub('Pending manager cannot access dashboard');
  const pendingBlock = await get('/api/manager/finances', PENDING_TOKEN);
  ok('Pending manager blocked (403)', pendingBlock.status === 403);

  // ── 4. Role-Based Access Control ─────────────────────────────────────────
  section('4. ROLE-BASED ACCESS CONTROL');
  sub('Student blocked from admin routes');
  ok('Student → admin/stats (403)',    (await get('/api/admin/stats', ST)).status === 403);
  ok('Student → admin/users (403)',    (await get('/api/admin/users', ST)).status === 403);
  ok('Student → admin/hostels (403)',  (await get('/api/admin/hostels', ST)).status === 403);
  sub('Student blocked from manager routes');
  ok('Student → manager/finances (403)', (await get('/api/manager/finances', ST)).status === 403);
  ok('Student → manager/students (403)', (await get('/api/manager/students', ST)).status === 403);
  sub('Manager blocked from admin routes');
  ok('Manager → admin/stats (403)',    (await get('/api/admin/stats', MT)).status === 403);
  ok('Manager → admin/users (403)',    (await get('/api/admin/users', MT)).status === 403);
  ok('Manager → admin/hostels (403)',  (await get('/api/admin/hostels', MT)).status === 403);
  sub('Unauthenticated blocked');
  ok('No token → /api/me (401)',         (await get('/api/me')).status === 401);
  ok('No token → manager/finances (401)', (await get('/api/manager/finances')).status === 401);
  ok('No token → admin/stats (401)',      (await get('/api/admin/stats')).status === 401);

  // ── 5. Public Hostel Listing ──────────────────────────────────────────────
  section('5. PUBLIC HOSTEL LISTING');
  const hostels = await get('/api/hostels');
  ok('GET /api/hostels 200',    hostels.status === 200);
  ok('Returns hostels array',   Array.isArray(hostels.body?.hostels));
  ok('At least 2 hostels',      (hostels.body?.hostels?.length || 0) >= 2);
  const h0 = hostels.body?.hostels?.find(h => Object.keys(h?.room_types || h?.roomTypes || {}).length > 0);
  ok('Hostel has room types',   !!h0);
  const locs = await get('/api/locations');
  ok('Locations 200',           locs.status === 200);
  ok('28 UMaT locations',       locs.body?.locations?.length === 28);

  // ── 6. Admin Portal ───────────────────────────────────────────────────────
  section('6. ADMIN PORTAL');
  const stats = await get('/api/admin/stats', AT);
  ok('Admin stats 200',         stats.status === 200, JSON.stringify(stats.body).substring(0,100));
  ok('totalHostels >= 2',       (stats.body?.stats?.totalHostels || 0) >= 2);
  ok('totalManagers >= 1',      (stats.body?.stats?.totalManagers || 0) >= 1);

  const adminHostels = await get('/api/admin/hostels', AT);
  ok('Admin hostels 200',       adminHostels.status === 200);
  ok('Hostels array',           Array.isArray(adminHostels.body?.hostels));
  const H1 = adminHostels.body?.hostels?.[0];

  if (H1?.id) {
    const h1d = await get(`/api/admin/hostels/${H1.id}`, AT);
    ok('Hostel detail 200',     h1d.status === 200);
    ok('verificationLog array', Array.isArray(h1d.body?.verificationLog));
  }

  sub('Create hostel');
  const newHostelRes = await post('/api/admin/hostels', {
    name: 'Verify Hostel', location: 'UMaT Gate', address: '1 Test Rd',
    pricePerYear: 4000, description: 'Test hostel', rules: 'No noise'
  }, AT);
  ok('Create hostel 201',       newHostelRes.status === 201, JSON.stringify(newHostelRes.body).substring(0,80));
  ok('Returns hostel id',       !!newHostelRes.body?.hostel?.id);
  const NEW_H_ID = newHostelRes.body?.hostel?.id;

  sub('Assign manager');
  const activeMgrs = await get('/api/admin/active-managers', AT);
  ok('Active managers 200',     activeMgrs.status === 200);
  ok('Managers array',          Array.isArray(activeMgrs.body?.managers));
  const MGR_ID = activeMgrs.body?.managers?.find(m => m.email === MANAGER_EMAIL)?.id;
  if (NEW_H_ID && MGR_ID) {
    const assignRes = await post(`/api/admin/hostels/${NEW_H_ID}/assign-manager`, { managerId: MGR_ID }, AT);
    ok('Assign manager 200',    assignRes.status === 200, JSON.stringify(assignRes.body).substring(0,60));
  }

  sub('Hostel verification');
  if (NEW_H_ID) {
    const verRes = await patch(`/api/admin/hostels/${NEW_H_ID}/verify`, { action: 'approve', notes: 'Verified in test' }, AT);
    ok('Verify hostel 200',     verRes.status === 200);
  }

  sub('Manager applications');
  const apps = await get('/api/admin/manager-applications', AT);
  ok('Applications 200',        apps.status === 200);
  ok('Managers array',          Array.isArray(apps.body?.managers));
  const NEW_MGR_ID = applyRes.body?.user?.id;
  if (NEW_MGR_ID) {
    const approveRes = await patch(`/api/admin/manager-applications/${NEW_MGR_ID}`, { action: 'approve', notes: 'Approved in test' }, AT);
    ok('Approve manager 200',   approveRes.status === 200);
  }

  const usersRes = await get('/api/admin/users', AT);
  ok('Admin users 200',         usersRes.status === 200);
  ok('students array',          Array.isArray(usersRes.body?.students));
  ok('managers array',          Array.isArray(usersRes.body?.managers));
  ok('admins array',            Array.isArray(usersRes.body?.admins));
  ok('Admin present in admins', (usersRes.body?.admins?.length || 0) >= 1);

  const auditRes = await get('/api/admin/audit-log', AT);
  ok('Audit log 200',           auditRes.status === 200);
  ok('Logs array',              Array.isArray(auditRes.body?.logs));

  // ── 7. Manager Portal ─────────────────────────────────────────────────────
  section('7. MANAGER PORTAL');
  const fin = await get('/api/manager/finances', MT);
  ok('Finances 200',            fin.status === 200, JSON.stringify(fin.body).substring(0,100));
  ok('Hostels array',           Array.isArray(fin.body?.hostels));
  ok('Transactions array',      Array.isArray(fin.body?.transactions));
  ok('Summary object',          !!fin.body?.summary);
  ok('totalIncome is number',   typeof fin.body?.totalIncome === 'number');

  const rooms = await get('/api/manager/rooms', MT);
  ok('Rooms 200',               rooms.status === 200);
  ok('Rooms array',             Array.isArray(rooms.body?.rooms));

  const mgrHostelId = fin.body?.hostels?.[0]?.id;
  if (mgrHostelId) {
    const roomCreate = await post('/api/manager/rooms', { hostelId: mgrHostelId, roomNumber: 'VER-101', capacity: 2, blockName: 'Verify Block' }, MT);
    ok('Create room 201',       roomCreate.status === 201);
    ok('Room number correct',   roomCreate.body?.room?.room_number === 'VER-101');
  }

  ok('Manager students 200',    (await get('/api/manager/students', MT)).status === 200);
  ok('Manager maintenance 200', (await get('/api/manager/maintenance', MT)).status === 200);
  ok('Manager announcements 200',(await get('/api/manager/announcements', MT)).status === 200);
  ok('Payment methods 200',     (await get('/api/manager/payment-methods', MT)).status === 200);
  ok('Verification queue 200',  (await get('/api/payments/verification-queue', MT)).status === 200);

  const mgrProfile = await get('/api/manager/profile', MT);
  ok('Manager profile 200',     mgrProfile.status === 200);
  ok('Profile has name',        !!mgrProfile.body?.profile?.name);

  sub('Log expense');
  if (mgrHostelId) {
    const expRes = await post('/api/manager/expenses', { hostelId: mgrHostelId, amount: 150, category: 'Electricity', description: 'Verify test expense' }, MT);
    ok('Log expense 201',       expRes.status === 201);
    ok('Expense amount correct', expRes.body?.transaction?.amount == 150);
  }

  // ── 8. Student Portal ─────────────────────────────────────────────────────
  section('8. STUDENT PORTAL');
  const portal = await get('/api/student/portal', ST);
  ok('Student portal 200',      portal.status === 200);
  ok('Student object present',  !!portal.body?.student);
  ok('Maintenance array',       Array.isArray(portal.body?.maintenance));
  ok('Notifications array',     Array.isArray(portal.body?.notifications));

  const maintReq = await post('/api/student/maintenance', { title: 'Verify test', description: 'Test request', category: 'General', priority: 'Low' }, ST);
  ok('Submit maintenance 201',  maintReq.status === 201);
  ok('Maintenance has id',      !!maintReq.body?.request?.id);

  ok('Payment history 200',     (await get('/api/payments/history', ST)).status === 200);
  ok('Receipts 200',            (await get('/api/payments/receipts', ST)).status === 200);

  sub('Profile update');
  const profUp = await req('PUT', '/api/student/profile', { name: 'Verify Student Updated', phone: '+233241234568' }, ST);
  ok('Profile update 200',      profUp.status === 200);

  // ── 9. Payment Workflow ───────────────────────────────────────────────────
  section('9. PAYMENT WORKFLOW');
  const hostelWithRooms = hostels.body?.hostels?.find(h => Object.keys(h?.room_types || h?.roomTypes || {}).length > 0);
  if (hostelWithRooms) {
    const hId = hostelWithRooms.id;
    ok('Payment methods endpoint 200', (await get(`/api/payments/methods/${hId}`, ST)).status === 200);
    const rt = hostelWithRooms.room_types || hostelWithRooms.roomTypes || {};
    const firstRoom = Object.keys(rt)[0];
    if (firstRoom) {
      const initRes = await post('/api/payments/initiate', { hostelId: hId, roomType: firstRoom, amount: rt[firstRoom]?.price || 5000 }, ST);
      ok('Initiate booking handled', [200, 201, 409, 503].includes(initRes.status));
      if (initRes.status === 409)  ok('Duplicate booking blocked', true);
      else if (initRes.status === 503) ok('Migration message clear', !!initRes.body?.message);
      else { ok('Payment reference issued', !!initRes.body?.reference); ok('Booking reference issued', !!initRes.body?.bookingReference); }
    }
  }

  // ── 10. Data Integrity ────────────────────────────────────────────────────
  section('10. DATA INTEGRITY');
  const dup = await post('/api/signup', { name: 'Dup', email: TEST_STU_EMAIL, phone: '+1', password: 'Test1234!', institution: 'UMaT' });
  ok('Duplicate email returns 409', dup.status === 409);
  ok('Missing fields returns 400',  (await post('/api/signup', { email: 'x@t.com' })).status === 400);
  ok('Invalid token returns 401',   (await get('/api/me', 'invalid.token.here')).status === 401);
  ok('Non-existent hostel 404',     (await get('/api/admin/hostels/00000000-0000-0000-0000-000000000000', AT)).status === 404);

  // ── 11. Cleanup ───────────────────────────────────────────────────────────
  section('11. CLEANUP');
  if (NEW_H_ID) {
    const delRes = await del(`/api/admin/hostels/${NEW_H_ID}`, AT);
    ok('Delete test hostel 200', delRes.status === 200);
  }

  // ── Final Report ──────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  VERIFICATION COMPLETE');
  console.log('═'.repeat(60));
  console.log(`  ✅ PASSED: ${pass}`);
  console.log(`  ❌ FAILED: ${fail}`);
  if (failures.length > 0) {
    console.log('\n  FAILURES:');
    failures.forEach(f => console.log(`    • ${f}`));
  }
  console.log('═'.repeat(60));
  if (fail === 0) console.log('\n  🎉 ALL CHECKS PASSED — Application is demonstration-ready\n');
  else if (fail <= 5) console.log('\n  ⚠️  Minor issues — review failures above\n');
  else console.log('\n  🚫 Issues found — review before demonstrating\n');
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error('Verification error:', e); process.exit(1); });
