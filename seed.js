require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ghanaianHostels = [
  {
    name: "Victory Hostel",
    location: "Bankyim",
    address: "Bankyim Road, Near UMaT",
    price_per_year: 4500,
    rating: 4.8,
    facilities: ["Wi-Fi", "Security", "Water", "Backup Generator", "Study Room"],
    description: "Victory Hostel is a premium student accommodation offering serene environment and top-notch facilities. Located just 5 minutes from campus.",
    photos: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
    ],
    room_types: {
      galleries: {
        cover: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
        exterior: ["https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"],
        facilities: {
          kitchen: ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80"],
          washroom: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"]
        },
        rooms: {
          "1_in_a_room": ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80"],
          "2_in_a_room": ["https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80"]
        }
      },
      "1_in_a_room": { capacity: 1, available: 5, price: 6000 },
      "2_in_a_room": { capacity: 2, available: 12, price: 4500 }
    }
  },
  {
    name: "Banso Royal Hostel",
    location: "Banso",
    address: "Banso Estate, UMaT",
    price_per_year: 3800,
    rating: 4.5,
    facilities: ["Water", "Security", "Cleaning Service", "TV Room"],
    description: "An affordable, clean, and secure hostel perfect for serious students. Features a large compound and steady water supply.",
    photos: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
    ],
    room_types: {
      galleries: {
        cover: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
        exterior: [],
        facilities: {
          kitchen: [],
          washroom: []
        },
        rooms: {
          "2_in_a_room": ["https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80"],
          "4_in_a_room": ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80"]
        }
      },
      "2_in_a_room": { capacity: 2, available: 8, price: 3800 },
      "4_in_a_room": { capacity: 4, available: 20, price: 2500 }
    }
  }
];

async function seed() {
  console.log('🌱 Starting HostelHub Demo Seeding...');

  // 1. Fetch locations mapping
  const { data: locations } = await supabase.from('locations').select('id, name');
  const locMap = {};
  if (locations) locations.forEach(l => locMap[l.name] = l.id);

  // 2. Insert Hostels
  for (const h of ghanaianHostels) {
    if (locMap[h.location]) {
      h.location_id = locMap[h.location];
    }
    
    // Check if exists
    const { data: exists } = await supabase.from('hostels').select('id').eq('name', h.name).maybeSingle();
    
    if (!exists) {
      const { error } = await supabase.from('hostels').insert(h);
      if (error) console.error(`❌ Failed to seed ${h.name}:`, error.message);
      else console.log(`✅ Seeded hostel: ${h.name}`);
    } else {
      console.log(`⚠️ Hostel ${h.name} already exists. Skipping.`);
    }
  }

  console.log('🎉 Seeding complete!');
}

seed();
