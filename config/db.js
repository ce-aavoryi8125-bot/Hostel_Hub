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
  const { data: existingHostels } = await supabase.from('hostels').select('id, name');
  if (existingHostels && existingHostels.length >= 22) return;

  const { data: mgrProfile } = await supabase.from('user_profiles').select('id, name, phone, email').eq('email', 'manager@hostelhub.dev').maybeSingle();
  const mId = mgrProfile?.id || null;
  const mName  = mgrProfile?.name  || 'Demo Manager';
  const mPhone = mgrProfile?.phone || '+233 24 111 2222';
  const mEmail = 'manager@hostelhub.dev';

  const ghanaHostels = [
    {
      name: 'Banso Royal Student Lodge',
      location: 'Banso (Main Gate), Tarkwa', address: 'Plot 12, UMaT Main Road, Banso, Tarkwa',
      price_per_year: 4500, rating: 4.8, reviews_count: 38, distance_km: 0.5,
      maps_url: 'https://maps.google.com/?q=Banso+Royal+Lodge+Tarkwa',
      facilities: ['Wi-Fi', 'Generator', 'Water', 'Security', 'Study Room', 'Kitchen'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Premier student accommodation situated right near the UMaT Tarkwa main gate with 24/7 security & standby generator.',
      photos: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 8500 }, '2-in-a-room': { price: 6500 }, '4-in-a-room': { price: 4500 } },
      verification_status: 'verified', is_published: true, visits: 124,
    },
    {
      name: 'Ayensu Plaza Hostel',
      location: 'Ayensu / East Gate, Tarkwa', address: 'Opposite UMaT East Gate, Ayensu, Tarkwa',
      price_per_year: 5200, rating: 4.7, reviews_count: 29, distance_km: 0.8,
      maps_url: 'https://maps.google.com/?q=Ayensu+Plaza+Hostel+Tarkwa',
      facilities: ['Wi-Fi', 'Water', 'Security', 'Common Room', 'AC', 'CCTV'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Modern multi-story student hostel near UMaT lecture halls with serene study ambiance and private room balconies.',
      photos: ['https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 9200 }, '2-in-a-room': { price: 7000 }, '3-in-a-room': { price: 5200 } },
      verification_status: 'verified', is_published: true, visits: 98,
    },
    {
      name: 'Gaza Student Hall (Mines Section)',
      location: 'Akoon (Mines), Tarkwa', address: 'Mines Road, Akoon, Tarkwa',
      price_per_year: 3800, rating: 4.6, reviews_count: 42, distance_km: 1.5,
      maps_url: 'https://maps.google.com/?q=Gaza+Hall+Akoon+Tarkwa',
      facilities: ['Borehole Water', 'Security', 'Kitchen', 'Study Room', 'Parking'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Spacious hostel popular among mining & engineering undergraduates, equipped with dedicated study halls and continuous water supply.',
      photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 6800 }, '4-in-a-room': { price: 3800 } },
      verification_status: 'verified', is_published: true, visits: 156,
    },
    {
      name: 'Kingdom Hostel Tarkwa',
      location: 'Brahabebome, Tarkwa', address: 'Near Brahabebome Junction, Tarkwa',
      price_per_year: 4200, rating: 4.5, reviews_count: 19, distance_km: 2.0,
      facilities: ['Wi-Fi', 'CCTV', 'Water', 'Generator', 'Parking'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Secure residential complex featuring gated perimeter, paved compound, and high-speed fibre internet for UMaT students.',
      photos: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 7500 }, '2-in-a-room': { price: 5800 }, '4-in-a-room': { price: 4200 } },
      verification_status: 'verified', is_published: true, visits: 82,
    },
    {
      name: 'Evandy Student Lodge',
      location: 'Yenkea, Tarkwa', address: 'Yenkea Hill Top, Tarkwa',
      price_per_year: 4800, rating: 4.9, reviews_count: 54, distance_km: 1.2,
      facilities: ['Wi-Fi', 'AC', 'Generator', 'Laundry', 'Kitchen'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Executive self-contained rooms with ensuite washrooms, fitted kitchenettes, and high-speed internet near UMaT campus.',
      photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 8800 }, '2-in-a-room': { price: 6400 }, '3-in-a-room': { price: 4800 } },
      verification_status: 'verified', is_published: true, visits: 210,
    },
    {
      name: 'Pentagon Villa Hostel',
      location: 'Adidome Junction, Tarkwa', address: 'Adidome Road, Tarkwa',
      price_per_year: 3500, rating: 4.4, reviews_count: 31, distance_km: 1.8,
      facilities: ['Water', 'Security', 'Common Room', 'Kitchen'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Affordable student hostel offering comfortable rooms, friendly management, and easy proximity to campus transport stops.',
      photos: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 6200 }, '4-in-a-room': { price: 3500 } },
      verification_status: 'verified', is_published: true, visits: 75,
    },
    // 16 Additional Ghanaian Accommodation Hostels (Verification Pending)
    {
      name: 'Akoon Engineering Lodge',
      location: 'Akoon (Mines), Tarkwa', address: 'Block C, Mines Road, Akoon, Tarkwa',
      price_per_year: 3900, rating: 4.3, reviews_count: 14, distance_km: 1.4,
      facilities: ['Wi-Fi', 'Borehole Water', 'Security Guard', 'Solar Backup', 'Study Desks'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Purpose-built accommodation for mining engineering students with continuous solar power backup and quiet study environment.',
      photos: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 5400 }, '4-in-a-room': { price: 3900 } },
      verification_status: 'pending', is_published: true, visits: 45,
    },
    {
      name: 'Brahabebome Heights Lodge',
      location: 'Brahabebome, Tarkwa', address: 'Paa Grant Link, Brahabebome, Tarkwa',
      price_per_year: 4100, rating: 4.2, reviews_count: 18, distance_km: 2.1,
      facilities: ['Water Tank', 'CCTV Security', 'Paved Compound', 'Laundry Area'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Secure, modern student housing near Brahabebome Junction with spacious paved compound and continuous water storage.',
      photos: ['https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 5800 }, '3-in-a-room': { price: 4100 } },
      verification_status: 'pending', is_published: true, visits: 38,
    },
    {
      name: 'Yenkea Executive Student Villa',
      location: 'Yenkea, Tarkwa', address: 'Hilltop Avenue, Yenkea, Tarkwa',
      price_per_year: 5500, rating: 4.6, reviews_count: 22, distance_km: 1.1,
      facilities: ['Wi-Fi', 'Air Conditioning', 'Standby Generator', 'Kitchenette'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Executive student suites featuring private washrooms, fitted kitchenettes, and high-speed Wi-Fi internet.',
      photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 8900 }, '2-in-a-room': { price: 5500 } },
      verification_status: 'pending', is_published: true, visits: 62,
    },
    {
      name: 'Adidome Sunset Lodge',
      location: 'Adidome Junction, Tarkwa', address: 'Plot 8, Adidome Bypass, Tarkwa',
      price_per_year: 3600, rating: 4.1, reviews_count: 11, distance_km: 1.9,
      facilities: ['Borehole Water', '24/7 Security', 'Shared Kitchen', 'Study Room'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Serene student lodging near Adidome Junction with mechanised water supply and dedicated quiet study hall.',
      photos: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 5200 }, '4-in-a-room': { price: 3600 } },
      verification_status: 'pending', is_published: true, visits: 29,
    },
    {
      name: 'Main Gate Scholars Residence',
      location: 'Banso (Main Gate), Tarkwa', address: 'Banso Gate Road, Tarkwa',
      price_per_year: 4800, rating: 4.7, reviews_count: 34, distance_km: 0.4,
      facilities: ['Wi-Fi', 'Generator', '24/7 Water Supply', 'Security Guard', 'Self-Contained'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Located under 5 minutes walk from UMaT main auditorium with round-the-clock security and generator power.',
      photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 8200 }, '2-in-a-room': { price: 6200 }, '3-in-a-room': { price: 4800 } },
      verification_status: 'pending', is_published: true, visits: 110,
    },
    {
      name: 'Paa Grant Court Hostel',
      location: 'Paa Grant, Tarkwa', address: 'Paa Grant Substation Road, Tarkwa',
      price_per_year: 4200, rating: 4.4, reviews_count: 16, distance_km: 0.9,
      facilities: ['CCTV Security', 'Mechanised Borehole', 'Study Hall', 'Laundry Service'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Comfortable student residence with CCTV security monitoring, mechanised borehole, and weekly laundry service.',
      photos: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 5900 }, '4-in-a-room': { price: 4200 } },
      verification_status: 'pending', is_published: true, visits: 48,
    },
    {
      name: 'Ayensu Ridge Student Hall',
      location: 'Ayensu / East Gate, Tarkwa', address: 'Ayensu Ridge, Tarkwa',
      price_per_year: 5000, rating: 4.5, reviews_count: 26, distance_km: 0.7,
      facilities: ['Wi-Fi', 'Standby Generator', 'Paved Compound', 'Balcony Rooms'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Elevated student hall overlooking UMaT East Gate featuring private room balconies and fiber Wi-Fi.',
      photos: ['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 8600 }, '2-in-a-room': { price: 6400 }, '3-in-a-room': { price: 5000 } },
      verification_status: 'pending', is_published: true, visits: 72,
    },
    {
      name: 'Tarkwa Golden Key Lodge',
      location: 'Banso, Tarkwa', address: 'Golden Key Street, Banso, Tarkwa',
      price_per_year: 4400, rating: 4.3, reviews_count: 15, distance_km: 0.6,
      facilities: ['Wi-Fi', 'Borehole Water', 'Security Guard', 'Study Room'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Peaceful student lodge situated in Banso residential area, featuring 24/7 security and high-speed Wi-Fi.',
      photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 6100 }, '4-in-a-room': { price: 4400 } },
      verification_status: 'pending', is_published: true, visits: 54,
    },
    {
      name: 'Mines Campus View Hostel',
      location: 'Akoon (Mines), Tarkwa', address: 'Mines View Road, Akoon, Tarkwa',
      price_per_year: 3700, rating: 4.2, reviews_count: 12, distance_km: 1.6,
      facilities: ['Borehole Water', 'Common Study Lounge', 'Security Guard'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Well-maintained accommodation close to Akoon mining complex with dedicated study hall and security.',
      photos: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 5300 }, '4-in-a-room': { price: 3700 } },
      verification_status: 'pending', is_published: true, visits: 31,
    },
    {
      name: 'Legon Hall Annex (Ghana Hostels Partner)',
      location: 'Legon, Accra', address: 'University of Ghana Campus, Legon, Accra',
      price_per_year: 6800, rating: 4.8, reviews_count: 62, distance_km: 0.1,
      facilities: ['Wi-Fi', 'Air Conditioning', 'Cafeteria', 'CCTV Security', 'Standby Generator'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Official Ghana Hostels Enterprise partner building providing modern air-conditioned accommodation with cafeteria.',
      photos: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 11000 }, '2-in-a-room': { price: 6800 } },
      verification_status: 'pending', is_published: true, visits: 180,
    },
    {
      name: 'KNUST Brunei Complex Annex',
      location: 'Tech Campus, Kumasi', address: 'Brunei Complex Road, KNUST, Kumasi',
      price_per_year: 6200, rating: 4.7, reviews_count: 78, distance_km: 0.2,
      facilities: ['High-Speed Wi-Fi', 'Water Supply', 'Security Guards', 'Study Halls', 'Shuttle Stop'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Popular student residential hall near KNUST central lecture halls with campus shuttle access.',
      photos: ['https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 8500 }, '4-in-a-room': { price: 6200 } },
      verification_status: 'pending', is_published: true, visits: 240,
    },
    {
      name: 'UCC Super Block Lodge',
      location: 'Cape Coast Main Campus', address: 'Super Block Road, UCC, Cape Coast',
      price_per_year: 5400, rating: 4.5, reviews_count: 36, distance_km: 0.3,
      facilities: ['Wi-Fi', 'Constant Water Supply', 'Paved Compound', 'Laundry Room'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Spacious multi-story student lodge near UCC main library with paved compound and security.',
      photos: ['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 7200 }, '3-in-a-room': { price: 5400 } },
      verification_status: 'pending', is_published: true, visits: 95,
    },
    {
      name: 'Valley View Horizon Hall',
      location: 'Oyibi, Greater Accra', address: 'Valley View University Road, Oyibi',
      price_per_year: 5800, rating: 4.6, reviews_count: 28, distance_km: 0.5,
      facilities: ['Wi-Fi', 'Standby Generator', 'Cafeteria', 'CCTV', 'Self-Contained Rooms'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Modern self-contained hall near Valley View University main gate featuring 24/7 power backup.',
      photos: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 9500 }, '2-in-a-room': { price: 5800 } },
      verification_status: 'pending', is_published: true, visits: 88,
    },
    {
      name: 'UHAS Health Sciences Lodge',
      location: 'Ho Main Campus', address: 'Health Sciences Way, UHAS, Ho',
      price_per_year: 4900, rating: 4.5, reviews_count: 21, distance_km: 0.4,
      facilities: ['Wi-Fi', 'Continuous Water Supply', 'Study Desks', 'Security Guard'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Quiet accommodation built for medical and health science undergraduates with study desks and Wi-Fi.',
      photos: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 6500 }, '3-in-a-room': { price: 4900 } },
      verification_status: 'pending', is_published: true, visits: 70,
    },
    {
      name: 'UENR Renewable Energy Lodge',
      location: 'Sunyani Main Campus', address: 'UENR Campus Link, Sunyani',
      price_per_year: 4600, rating: 4.4, reviews_count: 19, distance_km: 0.6,
      facilities: ['Solar Power System', 'Wi-Fi', 'Borehole Water', 'Laundry Space'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Eco-friendly student lodge equipped with full solar power installations and continuous water supply.',
      photos: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 6200 }, '4-in-a-room': { price: 4600 } },
      verification_status: 'pending', is_published: true, visits: 52,
    },
    {
      name: 'Kumasi Royal Tech Hall',
      location: 'Ayigya / Tech Junction, Kumasi', address: 'Tech Junction Road, Ayigya, Kumasi',
      price_per_year: 5900, rating: 4.7, reviews_count: 41, distance_km: 0.8,
      facilities: ['Wi-Fi', 'Generator', 'CCTV', 'Self-Contained Washrooms'],
      manager_id: mId, manager_name: mName, manager_phone: mPhone, manager_email: mEmail,
      description: 'Popular residential building near Ayigya Tech Junction featuring self-contained ensuite washrooms.',
      photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 9200 }, '2-in-a-room': { price: 5900 } },
      verification_status: 'pending', is_published: true, visits: 135,
    }
  ];

  for (const h of ghanaHostels) {
    await safe(supabase.from('hostels').upsert(h, { onConflict: 'name' }));
  }
  console.log('✅ 22 Ghanaian hostels seeded successfully');
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
// Seed demo student
// ─────────────────────────────────────────────
async function seedDemoStudent() {
  const STU_EMAIL = 'student@hostelhub.dev';
  const STU_PASS  = 'Student@Hub2024!';

  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const stuUser = (existing?.users || []).find(u => u.email === STU_EMAIL);

  if (!stuUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: STU_EMAIL, password: STU_PASS, email_confirm: true,
      user_metadata: { name: 'Demo Student', role: 'student' },
    });
    if (error) { console.warn('⚠️  Student seed warn:', error.message); return; }
    await supabase.auth.admin.updateUserById(data.user.id, { app_metadata: { role: 'student', status: 'active' } });
    await safe(supabase.from('user_profiles').insert({ id: data.user.id, email: STU_EMAIL, name: 'Demo Student', role: 'student', status: 'active', phone: '+233 24 000 1111', student_index: 'UMaT/2024/0001', institution: 'University of Mines and Technology', faculty: 'Engineering', department: 'Mining Engineering', level: 'Level 300' }));
    console.log('✅ Demo student created:', STU_EMAIL, '/', STU_PASS);
  } else {
    await supabase.auth.admin.updateUserById(stuUser.id, { app_metadata: { role: 'student', status: 'active' } });
    await safe(supabase.from('user_profiles').upsert({ id: stuUser.id, email: STU_EMAIL, name: stuUser.user_metadata?.name || 'Demo Student', role: 'student', status: 'active' }));
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
    await seedDemoStudent();
    await seedHostels();
  } catch (err) {
    console.warn('⚠️  Supabase connection note (will retry on demand):', err.message);
  }
};

module.exports = connectDB;
