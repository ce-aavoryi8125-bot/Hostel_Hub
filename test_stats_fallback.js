require('dotenv').config();
const supabase = require('./config/supabase');

async function check() {
  try {
    const { data: allUsers, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
      console.log('Error fetching users:', error);
    } else {
      const users = allUsers?.users || [];
      console.log('Users length:', users.length);
      const totalStudents   = users.filter(u => (u.app_metadata?.role || u.user_metadata?.role) === 'student').length;
      const totalManagers   = users.filter(u => (u.app_metadata?.role || u.user_metadata?.role) === 'manager').length;
      const pendingManagers = users.filter(u => (u.app_metadata?.role || u.user_metadata?.role) === 'manager' && (u.app_metadata?.status || u.user_metadata?.status) === 'pending').length;
      console.log('totalStudents:', totalStudents);
      console.log('totalManagers:', totalManagers);
      console.log('pendingManagers:', pendingManagers);
    }
  } catch (e) {
    console.error('Thrown error:', e);
  }
}

check();
