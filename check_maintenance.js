require('dotenv').config();
const supabase = require('./config/supabase');

async function check() {
  // Check maintenance_requests columns
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('maintenance_requests row keys:', data.length ? Object.keys(data[0]) : 'empty');
  }

  // Try inserting a maintenance request
  const { data: ins, error: insErr } = await supabase
    .from('maintenance_requests')
    .insert({
      student_id: '00000000-0000-0000-0000-000000000000',
      student_name: 'Test',
      hostel_id: null,
      hostel_name: '',
      title: 'Test Maintenance',
      description: 'Test description',
      category: 'General',
      priority: 'Low',
      status: 'Pending'
    })
    .select()
    .single();

  if (insErr) {
    console.log('Insert error:', insErr);
    console.log('Insert error code:', insErr.code);
    console.log('Insert error details:', insErr.details);
  } else {
    console.log('Insert success:', ins);
  }
}

check();
