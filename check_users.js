require('dotenv').config();
const supabase = require('./config/supabase');

async function check() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log(`Fetched ${data.users.length} users:`);
    for (const u of data.users) {
      console.log(`- Email: ${u.email}`);
      console.log(`  ID: ${u.id}`);
      console.log(`  app_metadata:`, u.app_metadata);
      console.log(`  user_metadata:`, u.user_metadata);
    }
  }
}

check();
