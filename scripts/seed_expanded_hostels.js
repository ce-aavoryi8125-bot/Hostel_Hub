const supabase = require('../config/supabase');

async function seedAllHostels() {
  console.log('🚀 Seeding expanded 22 Ghanaian Hostels...');

  let mId = null;
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  if (authUsers && authUsers.users) {
    const mgr = authUsers.users.find(u => u.email === 'manager@hostelhub.dev');
    if (mgr) mId = mgr.id;
  }
  console.log('Auth Manager User ID:', mId);

  const ghanaHostels = [
    {
      name: 'Banso Royal Student Lodge',
      location: 'Banso (Main Gate), Tarkwa', address: 'Plot 12, UMaT Main Road, Banso, Tarkwa',
      price_per_year: 4500, rating: 4.8,
      facilities: ['Wi-Fi', 'Generator', 'Water', 'Security', 'Study Room', 'Kitchen'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Premier student accommodation situated right near the UMaT Tarkwa main gate with 24/7 security & standby generator.',
      photos: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 8500 }, '2-in-a-room': { price: 6500 }, '4-in-a-room': { price: 4500 } },
      verification_status: 'verified', is_published: true
    },
    {
      name: 'Ayensu Plaza Hostel',
      location: 'Ayensu / East Gate, Tarkwa', address: 'Opposite UMaT East Gate, Ayensu, Tarkwa',
      price_per_year: 5200, rating: 4.7,
      facilities: ['Wi-Fi', 'Water', 'Security', 'Common Room', 'AC', 'CCTV'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Modern multi-story student hostel near UMaT lecture halls with serene study ambiance and private room balconies.',
      photos: ['https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 9200 }, '2-in-a-room': { price: 7000 } },
      verification_status: 'verified', is_published: true
    },
    {
      name: 'Gaza Student Hall (Mines Section)',
      location: 'Akoon (Mines), Tarkwa', address: 'Mines Road, Akoon, Tarkwa',
      price_per_year: 3800, rating: 4.6,
      facilities: ['Borehole Water', 'Security', 'Kitchen', 'Study Room', 'Parking'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Spacious hostel popular among mining & engineering undergraduates, equipped with dedicated study halls.',
      photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 6800 }, '4-in-a-room': { price: 3800 } },
      verification_status: 'verified', is_published: true
    },
    {
      name: 'Kingdom Hostel Tarkwa',
      location: 'Brahabebome, Tarkwa', address: 'Near Brahabebome Junction, Tarkwa',
      price_per_year: 4200, rating: 4.5,
      facilities: ['Wi-Fi', 'CCTV', 'Water', 'Generator', 'Parking'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Secure residential complex featuring gated perimeter, paved compound, and high-speed fibre internet.',
      photos: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 7500 }, '2-in-a-room': { price: 5800 } },
      verification_status: 'verified', is_published: true
    },
    {
      name: 'Evandy Student Lodge',
      location: 'Yenkea, Tarkwa', address: 'Yenkea Hill Top, Tarkwa',
      price_per_year: 4800, rating: 4.9,
      facilities: ['Wi-Fi', 'AC', 'Generator', 'Laundry', 'Kitchen'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Executive self-contained rooms with ensuite washrooms and fitted kitchenettes.',
      photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 8800 }, '2-in-a-room': { price: 6400 } },
      verification_status: 'verified', is_published: true
    },
    {
      name: 'Pentagon Villa Hostel',
      location: 'Adidome Junction, Tarkwa', address: 'Adidome Road, Tarkwa',
      price_per_year: 3500, rating: 4.4,
      facilities: ['Water', 'Security', 'Common Room', 'Kitchen'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Affordable student hostel offering comfortable rooms and friendly management.',
      photos: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 6200 }, '4-in-a-room': { price: 3500 } },
      verification_status: 'verified', is_published: true
    },
    {
      name: 'Akoon Engineering Lodge',
      location: 'Akoon (Mines), Tarkwa', address: 'Block C, Mines Road, Akoon, Tarkwa',
      price_per_year: 3900, rating: 4.3,
      facilities: ['Wi-Fi', 'Borehole Water', 'Security Guard', 'Solar Backup'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Purpose-built accommodation for mining engineering students with continuous solar power backup.',
      photos: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 5400 }, '4-in-a-room': { price: 3900 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'Brahabebome Heights Lodge',
      location: 'Brahabebome, Tarkwa', address: 'Paa Grant Link, Brahabebome, Tarkwa',
      price_per_year: 4100, rating: 4.2,
      facilities: ['Water Tank', 'CCTV Security', 'Paved Compound', 'Laundry Area'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Secure, modern student housing near Brahabebome Junction with spacious paved compound.',
      photos: ['https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 5800 }, '3-in-a-room': { price: 4100 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'Yenkea Executive Student Villa',
      location: 'Yenkea, Tarkwa', address: 'Hilltop Avenue, Yenkea, Tarkwa',
      price_per_year: 5500, rating: 4.6,
      facilities: ['Wi-Fi', 'Air Conditioning', 'Standby Generator', 'Kitchenette'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Executive student suites featuring private washrooms and fitted kitchenettes.',
      photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 8900 }, '2-in-a-room': { price: 5500 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'Adidome Sunset Lodge',
      location: 'Adidome Junction, Tarkwa', address: 'Plot 8, Adidome Bypass, Tarkwa',
      price_per_year: 3600, rating: 4.1,
      facilities: ['Borehole Water', '24/7 Security', 'Shared Kitchen', 'Study Room'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Serene student lodging near Adidome Junction with mechanised water supply.',
      photos: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 5200 }, '4-in-a-room': { price: 3600 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'Main Gate Scholars Residence',
      location: 'Banso (Main Gate), Tarkwa', address: 'Banso Gate Road, Tarkwa',
      price_per_year: 4800, rating: 4.7,
      facilities: ['Wi-Fi', 'Generator', '24/7 Water Supply', 'Security Guard'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Located under 5 minutes walk from UMaT main auditorium with round-the-clock security.',
      photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 8200 }, '2-in-a-room': { price: 6200 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'Paa Grant Court Hostel',
      location: 'Paa Grant, Tarkwa', address: 'Paa Grant Substation Road, Tarkwa',
      price_per_year: 4200, rating: 4.4,
      facilities: ['CCTV Security', 'Mechanised Borehole', 'Study Hall'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Comfortable student residence with CCTV security monitoring and mechanised borehole.',
      photos: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 5900 }, '4-in-a-room': { price: 4200 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'Ayensu Ridge Student Hall',
      location: 'Ayensu / East Gate, Tarkwa', address: 'Ayensu Ridge, Tarkwa',
      price_per_year: 5000, rating: 4.5,
      facilities: ['Wi-Fi', 'Standby Generator', 'Paved Compound', 'Balcony Rooms'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Elevated student hall overlooking UMaT East Gate featuring private room balconies.',
      photos: ['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 8600 }, '2-in-a-room': { price: 6400 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'Tarkwa Golden Key Lodge',
      location: 'Banso, Tarkwa', address: 'Golden Key Street, Banso, Tarkwa',
      price_per_year: 4400, rating: 4.3,
      facilities: ['Wi-Fi', 'Borehole Water', 'Security Guard', 'Study Room'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Peaceful student lodge situated in Banso residential area, featuring 24/7 security.',
      photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 6100 }, '4-in-a-room': { price: 4400 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'Mines Campus View Hostel',
      location: 'Akoon (Mines), Tarkwa', address: 'Mines View Road, Akoon, Tarkwa',
      price_per_year: 3700, rating: 4.2,
      facilities: ['Borehole Water', 'Common Study Lounge', 'Security Guard'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Well-maintained accommodation close to Akoon mining complex with dedicated study hall.',
      photos: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 5300 }, '4-in-a-room': { price: 3700 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'Legon Hall Annex (Ghana Hostels Partner)',
      location: 'Legon, Accra', address: 'University of Ghana Campus, Legon, Accra',
      price_per_year: 6800, rating: 4.8,
      facilities: ['Wi-Fi', 'Air Conditioning', 'Cafeteria', 'CCTV Security', 'Standby Generator'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Official Ghana Hostels Enterprise partner building providing modern air-conditioned accommodation.',
      photos: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 11000 }, '2-in-a-room': { price: 6800 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'KNUST Brunei Complex Annex',
      location: 'Tech Campus, Kumasi', address: 'Brunei Complex Road, KNUST, Kumasi',
      price_per_year: 6200, rating: 4.7,
      facilities: ['High-Speed Wi-Fi', 'Water Supply', 'Security Guards', 'Study Halls'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Popular student residential hall near KNUST central lecture halls with campus shuttle access.',
      photos: ['https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 8500 }, '4-in-a-room': { price: 6200 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'UCC Super Block Lodge',
      location: 'Cape Coast Main Campus', address: 'Super Block Road, UCC, Cape Coast',
      price_per_year: 5400, rating: 4.5,
      facilities: ['Wi-Fi', 'Constant Water Supply', 'Paved Compound', 'Laundry Room'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Spacious multi-story student lodge near UCC main library with paved compound.',
      photos: ['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 7200 }, '3-in-a-room': { price: 5400 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'Valley View Horizon Hall',
      location: 'Oyibi, Greater Accra', address: 'Valley View University Road, Oyibi',
      price_per_year: 5800, rating: 4.6,
      facilities: ['Wi-Fi', 'Standby Generator', 'Cafeteria', 'CCTV'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Modern self-contained hall near Valley View University main gate featuring 24/7 power backup.',
      photos: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 9500 }, '2-in-a-room': { price: 5800 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'UHAS Health Sciences Lodge',
      location: 'Ho Main Campus', address: 'Health Sciences Way, UHAS, Ho',
      price_per_year: 4900, rating: 4.5,
      facilities: ['Wi-Fi', 'Continuous Water Supply', 'Study Desks'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Quiet accommodation built for medical and health science undergraduates with study desks.',
      photos: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 6500 }, '3-in-a-room': { price: 4900 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'UENR Renewable Energy Lodge',
      location: 'Sunyani Main Campus', address: 'UENR Campus Link, Sunyani',
      price_per_year: 4600, rating: 4.4,
      facilities: ['Solar Power System', 'Wi-Fi', 'Borehole Water'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Eco-friendly student lodge equipped with full solar power installations.',
      photos: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'],
      room_types: { '2-in-a-room': { price: 6200 }, '4-in-a-room': { price: 4600 } },
      verification_status: 'pending', is_published: true
    },
    {
      name: 'Kumasi Royal Tech Hall',
      location: 'Ayigya / Tech Junction, Kumasi', address: 'Tech Junction Road, Ayigya, Kumasi',
      price_per_year: 5900, rating: 4.7,
      facilities: ['Wi-Fi', 'Generator', 'CCTV', 'Self-Contained Washrooms'],
      manager_id: mId, manager_name: 'Demo Manager', manager_phone: '+233 24 111 2222', manager_email: 'manager@hostelhub.dev',
      description: 'Popular residential building near Ayigya Tech Junction featuring self-contained ensuite washrooms.',
      photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80'],
      room_types: { '1-in-a-room': { price: 9200 }, '2-in-a-room': { price: 5900 } },
      verification_status: 'pending', is_published: true
    }
  ];

  let successCount = 0;
  for (const h of ghanaHostels) {
    const { data: existing } = await supabase.from('hostels').select('id').eq('name', h.name).maybeSingle();
    if (existing) {
      const { error } = await supabase.from('hostels').update(h).eq('id', existing.id);
      if (error) console.error('Update error:', h.name, error.message);
      else successCount++;
    } else {
      const { error } = await supabase.from('hostels').insert(h);
      if (error) console.error('Insert error:', h.name, error.message);
      else successCount++;
    }
  }
  console.log(`🎉 ${successCount} / ${ghanaHostels.length} Ghanaian Hostels successfully seeded into Supabase DB!`);
}

seedAllHostels().then(() => process.exit(0)).catch(console.error);
