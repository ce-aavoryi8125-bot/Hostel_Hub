require('dotenv').config();
const supabase = require('./config/supabase');

async function check() {
  const res = await supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
  console.log('Full Result:', res);
}

check();
