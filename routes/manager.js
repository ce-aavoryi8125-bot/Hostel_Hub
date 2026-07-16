const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { error } = require('../utils/apiResponse');
const supabase = require('../config/supabase');

const router = express.Router();

router.use(authenticateToken, requireManager);

// ─────────────────────────────────────────────
// MANAGER PROFILE
// ─────────────────────────────────────────────
router.get('/profile', asyncHandler(async (req, res) => {
  const { data: manager } = await supabase
    .from('managers')
    .select('id, name, email, phone, role, bank_name, account_name, account_number')
    .eq('id', req.user.sub)
    .maybeSingle();

  if (!manager) return error(res, 'Manager not found', 404);

  return res.json({
    profile: {
      id: manager.id,
      name: manager.name,
      email: manager.email,
      phone: manager.phone,
      role: manager.role,
      bankDetails: manager.bank_name
        ? { bankName: manager.bank_name, accountName: manager.account_name, accountNumber: manager.account_number }
        : null,
      accountStatus: 'Active'
    }
  });
}));

router.put('/profile', asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const { data: manager } = await supabase.from('managers').select('*').eq('id', req.user.sub).maybeSingle();
  if (!manager) return error(res, 'Manager not found', 404);

  const nextName  = String(name  || manager.name).trim();
  const nextEmail = String(email || manager.email).trim().toLowerCase();
  const nextPhone = String(phone || manager.phone).trim();

  if (!nextName || !nextEmail || !nextPhone) {
    return error(res, 'Name, email, and phone are required', 400);
  }

  const updates = { name: nextName, email: nextEmail, phone: nextPhone };
  if (password && String(password).trim()) {
    updates.password = await bcrypt.hash(String(password).trim(), 10);
  }

  const { data: updated, error: dbErr } = await supabase
    .from('managers')
    .update(updates)
    .eq('id', req.user.sub)
    .select()
    .single();

  if (dbErr) throw dbErr;

  return res.json({
    message: 'Profile updated successfully',
    profile: { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, role: updated.role, accountStatus: 'Active' }
  });
}));

// ─────────────────────────────────────────────
// MANAGER FINANCES (dashboard aggregate)
// ─────────────────────────────────────────────
router.get('/finances', asyncHandler(async (req, res) => {
  const managerId = req.user.sub;

  const { data: manager } = await supabase.from('managers').select('*').eq('id', managerId).maybeSingle();
  if (!manager) return error(res, 'Manager not found', 404);

  // Get hostels owned by this manager
  const { data: hostels } = await supabase.from('hostels').select('id, name').eq('manager_id', managerId);
  const hostelIds = (hostels || []).map(h => h.id);

  // Parallel fetch
  const [{ data: txs }, { data: rooms }, { data: students }, { data: maintenance }, { data: announcements }] = await Promise.all([
    supabase.from('transactions').select('*').eq('manager_id', managerId).order('created_at', { ascending: false }),
    hostelIds.length
      ? supabase.from('rooms').select('*').in('hostel_id', hostelIds).order('room_number', { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase.from('students').select('*').eq('manager_id', managerId).order('created_at', { ascending: false }),
    hostelIds.length
      ? supabase.from('maintenance_requests').select('*').in('hostel_id', hostelIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    hostelIds.length
      ? supabase.from('announcements').select('*').in('hostel_id', hostelIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] })
  ]);

  const allTxs         = txs          || [];
  const allRooms       = rooms        || [];
  const allStudents    = students     || [];
  const allMaintenance = maintenance  || [];
  const allAnnouncements = announcements || [];

  const totalIncome  = allTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = allTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const totalRooms     = allRooms.length;
  const occupiedRooms  = allRooms.filter(r => r.occupied >= r.capacity).length;
  const availableRooms = allRooms.filter(r => r.occupied < r.capacity).length;
  const pendingPayments = allStudents.filter(s => s.balance > 0).length;
  const pendingMaintenance = allMaintenance.filter(m => m.status === 'Pending').length;

  return res.json({
    bankDetails: manager.bank_name
      ? { bankName: manager.bank_name, accountName: manager.account_name, accountNumber: manager.account_number }
      : null,
    transactions:  allTxs,
    hostels:       (hostels || []).map(h => ({ id: h.id, name: h.name })),
    rooms:         allRooms,
    students:      allStudents,
    maintenance:   allMaintenance,
    announcements: allAnnouncements,
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    summary: {
      totalRooms,
      occupiedRooms,
      availableRooms,
      totalStudents: allStudents.length,
      pendingPayments,
      pendingMaintenance
    }
  });
}));

// ─────────────────────────────────────────────
// ROOMS
// ─────────────────────────────────────────────
router.post('/rooms', asyncHandler(async (req, res) => {
  const { hostelId, blockName, roomNumber, capacity, status } = req.body;
  if (!hostelId || !roomNumber || !capacity) return error(res, 'Hostel, room number, and capacity are required', 400);

  const { data: hostel } = await supabase
    .from('hostels')
    .select('id, name')
    .eq('id', hostelId)
    .eq('manager_id', req.user.sub)
    .maybeSingle();

  if (!hostel) return error(res, 'Hostel not found', 404);

  const cap = Number(capacity);
  const { data: room, error: dbErr } = await supabase
    .from('rooms')
    .insert({
      hostel_id:   hostel.id,
      hostel_name: hostel.name,
      block_name:  blockName || 'Main Block',
      room_number: String(roomNumber).trim(),
      capacity:    cap,
      occupied:    0,
      available:   cap,
      status:      status || 'Available'
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Room created successfully', room });
}));

router.get('/rooms', asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id, name').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map(h => h.id);

  if (!hostelIds.length) return res.json({ rooms: [], hostels: [] });

  const { data: rooms, error: dbErr } = await supabase
    .from('rooms')
    .select('*')
    .in('hostel_id', hostelIds)
    .order('room_number', { ascending: true });

  if (dbErr) throw dbErr;
  return res.json({ rooms: rooms || [], hostels: hostels || [] });
}));

router.put('/rooms/:id', asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map(h => h.id);

  if (!hostelIds.length) return error(res, 'Room not found', 404);

  const { data: room, error: dbErr } = await supabase
    .from('rooms')
    .update(req.body)
    .eq('id', req.params.id)
    .in('hostel_id', hostelIds)
    .select()
    .single();

  if (dbErr || !room) return error(res, 'Room not found', 404);
  return res.json({ message: 'Room updated', room });
}));

// ─────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────
router.post('/students', asyncHandler(async (req, res) => {
  const { name, email, phone, studentId, gender, institution, level, emergencyContact, hostelId, hostelName, roomId, roomNumber, balance } = req.body;
  if (!name || !email || !phone || !studentId) return error(res, 'Name, email, phone, and student ID are required', 400);

  if (hostelId) {
    const { data: hostel } = await supabase.from('hostels').select('id').eq('id', hostelId).eq('manager_id', req.user.sub).maybeSingle();
    if (!hostel) return error(res, 'Hostel not found', 404);
  }

  const passwordHash = await bcrypt.hash(String(studentId).slice(0, 6), 10);

  const { data: student, error: dbErr } = await supabase
    .from('students')
    .insert({
      name:              String(name).trim(),
      email:             String(email).trim().toLowerCase(),
      phone:             String(phone).trim(),
      student_id:        String(studentId).trim(),
      password:          passwordHash,
      role:              'student',
      manager_id:        req.user.sub,
      hostel_id:         hostelId || null,
      hostel_name:       hostelName || '',
      room_id:           roomId || null,
      room_number:       roomNumber || '',
      gender:            gender || '',
      institution:       institution || '',
      level:             level || '',
      emergency_contact: emergencyContact || '',
      balance:           Number(balance || 0),
      status:            'Active'
    })
    .select()
    .single();

  if (dbErr) throw dbErr;

  // Update room occupancy
  if (roomId) {
    const { data: room } = await supabase.from('rooms').select('capacity, occupied').eq('id', roomId).maybeSingle();
    if (room) {
      const occupied  = Math.min(room.capacity, (room.occupied || 0) + 1);
      const available = Math.max(0, room.capacity - occupied);
      await supabase.from('rooms').update({
        occupied,
        available,
        status: occupied >= room.capacity ? 'Occupied' : 'Available'
      }).eq('id', roomId);
    }
  }

  return res.status(201).json({ message: 'Resident registered successfully', student });
}));

router.get('/students', asyncHandler(async (req, res) => {
  const { data: students, error: dbErr } = await supabase
    .from('students')
    .select('*')
    .eq('manager_id', req.user.sub)
    .order('created_at', { ascending: false });

  if (dbErr) throw dbErr;
  return res.json({ students: students || [] });
}));

router.put('/students/:id', asyncHandler(async (req, res) => {
  const { data: student, error: dbErr } = await supabase
    .from('students')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('manager_id', req.user.sub)
    .select()
    .single();

  if (dbErr || !student) return error(res, 'Student not found', 404);
  return res.json({ message: 'Student updated', student });
}));

router.delete('/students/:id', asyncHandler(async (req, res) => {
  const { data: student, error: dbErr } = await supabase
    .from('students')
    .delete()
    .eq('id', req.params.id)
    .eq('manager_id', req.user.sub)
    .select()
    .single();

  if (dbErr || !student) return error(res, 'Student not found', 404);
  return res.json({ message: 'Student removed' });
}));

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────
router.post('/payments', asyncHandler(async (req, res) => {
  const { studentId, amount, description, hostelId, hostelName } = req.body;
  if (!studentId || !amount) return error(res, 'Student and amount are required', 400);

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('manager_id', req.user.sub)
    .maybeSingle();

  if (!student) return error(res, 'Student not found', 404);

  const newBalance = Math.max(0, Number(student.balance || 0) - Number(amount));

  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .insert({
      manager_id:    req.user.sub,
      hostel_id:     hostelId || student.hostel_id || null,
      hostel_name:   hostelName || student.hostel_name || 'Hostel',
      type:          'income',
      amount:        Number(amount),
      category:      'Rent Payment',
      description:   description || 'Hostel fee payment',
      student_name:  student.name,
      student_email: student.email,
      student_id:    student.student_id,
      due_amount:    newBalance
    })
    .select()
    .single();

  if (txErr) throw txErr;

  const { data: updatedStudent } = await supabase
    .from('students')
    .update({ balance: newBalance })
    .eq('id', studentId)
    .select()
    .single();

  return res.status(201).json({ message: 'Payment recorded successfully', transaction: tx, student: updatedStudent });
}));

// ─────────────────────────────────────────────
// MAINTENANCE
// ─────────────────────────────────────────────
router.post('/maintenance', asyncHandler(async (req, res) => {
  const { title, description, category, priority, studentId, studentName, hostelId, hostelName } = req.body;
  if (!title || !description) return error(res, 'Title and description are required', 400);

  const { data: request, error: dbErr } = await supabase
    .from('maintenance_requests')
    .insert({
      student_id:   studentId || null,
      student_name: studentName || '',
      hostel_id:    hostelId || null,
      hostel_name:  hostelName || '',
      title:        String(title).trim(),
      description:  String(description).trim(),
      category:     category || 'General',
      priority:     priority || 'Medium',
      status:       'Pending'
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Maintenance request submitted', request });
}));

router.put('/maintenance/:id', asyncHandler(async (req, res) => {
  const { data: request, error: dbErr } = await supabase
    .from('maintenance_requests')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (dbErr || !request) return error(res, 'Maintenance request not found', 404);
  return res.json({ message: 'Maintenance request updated', request });
}));

router.get('/maintenance', asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map(h => h.id);

  if (!hostelIds.length) return res.json({ requests: [] });

  const { data: requests, error: dbErr } = await supabase
    .from('maintenance_requests')
    .select('*')
    .in('hostel_id', hostelIds)
    .order('created_at', { ascending: false });

  if (dbErr) throw dbErr;
  return res.json({ requests: requests || [] });
}));

// ─────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────
router.post('/announcements', asyncHandler(async (req, res) => {
  const { title, message, type, audience } = req.body;
  if (!title || !message) return error(res, 'Title and message are required', 400);

  const { data: announcement, error: dbErr } = await supabase
    .from('announcements')
    .insert({ title, message, type: type || 'General', audience: audience || 'All', created_by: req.user.name || 'Manager' })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ announcement });
}));

router.get('/announcements', asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map(h => h.id);

  if (!hostelIds.length) return res.json({ announcements: [] });

  const { data: announcements, error: dbErr } = await supabase
    .from('announcements')
    .select('*')
    .in('hostel_id', hostelIds)
    .order('created_at', { ascending: false });

  if (dbErr) throw dbErr;
  return res.json({ announcements: announcements || [] });
}));

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────
router.post('/expenses', asyncHandler(async (req, res) => {
  const { hostelId, amount, category, description } = req.body;
  if (!amount || !category || !description) return error(res, 'Amount, category, and description are required', 400);

  const managerId = req.user.sub;
  let hostelName  = 'General Operation';
  let resolvedHostelId = null;

  if (hostelId) {
    const { data: hostel } = await supabase.from('hostels').select('id, name').eq('id', hostelId).eq('manager_id', managerId).maybeSingle();
    if (hostel) { hostelName = hostel.name; resolvedHostelId = hostel.id; }
  }

  const { data: tx, error: dbErr } = await supabase
    .from('transactions')
    .insert({
      manager_id:  managerId,
      hostel_id:   resolvedHostelId,
      hostel_name: hostelName,
      type:        'expense',
      amount:      Number(amount),
      category:    String(category).trim(),
      description: String(description).trim()
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Expense logged successfully', transaction: tx });
}));

// ─────────────────────────────────────────────
// BANK ACCOUNT
// ─────────────────────────────────────────────
router.post('/bank-account', asyncHandler(async (req, res) => {
  const { bankName, accountName, accountNumber } = req.body;
  if (!bankName || !accountName || !accountNumber) return error(res, 'All bank details are required', 400);

  const { data: manager, error: dbErr } = await supabase
    .from('managers')
    .update({
      bank_name:      String(bankName).trim(),
      account_name:   String(accountName).trim(),
      account_number: String(accountNumber).trim()
    })
    .eq('id', req.user.sub)
    .select()
    .single();

  if (dbErr || !manager) return error(res, 'Manager not found', 404);

  return res.json({
    message: 'Bank account linked successfully',
    bankDetails: { bankName: manager.bank_name, accountName: manager.account_name, accountNumber: manager.account_number }
  });
}));

module.exports = router;
