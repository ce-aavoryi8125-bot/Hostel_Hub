const fs   = require('fs');
const path = require('path');
const supabase = require('./supabase');

// Helper: run a Supabase query non-fatally
async function safe(queryPromise) {
  try { await queryPromise; } catch { /* non-fatal */ }
}

// ─────────────────────────────────────────────
// Seed locations from JSON file
// ─────────────────────────────────────────────
async function seedLocations() {
  const { count } = await supabase.from('locations').select('*', { count: 'exact', head: true });
  if (count > 0) return;
  const datasetPath = path.join(__dirname, '..', 'data', 'umat_locations.json');
  const rows = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  const payload = rows.map(row => ({
    name: row.name, category: row.category,
    latitude: Number(row.latitude), longitude: Number(row.longitude),
    students_commonly_live_here: row.students_commonly_live_here || 'Unknown',
    description: row.description || '',
    coordinate_confidence: row.coordinate_confidence || 'Estimated',
    source_note: row.source_note || '',
  }));
  const { error } = await supabase.from('locations').insert(payload);
  if (error) throw error;
  console.log(`✅ Seeded ${payload.length} locations`);
}

// ─────────────────────────────────────────────
// Ensure admin account via Supabase Auth
// ─────────────────────────────────────────────
async function seedAdmin() {
  const adminsToSeed = [
    { email: 'ce-aavoryi8125@st.umat.edu.gh', pass: 'ce-Aavoryi8125', name: 'Albert Avoryi (Super Admin)', isSuper: true },
    { email: 'admin@hostelhub.dev',           pass: 'Admin@HostelHub2024!', name: 'Hostel Hub Administrator', isSuper: true }
  ];

  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const userList = existing?.users || [];

  for (const a of adminsToSeed) {
    const adminUser = userList.find(u => u.email === a.email);
    if (!adminUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: a.email, password: a.pass, email_confirm: true,
        user_metadata: { name: a.name, role: 'admin' },
      });
      if (error) { console.warn('⚠️  Admin seed warn:', error.message); continue; }
      await supabase.auth.admin.updateUserById(data.user.id, { app_metadata: { role: 'admin', status: 'active' } });
      await safe(supabase.from('user_profiles').insert({
        id: data.user.id, email: a.email, name: a.name,
        role: 'admin', status: 'active', is_super_admin: a.isSuper,
        permissions: { manage_hostels: true, manage_managers: true, manage_students: true, manage_bookings: true, manage_tours: true, manage_payments: true, view_analytics: true, system_settings: true }
      }));
      console.log('✅ Admin account ready:', a.email);
    } else {
      if ((adminUser.app_metadata || {}).role !== 'admin') {
        await supabase.auth.admin.updateUserById(adminUser.id, { app_metadata: { role: 'admin', status: 'active' } });
      }
      await safe(supabase.from('user_profiles').upsert({
        id: adminUser.id, email: a.email, name: adminUser.user_metadata?.name || a.name,
        role: 'admin', status: 'active', is_super_admin: a.isSuper,
        permissions: { manage_hostels: true, manage_managers: true, manage_students: true, manage_bookings: true, manage_tours: true, manage_payments: true, view_analytics: true, system_settings: true }
      }));
    }
  }
}

// ─────────────────────────────────────────────
// Seed demo manager
// ─────────────────────────────────────────────
async function seedDemoManager() {
  const MGR_EMAIL = 'manager@hostelhub.dev';
  const MGR_PASS  = 'Manager@Hub2024!';

  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const mgrUser = (existing?.users || []).find(u => u.email === MGR_EMAIL);

  if (!mgrUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: MGR_EMAIL, password: MGR_PASS, email_confirm: true,
      user_metadata: { name: 'Demo Manager', role: 'manager' },
    });
    if (error) { console.warn('⚠️  Manager seed warn:', error.message); return; }
    await supabase.auth.admin.updateUserById(data.user.id, { app_metadata: { role: 'manager', status: 'active' } });
    await safe(supabase.from('user_profiles').insert({ id: data.user.id, email: MGR_EMAIL, name: 'Demo Manager', role: 'manager', status: 'active', phone: '+233 24 111 2222' }));
    await safe(supabase.from('manager_profiles').insert({ id: data.user.id, phone: '+233 24 111 2222', is_verified: true, bank_name: 'Ghana Commercial Bank', account_name: 'Demo Manager Hostel Ventures', account_number: '1029384756' }));
    await safe(supabase.from('hostels').update({ manager_id: data.user.id, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: MGR_EMAIL }).in('name', ['Tarkwa Hostel Haven', 'University Vista Lodge']));
    console.log('✅ Demo manager created:', MGR_EMAIL, '/', MGR_PASS);
  } else {
    await supabase.auth.admin.updateUserById(mgrUser.id, { app_metadata: { role: 'manager', status: 'active' } });
    await safe(supabase.from('user_profiles').upsert({ id: mgrUser.id, email: MGR_EMAIL, name: mgrUser.user_metadata?.name || 'Demo Manager', role: 'manager', status: 'active' }));
    await safe(supabase.from('manager_profiles').upsert({ id: mgrUser.id, phone: '+233 24 111 2222', is_verified: true }));
    await safe(supabase.from('hostels').update({ manager_id: mgrUser.id, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: MGR_EMAIL }).in('name', ['Tarkwa Hostel Haven', 'University Vista Lodge']));
  }
}

// ─────────────────────────────────────────────
// Seed sample hostels (only if table empty)
// ─────────────────────────────────────────────
async function seedHostels() {
  const { count: hostelCount } = await supabase.from('hostels').select('*', { count: 'exact', head: true });
  if (hostelCount > 0) return;

  const { data: mgrProfile } = await supabase.from('user_profiles').select('id, name, phone, email').eq('email', 'manager@hostelhub.dev').maybeSingle();
  const mId = mgrProfile?.id || null;
  const mName  = mgrProfile?.name  || 'Demo Manager';
  const mPhone = mgrProfile?.phone || '+233 24 111 2222';
  const mEmail = 'manager@hostelhub.dev';

  const { data: campusLoc } = await supabase.from('locations').select('id').eq('name', 'UMaT Main Gate / Campus').maybeSingle();
  const { data: townLoc }   = await supabase.from('locations').select('id').eq('name', 'Tarkwa (town centre)').maybeSingle();

  const { data: inserted } = await supabase.from('hostels').insert([
    {
      name: 'Tarkwa Hostel Haven', location_id: campusLoc?.id || null,
      location: 'UMaT Main Gate / Campus', address: 'Near UMaT Gate',
      price_per_year: 4500, rating: 4.8,
      maps_url: 'https://maps.google.com/?q=Tarkwa+UMaT+Hostel',
      facilities: ['Wi-Fi', 'Power backup', 'Water', 'Security'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Popular hostel near the university for students who want safe, clean accommodation.',
      photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 9000, gallery: [] }, '2-in-a-room': { price: 7000, gallery: [] }, '3-in-a-room': { price: 5500, gallery: [] }, '4-in-a-room': { price: 4500, gallery: [] } },
      verification_status: 'verified', is_published: true, visits: 0,
    },
    {
      name: 'University Vista Lodge', location_id: townLoc?.id || null,
      location: 'Tarkwa (town centre)', address: 'Opposite UMaT East Gate',
      price_per_year: 5000, rating: 4.6,
      maps_url: 'https://maps.google.com/?q=University+Vista+Lodge+Tarkwa',
      facilities: ['Laundry', 'Study hall', 'Water', 'Wi-Fi'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'A student-friendly lodge with roomy shared spaces and easy access to campus transport.',
      photos: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 8000, gallery: [] }, '4-in-a-room': { price: 5000, gallery: [] } },
      verification_status: 'verified', is_published: true, visits: 0,
    }
  ]).select('id, name');

  if (inserted?.[0] && mId) {
    await safe(supabase.from('transactions').insert([
      { manager_id: mId, hostel_id: inserted[0].id, hostel_name: 'Tarkwa Hostel Haven', type: 'income', amount: 4500, category: 'Rent Payment', description: '4-in-a-room rent — demo data' },
      { manager_id: mId, hostel_id: inserted[0].id, hostel_name: 'Tarkwa Hostel Haven', type: 'expense', amount: 120, category: 'Electricity', description: 'ECG prepaid credit' },
    ]));
  }
  console.log('✅ Sample hostels seeded');
}

// ─────────────────────────────────────────────
// Apply data migrations
// ─────────────────────────────────────────────
async function runMigration() {
  try {
    await supabase.from('hostels')
      .update({ verification_status: 'verified', is_published: true, verified_at: new Date().toISOString() })
      .in('name', ['Tarkwa Hostel Haven', 'University Vista Lodge'])
      .is('verification_status', null);
    console.log('✅ Data migrations applied');
  } catch (e) {
    console.warn('⚠️  Migration note:', e.message);
  }
}

// ─────────────────────────────────────────────
// Connect & seed
// ─────────────────────────────────────────────
const connectDB = async () => {
  try {
    const { error } = await supabase.from('locations').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Connected to Supabase');
    await runMigration();
    await seedLocations();
    await seedAdmin();
    await seedDemoManager();
    await seedHostels();
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
