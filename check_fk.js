require('dotenv').config();
const supabase = require('./config/supabase');

async function check() {
  // Check what FK constraints hostels.manager_id has
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'hostels'
        AND tc.constraint_type = 'FOREIGN KEY'
    `
  });
  
  if (error) {
    console.log('RPC error (expected):', error.message);
    // Try direct query
    const { data: d2, error: e2 } = await supabase
      .from('hostels')
      .select('id, manager_id, manager_name')
      .limit(2);
    console.log('Hostels sample:', d2, e2);
  } else {
    console.log('FK Constraints:', data);
  }

  // Try updating manager_id with a UUID that only exists in auth.users
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const manager = users?.users?.find(u => 
    (u.app_metadata?.role || u.user_metadata?.role) === 'manager' &&
    (u.app_metadata?.status) === 'active'
  );
  console.log('\nTrying to assign manager:', manager?.id, manager?.email);
  
  const { data: hostels } = await supabase.from('hostels').select('id, name').limit(1);
  const hostelId = hostels?.[0]?.id;
  console.log('To hostel:', hostelId, hostels?.[0]?.name);
  
  if (manager && hostelId) {
    const { data: updated, error: updateErr } = await supabase
      .from('hostels')
      .update({ manager_id: manager.id, manager_name: manager.user_metadata?.name || manager.email, manager_phone: '', manager_email: manager.email })
      .eq('id', hostelId)
      .select()
      .single();
    if (updateErr) {
      console.log('\n❌ Update error:', updateErr.code, updateErr.message);
      console.log('Details:', updateErr.details);
    } else {
      console.log('\n✅ Update success!');
    }
  }
}

check();
