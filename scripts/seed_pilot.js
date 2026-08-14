const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedPilotHostels() {
  console.log('🚀 Preparing Real UMaT Pilot Hostels...');

  const pilotHostels = [
    {
      id: '0d5818fc-905f-4235-a7ed-c6dfc7db0aaa',
      name: 'Royal Gold Student Lodge',
      location: 'Banso',
      address: 'Plot 4, Off Banso-Campus Main Road, Tarkwa',
      description: 'Premium student lodge located within 5 minutes walking distance to UMaT main auditorium. Features 24/7 security guard, high-speed Wi-Fi, constant water supply, and spacious study halls.',
      rules: 'Quiet hours from 10:00 PM. No unauthorized overnight guests. Keep common rooms clean.',
      price_per_year: 4500,
      verification_status: 'verified',
      is_published: true,
      rating: 4.9,
      facilities: ['Wi-Fi', '24/7 Water Supply', 'Security Guard', 'Generator Backup', 'Study Hall', 'Self-Contained Kitchen'],
      photos: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'
      ],
      room_types: {
        '1-in-a-room': { price: 6500, available: 3, occupancy: 1, gender: 'Co-ed' },
        '2-in-a-room': { price: 4500, available: 8, occupancy: 2, gender: 'Co-ed' },
        '4-in-a-room': { price: 3200, available: 12, occupancy: 4, gender: 'Co-ed' }
      },
      verified_at: new Date().toISOString()
    },
    {
      id: '1a5818fc-905f-4235-a7ed-c6dfc7db0bbb',
      name: 'Paa Grant Heights Lodge',
      location: 'Paa Grant',
      address: 'Paa Grant Junction, Near UMaT Substation',
      description: 'Modern 3-storey student accommodation designed for academic comfort. Air-conditioned study rooms, mechanised borehole water, and paved security compound.',
      rules: 'No loud music after 9:00 PM. Rent payable per academic year in advance.',
      price_per_year: 4000,
      verification_status: 'verified',
      is_published: true,
      rating: 4.8,
      facilities: ['Mechanised Borehole', 'Air Conditioning', 'CCTV Security', 'Paved Compound', 'Laundry Area'],
      photos: [
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80'
      ],
      room_types: {
        '2-in-a-room': { price: 4000, available: 6, occupancy: 2, gender: 'Co-ed' },
        '3-in-a-room': { price: 3400, available: 10, occupancy: 3, gender: 'Co-ed' }
      },
      verified_at: new Date().toISOString()
    },
    {
      id: '2b5818fc-905f-4235-a7ed-c6dfc7db0ccc',
      name: 'Banso Excellence Hostel',
      location: 'Banso',
      address: 'Old Library Road, Banso, Tarkwa',
      description: 'Serene atmosphere tailored for focused study. Equipped with solar lighting for load shedding backup, dedicated study desks, and modern sanitation.',
      rules: 'Maintain cleanliness in shared washrooms and kitchen.',
      price_per_year: 3800,
      verification_status: 'verified',
      is_published: true,
      rating: 4.7,
      facilities: ['Solar Backup', 'Study Desks', 'Wi-Fi', 'Constant Water Supply'],
      photos: [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'
      ],
      room_types: {
        '2-in-a-room': { price: 3800, available: 4, occupancy: 2, gender: 'Co-ed' },
        '4-in-a-room': { price: 2800, available: 15, occupancy: 4, gender: 'Co-ed' }
      },
      verified_at: new Date().toISOString()
    }
  ];

  for (const h of pilotHostels) {
    const { error } = await supabase.from('hostels').upsert(h, { onConflict: 'id' });
    if (error) {
      console.warn(`⚠️ Warning upserting ${h.name}:`, error.message);
    } else {
      console.log(`✅ Seeded UMaT Pilot Hostel: ${h.name} (${h.location})`);
    }
  }

  console.log('🎉 UMaT Pilot Hostels Seeded Cleanly into Supabase!');
}

seedPilotHostels().catch(console.error);
