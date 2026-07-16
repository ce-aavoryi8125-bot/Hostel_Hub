const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const supabase = require('./supabase');

// ─────────────────────────────────────────────
// Seed locations from JSON file
// ─────────────────────────────────────────────
async function seedLocations() {
  const { count } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true });

  if (count > 0) return;

  const datasetPath = path.join(__dirname, '..', 'data', 'umat_locations.json');
  const raw = fs.readFileSync(datasetPath, 'utf8');
  const rows = JSON.parse(raw);

  const payload = rows.map((row) => ({
    name: row.name,
    category: row.category,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    students_commonly_live_here: row.students_commonly_live_here || 'Unknown',
    description: row.description || '',
    coordinate_confidence: row.coordinate_confidence || 'Estimated',
    source_note: row.source_note || '',
  }));

  const { error } = await supabase.from('locations').insert(payload);
  if (error) throw error;
  console.log(`✅ Seeded ${payload.length} canonical locations`);
}

// ─────────────────────────────────────────────
// Seed defaults (admin, manager, hostels, transactions)
// ─────────────────────────────────────────────
async function seedDefaults() {
  try {
    await seedLocations();

    // Default admin
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', 'admin@hostelhub.dev')
      .maybeSingle();

    if (!existingAdmin) {
      await supabase.from('admins').insert({
        name: 'Hostel Hub Admin',
        email: 'admin@hostelhub.dev',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      });
      console.log('✅ Default admin seeded');
    }

    // Default manager
    const { data: existingManager } = await supabase
      .from('managers')
      .select('id')
      .eq('email', 'manager@hostelhub.dev')
      .maybeSingle();

    if (!existingManager) {
      await supabase.from('managers').insert({
        name: 'John Owusu',
        email: 'manager@hostelhub.dev',
        phone: '+233 24 111 2222',
        password: await bcrypt.hash('manager123', 10),
        role: 'manager',
        bank_name: 'Ghana Commercial Bank',
        account_name: 'John Owusu Hostel Ventures',
        account_number: '1029384756'
      });
      console.log('✅ Default manager seeded');
    }

    // Default hostels
    const { count: hostelCount } = await supabase
      .from('hostels')
      .select('*', { count: 'exact', head: true });

    if (hostelCount === 0) {
      const { data: manager } = await supabase
        .from('managers')
        .select('id, name, phone, email')
        .eq('email', 'manager@hostelhub.dev')
        .maybeSingle();

      const mId    = manager?.id    || null;
      const mName  = manager?.name  || 'John Owusu';
      const mPhone = manager?.phone || '+233 24 111 2222';
      const mEmail = manager?.email || 'manager@hostelhub.dev';

      const { data: campusLoc } = await supabase
        .from('locations')
        .select('id')
        .eq('name', 'UMaT Main Gate / Campus')
        .maybeSingle();

      const { data: townLoc } = await supabase
        .from('locations')
        .select('id')
        .eq('name', 'Tarkwa (town centre)')
        .maybeSingle();

      const { data: insertedHostels } = await supabase
        .from('hostels')
        .insert([
          {
            name: 'Tarkwa Hostel Haven',
            location_id: campusLoc?.id || null,
            location: 'UMaT Main Gate / Campus',
            address: 'Near UMaT Gate',
            price_per_year: 4500,
            rating: 4.8,
            maps_url: 'https://maps.google.com/?q=Tarkwa+UMaT+Hostel',
            facilities: ['Wi-Fi', 'Power backup', 'Water', 'Security'],
            agent_name: 'Ama Mensah',
            agent_phone: '+233 20 123 4567',
            agent_email: 'ama@hostelhub.dev',
            manager_id: mId,
            manager_name: mName,
            manager_phone: mPhone,
            manager_email: mEmail,
            description: 'Popular hostel near the university for students who want safe, clean accommodation with agent support.',
            photos: [
              'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
              'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'
            ],
            kitchen_photos: ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80'],
            room_types: {
              '1-in-a-room': { price: 9000, gallery: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'] },
              '2-in-a-room': { price: 7000, gallery: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'] },
              '3-in-a-room': { price: 5500, gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] },
              '4-in-a-room': { price: 4500, gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] }
            },
            visits: 0
          },
          {
            name: 'University Vista Lodge',
            location_id: townLoc?.id || null,
            location: 'Tarkwa (town centre)',
            address: 'Opposite UMaT East Gate',
            price_per_year: 5000,
            rating: 4.6,
            maps_url: 'https://maps.google.com/?q=University+Vista+Lodge+Tarkwa',
            facilities: ['Laundry', 'Study hall', 'Water', 'Wi-Fi'],
            agent_name: 'Kwame Boateng',
            agent_phone: '+233 24 987 6543',
            agent_email: 'kwame@hostelhub.dev',
            manager_id: mId,
            manager_name: mName,
            manager_phone: mPhone,
            manager_email: mEmail,
            description: 'A student-friendly lodge with roomy shared spaces and easy access to campus transport.',
            photos: [
              'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
              'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'
            ],
            kitchen_photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'],
            room_types: {
              '2-in-a-room': { price: 8000, gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] },
              '4-in-a-room': { price: 5000, gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] }
            },
            visits: 0
          }
        ])
        .select('id, name');

      // Seed sample transactions
      if (insertedHostels && insertedHostels.length > 0) {
        const firstHostelId = insertedHostels[0].id;
        await supabase.from('transactions').insert([
          {
            manager_id:    mId,
            hostel_id:     firstHostelId,
            hostel_name:   'Tarkwa Hostel Haven',
            type:          'income',
            amount:        4500,
            category:      'Rent Payment',
            description:   '4-in-a-room rent paid by Albert Appiah',
            student_name:  'Albert Appiah',
            student_email: 'albert@umat.edu.gh'
          },
          {
            manager_id:  mId,
            hostel_id:   firstHostelId,
            hostel_name: 'Tarkwa Hostel Haven',
            type:        'expense',
            amount:      120,
            category:    'Electricity',
            description: 'ECG prepaid credit purchase'
          },
          {
            manager_id:  mId,
            hostel_id:   firstHostelId,
            hostel_name: 'Tarkwa Hostel Haven',
            type:        'expense',
            amount:      80,
            category:    'Maintenance',
            description: 'Plumber fee to fix kitchen sink'
          }
        ]);
      }

      console.log('✅ Default hostels and transactions seeded');
    }
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  }
}

// ─────────────────────────────────────────────
// Connect & seed
// ─────────────────────────────────────────────
const connectDB = async () => {
  try {
    // Ping Supabase to verify connection
    const { error } = await supabase.from('admins').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Connected to Supabase');
    await seedDefaults();
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
