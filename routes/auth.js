const express = require('express');
const bcrypt = require('bcryptjs');
const { createAuthToken, authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { error } = require('../utils/apiResponse');
const supabase = require('../config/supabase');

const router = express.Router();

// ─────────────────────────────────────────────
// SIGN UP
// ─────────────────────────────────────────────
router.post('/signup', asyncHandler(async (req, res) => {
  const { role = 'student', name, email, phone, password, studentId } = req.body;

  if (!name || !email || !phone || !password || (role === 'student' && !studentId)) {
    return error(res, 'All required signup fields must be filled', 400);
  }

  const emailLower = String(email).trim().toLowerCase();

  // Check for duplicate email across all user tables
  const [{ data: dupStudent }, { data: dupManager }, { data: dupAdmin }] = await Promise.all([
    supabase.from('students').select('id').eq('email', emailLower).maybeSingle(),
    supabase.from('managers').select('id').eq('email', emailLower).maybeSingle(),
    supabase.from('admins').select('id').eq('email', emailLower).maybeSingle()
  ]);

  if (dupStudent || dupManager || dupAdmin) {
    return error(res, 'An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (role === 'manager') {
    const { data: manager, error: dbErr } = await supabase
      .from('managers')
      .insert({ name: String(name).trim(), email: emailLower, phone: String(phone).trim(), password: passwordHash, role: 'manager' })
      .select()
      .single();

    if (dbErr) throw dbErr;
    const token = createAuthToken(manager.id, { role: 'manager', name: manager.name });
    return res.status(201).json({ token, user: { id: manager.id, name: manager.name, email: manager.email, role: 'manager' }, message: 'Manager account created' });
  } else {
    const { data: student, error: dbErr } = await supabase
      .from('students')
      .insert({ name: String(name).trim(), email: emailLower, phone: String(phone).trim(), student_id: String(studentId).trim(), password: passwordHash, role: 'student' })
      .select()
      .single();

    if (dbErr) throw dbErr;
    const token = createAuthToken(student.id, { role: 'student', name: student.name });
    return res.status(201).json({ token, user: { id: student.id, name: student.name, email: student.email, role: 'student' }, message: 'Student account created' });
  }
}));

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
router.post('/login', asyncHandler(async (req, res) => {
  const { email = '', password = '' } = req.body;
  const emailLower = String(email).trim().toLowerCase();

  let user = null;
  let role = 'student';

  const { data: student } = await supabase.from('students').select('*').eq('email', emailLower).maybeSingle();
  if (student) { user = student; role = 'student'; }

  if (!user) {
    const { data: manager } = await supabase.from('managers').select('*').eq('email', emailLower).maybeSingle();
    if (manager) { user = manager; role = 'manager'; }
  }

  if (!user) {
    const { data: admin } = await supabase.from('admins').select('*').eq('email', emailLower).maybeSingle();
    if (admin) { user = admin; role = 'admin'; }
  }

  if (!user) return error(res, 'Invalid credentials', 401);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return error(res, 'Invalid credentials', 401);

  const token = createAuthToken(user.id, { role, name: user.name });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role }, message: `${role.charAt(0).toUpperCase() + role.slice(1)} login successful` });
}));

// ─────────────────────────────────────────────
// GET ME
// ─────────────────────────────────────────────
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  let user = null;
  const { role, sub } = req.user;

  if (role === 'manager') {
    const { data } = await supabase.from('managers').select('*').eq('id', sub).maybeSingle();
    user = data;
  } else if (role === 'admin') {
    const { data } = await supabase.from('admins').select('*').eq('id', sub).maybeSingle();
    user = data;
  } else {
    const { data } = await supabase.from('students').select('*').eq('id', sub).maybeSingle();
    user = data;
  }

  if (!user) return error(res, 'User not found', 404);

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      bankDetails: user.bank_name ? { bankName: user.bank_name, accountName: user.account_name, accountNumber: user.account_number } : null,
      phone: user.phone || '',
      hostelName: user.hostel_name || '',
      roomNumber: user.room_number || '',
      balance: user.balance || 0
    }
  });
}));

// ─────────────────────────────────────────────
// STUDENT PORTAL DATA
// ─────────────────────────────────────────────
router.get('/student/portal', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);

  const { data: student } = await supabase.from('students').select('*').eq('id', req.user.sub).maybeSingle();
  if (!student) return error(res, 'Student not found', 404);

  const [{ data: announcements }, { data: maintenance }] = await Promise.all([
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('maintenance_requests').select('*').eq('student_id', student.id).order('created_at', { ascending: false })
  ]);

  return res.json({ student, announcements: announcements || [], maintenance: maintenance || [] });
}));

// ─────────────────────────────────────────────
// UPDATE STUDENT PROFILE
// ─────────────────────────────────────────────
router.put('/student/profile', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);

  const { name, phone, gender, institution, level, emergencyContact } = req.body;
  const updates = {};
  if (name !== undefined)             updates.name              = String(name).trim();
  if (phone !== undefined)            updates.phone             = String(phone).trim();
  if (gender !== undefined)           updates.gender            = gender;
  if (institution !== undefined)      updates.institution       = institution;
  if (level !== undefined)            updates.level             = level;
  if (emergencyContact !== undefined) updates.emergency_contact = emergencyContact;

  const { data: student, error: dbErr } = await supabase
    .from('students')
    .update(updates)
    .eq('id', req.user.sub)
    .select()
    .single();

  if (dbErr) throw dbErr;
  if (!student) return error(res, 'Student not found', 404);
  return res.json({ message: 'Profile updated successfully', student });
}));

// ─────────────────────────────────────────────
// STUDENT MAINTENANCE SUBMISSION
// ─────────────────────────────────────────────
router.post('/student/maintenance', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);

  const { data: student } = await supabase.from('students').select('*').eq('id', req.user.sub).maybeSingle();
  if (!student) return error(res, 'Student not found', 404);

  const { title, description, category = 'General', priority = 'Medium' } = req.body;
  if (!title || !description) return error(res, 'Title and description are required', 400);

  const { data: request, error: dbErr } = await supabase
    .from('maintenance_requests')
    .insert({
      student_id:   student.id,
      student_name: student.name,
      hostel_id:    student.hostel_id || null,
      hostel_name:  student.hostel_name || '',
      title:        String(title).trim(),
      description:  String(description).trim(),
      category,
      priority,
      status:       'Pending'
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Maintenance request submitted', request });
}));

module.exports = router;
