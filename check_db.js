require('dotenv').config();
const supabase = require('./config/supabase');

async function check() {
  const tables = ['user_profiles', 'student_profiles', 'manager_profiles', 'maintenance_requests', 'managers', 'students', 'hostels'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`❌ Table ${t}: error - ${error.message} (${error.code})`);
    } else {
      console.log(`✅ Table ${t}: exists (count=${data ? data.length : 0})`);
    }
  }
}

check();
